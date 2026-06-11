import { readFileSync } from 'node:fs';

const API_BASE = 'https://api.cloudflare.com/client/v4';
const ZONE_SUFFIX = '.made-in.app';
const RETRY_DELAYS_MS = [1000, 2000, 4000];

export function parseDiff(rawDiff) {
  return rawDiff.map((entry) => {
    const name = entry.file.split('/').pop().replace(/\.json$/, '');
    if (entry.status === 'D') {
      return { kind: 'delete', name, file: entry.file };
    }
    const record = entry.content?.record;
    if (!record) {
      throw new Error(`Entry ${entry.file} has status ${entry.status} but no record.`);
    }
    const types = Object.keys(record);
    if (types.length !== 1) {
      throw new Error(`Entry ${entry.file} record must have exactly one key.`);
    }
    const type = types[0];
    return {
      kind: entry.status === 'A' ? 'add' : 'modify',
      name, file: entry.file, type, content: record[type],
    };
  });
}

function getToken() {
  const t = process.env.CF_API_TOKEN;
  if (!t) throw new Error('CF_API_TOKEN environment variable is required.');
  return t;
}

function makeHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

export function buildAddRequest(op, zoneId) {
  return {
    method: 'POST',
    url: `${API_BASE}/zones/${zoneId}/dns_records`,
    headers: makeHeaders(getToken()),
    body: JSON.stringify({ type: op.type, name: `${op.name}${ZONE_SUFFIX}`, content: op.content, ttl: 1, proxied: false }),
  };
}

export function buildModifyRequest(op, zoneId, recordId) {
  return {
    method: 'PUT',
    url: `${API_BASE}/zones/${zoneId}/dns_records/${recordId}`,
    headers: makeHeaders(getToken()),
    body: JSON.stringify({ type: op.type, name: `${op.name}${ZONE_SUFFIX}`, content: op.content, ttl: 1, proxied: false }),
  };
}

export function buildDeleteRequest(zoneId, recordId) {
  return {
    method: 'DELETE',
    url: `${API_BASE}/zones/${zoneId}/dns_records/${recordId}`,
    headers: makeHeaders(getToken()),
  };
}

export function buildLookupRequest(zoneId, type, name) {
  const u = new URL(`${API_BASE}/zones/${zoneId}/dns_records`);
  u.searchParams.set('type', type);
  u.searchParams.set('name', `${name}${ZONE_SUFFIX}`);
  return {
    method: 'GET',
    url: u.toString(),
    headers: makeHeaders(getToken()),
  };
}

async function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendWithRetry(request, opts = {}) {
  const fetchImpl = opts.fetchImpl || globalThis.fetch;
  const sleep = opts.sleep || defaultSleep;
  const maxAttempts = opts.maxAttempts || 3;
  let last;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const init = { method: request.method, headers: request.headers };
    if (request.body !== undefined) init.body = request.body;
    const res = await fetchImpl(request.url, init);
    const rawBody = await res.text();
    let body;
    try { body = JSON.parse(rawBody); } catch { body = { raw: rawBody }; }
    const wrapped = { ok: res.ok, status: res.status, body, rawBody };
    if (res.ok) return wrapped;
    last = wrapped;
    if (res.status >= 400 && res.status < 500 && res.status !== 429) return wrapped;
    if (attempt < maxAttempts - 1) {
      const delay = RETRY_DELAYS_MS[attempt] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
      await sleep(delay);
    }
  }
  const err = new Error(`Request failed after ${maxAttempts} attempts: ${last?.status} ${JSON.stringify(last?.body)}`);
  err.lastResponse = last;
  throw err;
}

export async function syncDiff(rawDiff, opts) {
  const { zoneId, fetchImpl = globalThis.fetch, sleep, state } = opts;
  const sendOpts = { fetchImpl, sleep, maxAttempts: 3 };
  const ops = parseDiff(rawDiff);
  let added = 0, modified = 0, deleted = 0;
  for (const op of ops) {
    if (op.kind === 'add') {
      const req = buildAddRequest(op, zoneId);
      const res = await sendWithRetry(req, sendOpts);
      state[op.name] = { id: res.body.result.id, type: op.type };
      added++;
    } else if (op.kind === 'modify') {
      let recordId = state[op.name]?.id;
      if (!recordId) {
        const lookup = buildLookupRequest(zoneId, op.type, op.name);
        const res = await sendWithRetry(lookup, sendOpts);
        recordId = res.body.result?.[0]?.id;
        if (!recordId) throw new Error(`Cannot modify ${op.name}: no existing record found.`);
      }
      const req = buildModifyRequest(op, zoneId, recordId);
      await sendWithRetry(req, sendOpts);
      state[op.name] = { id: recordId, type: op.type };
      modified++;
    } else if (op.kind === 'delete') {
      let recordId = state[op.name]?.id;
      if (!recordId) {
        for (const t of ['CNAME', 'A', 'AAAA', 'TXT']) {
          const lookup = buildLookupRequest(zoneId, t, op.name);
          const res = await sendWithRetry(lookup, sendOpts);
          if (res.body.result?.length > 0) {
            recordId = res.body.result[0].id;
            break;
          }
        }
        if (!recordId) {
          delete state[op.name];
          deleted++;
          continue;
        }
      }
      const req = buildDeleteRequest(zoneId, recordId);
      await sendWithRetry(req, sendOpts);
      delete state[op.name];
      deleted++;
    }
  }
  return { added, modified, deleted };
}

async function main(argv = process.argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--diff' && i + 1 < argv.length) args.diff = argv[++i];
    else if (a === '--update-state') args.updateState = true;
    else if (a === '--dry-run') args.dryRun = true;
  }
  const zoneId = process.env.CF_ZONE_ID;
  if (!zoneId && !args.dryRun) {
    console.error('CF_ZONE_ID env var is required.');
    return 2;
  }
  if (args.diff || args.dryRun) {
    const raw = args.diff ? JSON.parse(readFileSync(args.diff, 'utf8')) : [];
    if (args.dryRun) {
      console.log(JSON.stringify({ dryRun: true, entries: raw.length }));
      return 0;
    }
    const state = JSON.parse(readFileSync('domains/.state.json', 'utf8')) || {};
    delete state._comment;
    const result = await syncDiff(raw, { zoneId, state, sleep: defaultSleep });
    console.log(JSON.stringify(result));
    return 0;
  }
  if (args.updateState) {
    console.error('--update-state is not yet implemented as a CLI flag; use syncDiff from code.');
    return 2;
  }
  console.error('Usage: deploy.js --diff <file> [--dry-run]');
  return 2;
}

export { main };

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then(code => process.exit(code)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
