process.env.CF_API_TOKEN = 'test-token';

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAddRequest, buildModifyRequest, buildDeleteRequest, buildLookupRequest, parseDiff,
  sendWithRetry, syncDiff,
} from '../deploy.js';

test('parseDiff: parses A status with content', () => {
  const diff = [{ status: 'A', file: 'domains/alice.json', content: { record: { A: '1.2.3.4' } } }];
  const r = parseDiff(diff);
  assert.equal(r.length, 1);
  assert.equal(r[0].kind, 'add');
  assert.equal(r[0].name, 'alice');
  assert.equal(r[0].type, 'A');
  assert.equal(r[0].content, '1.2.3.4');
});

test('parseDiff: parses D status without content', () => {
  const r = parseDiff([{ status: 'D', file: 'domains/alice.json' }]);
  assert.equal(r[0].kind, 'delete');
});

test('parseDiff: parses M status with content', () => {
  const r = parseDiff([{ status: 'M', file: 'domains/alice.json', content: { record: { CNAME: 'x.example.com' } } }]);
  assert.equal(r[0].kind, 'modify');
  assert.equal(r[0].type, 'CNAME');
});

test('buildAddRequest: builds correct POST request', () => {
  const req = buildAddRequest({ name: 'alice', type: 'CNAME', content: 'alice.github.io' }, 'ZONE123');
  assert.equal(req.method, 'POST');
  assert.match(req.url, /ZONE123\/dns_records$/);
  const body = JSON.parse(req.body);
  assert.equal(body.type, 'CNAME');
  assert.equal(body.name, 'alice.made-in.app');
  assert.equal(body.content, 'alice.github.io');
  assert.equal(body.ttl, 1);
  assert.equal(body.proxied, false);
});

test('buildModifyRequest: builds correct PUT request', () => {
  const req = buildModifyRequest({ name: 'alice', type: 'CNAME', content: 'x.example.com' }, 'ZONE123', 'REC123');
  assert.equal(req.method, 'PUT');
  assert.match(req.url, /REC123$/);
});

test('buildDeleteRequest: builds correct DELETE request', () => {
  const req = buildDeleteRequest('ZONE123', 'REC123');
  assert.equal(req.method, 'DELETE');
  assert.match(req.url, /REC123$/);
});

test('buildLookupRequest: builds correct GET request', () => {
  const req = buildLookupRequest('ZONE123', 'A', 'alice');
  assert.equal(req.method, 'GET');
  assert.match(req.url, /type=A/);
  assert.match(req.url, /name=alice\.made-in\.app/);
});

test('sendWithRetry: returns result on first success', async () => {
  let calls = 0;
  const fakeFetch = async () => { calls++; return { ok: true, status: 200, text: async () => JSON.stringify({ result: { id: 'r1' } }) }; };
  const r = await sendWithRetry({ method: 'GET', url: 'x', headers: {} }, { fetchImpl: fakeFetch, maxAttempts: 3, sleep: async () => {} });
  assert.equal(r.status, 200);
  assert.equal(calls, 1);
});

test('sendWithRetry: retries 5xx then succeeds', async () => {
  let calls = 0;
  const fakeFetch = async () => {
    calls++;
    if (calls < 3) return { ok: false, status: 500, text: async () => JSON.stringify({ errors: [{ message: 'oops' }] }) };
    return { ok: true, status: 200, text: async () => JSON.stringify({ result: { id: 'r1' } }) };
  };
  const r = await sendWithRetry({ method: 'GET', url: 'x', headers: {} }, { fetchImpl: fakeFetch, maxAttempts: 3, sleep: async () => {} });
  assert.equal(r.status, 200);
  assert.equal(calls, 3);
});

test('sendWithRetry: retries 429 then succeeds', async () => {
  let calls = 0;
  const fakeFetch = async () => {
    calls++;
    if (calls < 2) return { ok: false, status: 429, text: async () => JSON.stringify({ errors: [{ message: 'rate' }] }) };
    return { ok: true, status: 200, text: async () => JSON.stringify({ result: { id: 'r1' } }) };
  };
  const r = await sendWithRetry({ method: 'GET', url: 'x', headers: {} }, { fetchImpl: fakeFetch, maxAttempts: 3, sleep: async () => {} });
  assert.equal(r.status, 200);
});

test('sendWithRetry: does not retry 4xx', async () => {
  let calls = 0;
  const fakeFetch = async () => { calls++; return { ok: false, status: 400, text: async () => JSON.stringify({ errors: [{ message: 'bad' }] }) }; };
  const r = await sendWithRetry({ method: 'POST', url: 'x', headers: {}, body: '{}' }, { fetchImpl: fakeFetch, maxAttempts: 3, sleep: async () => {} });
  assert.equal(r.status, 400);
  assert.equal(calls, 1);
});

test('sendWithRetry: throws after max attempts on persistent 5xx', async () => {
  const fakeFetch = async () => ({ ok: false, status: 503, text: async () => JSON.stringify({ errors: [{ message: 'down' }] }) });
  await assert.rejects(
    sendWithRetry({ method: 'GET', url: 'x', headers: {} }, { fetchImpl: fakeFetch, maxAttempts: 3, sleep: async () => {} }),
    /503/
  );
});

test('syncDiff: adds a new subdomain via POST', async () => {
  const calls = [];
  const fakeFetch = async (url, init) => {
    calls.push({ url, init });
    return { ok: true, status: 200, text: async () => JSON.stringify({ result: { id: 'r-new', name: 'alice.made-in.app' } }) };
  };
  const state = {};
  const result = await syncDiff(
    [{ status: 'A', file: 'domains/alice.json', content: { record: { CNAME: 'alice.github.io' } } }],
    { zoneId: 'Z', fetchImpl: fakeFetch, sleep: async () => {}, state },
  );
  assert.equal(result.added, 1);
  assert.equal(state.alice.id, 'r-new');
});

test('syncDiff: modifies via lookup + PUT', async () => {
  const calls = [];
  const fakeFetch = async (url, init) => {
    calls.push({ url, init });
    if (init.method === 'GET') return { ok: true, status: 200, text: async () => JSON.stringify({ result: [{ id: 'r-old' }] }) };
    return { ok: true, status: 200, text: async () => JSON.stringify({ result: { id: 'r-old' } }) };
  };
  const state = { alice: { id: 'r-old', type: 'CNAME' } };
  const result = await syncDiff(
    [{ status: 'M', file: 'domains/alice.json', content: { record: { CNAME: 'new.example.com' } } }],
    { zoneId: 'Z', fetchImpl: fakeFetch, sleep: async () => {}, state },
  );
  assert.equal(result.modified, 1);
  const putCall = calls.find(c => c.init.method === 'PUT');
  assert.match(putCall.url, /r-old/);
});

test('syncDiff: deletes via lookup + DELETE', async () => {
  const fakeFetch = async (url, init) => {
    if (init.method === 'GET') return { ok: true, status: 200, text: async () => JSON.stringify({ result: [{ id: 'r-del' }] }) };
    return { ok: true, status: 200, text: async () => JSON.stringify({ result: { id: 'r-del' } }) };
  };
  const state = { alice: { id: 'r-del', type: 'CNAME' } };
  const result = await syncDiff(
    [{ status: 'D', file: 'domains/alice.json' }],
    { zoneId: 'Z', fetchImpl: fakeFetch, sleep: async () => {}, state },
  );
  assert.equal(result.deleted, 1);
  assert.equal(state.alice, undefined);
});
