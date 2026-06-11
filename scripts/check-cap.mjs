import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const CAP = 5;

export function countOwned(files, username) {
  let n = 0;
  for (const json of files.values()) {
    if (json?.owner?.username === username) n++;
  }
  return n;
}

export function buildWarning(username, count) {
  if (count <= CAP) return null;
  return `Heads up @${username}: you now own ${count} subdomains, which is above the soft cap of ${CAP}. Maintainers may ask you to consolidate.`;
}

function loadFiles(zone = 'domains') {
  const out = new Map();
  let entries;
  try { entries = readdirSync(zone); } catch { return out; }
  for (const e of entries) {
    if (!e.endsWith('.json') || e.startsWith('.')) continue;
    try {
      const content = JSON.parse(readFileSync(join(zone, e), 'utf8'));
      out.set(e, content);
    } catch { /* skip malformed */ }
  }
  return out;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--author' && i + 1 < argv.length) args.author = argv[++i];
    else if (argv[i] === '--zone' && i + 1 < argv.length) args.zone = argv[++i];
  }
  return args;
}

export function main(argv = process.argv) {
  const args = parseArgs(argv);
  if (!args.author) {
    console.error('Usage: check-cap.mjs --author <github-username> [--zone <path>]');
    return 2;
  }
  const files = loadFiles(args.zone);
  const count = countOwned(files, args.author);
  const warning = buildWarning(args.author, count);
  if (warning) {
    console.log(`::warning::${warning}`);
  } else {
    console.log(`OK: @${args.author} owns ${count} subdomain(s) (cap ${CAP}).`);
  }
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main());
}
