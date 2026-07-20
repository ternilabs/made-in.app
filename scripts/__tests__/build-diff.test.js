import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRecoveryDiff, parseDiff } from '../build-diff.mjs';

test('parseDiff: parses A status with valid JSON content', () => {
  const files = { 'domains/alice.json': JSON.stringify({ record: { A: '1.2.3.4' } }) };
  const r = parseDiff(['A\tdomains/alice.json'], (p) => files[p]);
  assert.equal(r.length, 1);
  assert.equal(r[0].status, 'A');
  assert.equal(r[0].file, 'domains/alice.json');
  assert.deepEqual(r[0].content, { record: { A: '1.2.3.4' } });
});

test('parseDiff: parses M status', () => {
  const files = { 'domains/alice.json': JSON.stringify({ record: { CNAME: 'x.example.com' } }) };
  const r = parseDiff(['M\tdomains/alice.json'], (p) => files[p]);
  assert.equal(r[0].status, 'M');
});

test('parseDiff: parses D status without content', () => {
  const r = parseDiff(['D\tdomains/alice.json'], () => { throw new Error('readFile should not be called for D'); });
  assert.equal(r[0].status, 'D');
  assert.equal(r[0].file, 'domains/alice.json');
  assert.equal(r[0].content, undefined);
});

test('parseDiff: throws on R status', () => {
  assert.throws(() => parseDiff(['R100\tdomains/old.json\tdomains/new.json'], () => ''), /Unsupported status: R/);
});

test('parseDiff: throws on C status', () => {
  assert.throws(() => parseDiff(['C100\tdomains/old.json\tdomains/new.json'], () => ''), /Unsupported status: C/);
});

test('parseDiff: throws on malformed JSON, includes file path in error', () => {
  assert.throws(
    () => parseDiff(['A\tdomains/bad.json'], () => '{ not valid json'),
    /Failed to read domains\/bad\.json/,
  );
});

test('parseDiff: preserves filenames containing tabs by rejoining', () => {
  const files = { 'domains/has\tname.json': JSON.stringify({ record: { A: '1.1.1.1' } }) };
  const r = parseDiff(['A\tdomains/has\tname.json'], (p) => files[p]);
  assert.equal(r[0].file, 'domains/has\tname.json');
});

test('parseDiff: skips empty lines', () => {
  const r = parseDiff(['', 'D\tdomains/a.json', ''], () => { throw new Error('readFile should not be called for D'); });
  assert.equal(r.length, 1);
  assert.equal(r[0].status, 'D');
});

test('buildRecoveryDiff: creates synthetic add diff for one existing domain', () => {
  const files = {
    'domains/podcast-assistant.json': JSON.stringify({ record: { A: '169.58.18.71' } }),
  };
  const r = buildRecoveryDiff('podcast-assistant', (p) => files[p]);
  assert.deepEqual(r, [{
    status: 'A',
    file: 'domains/podcast-assistant.json',
    content: { record: { A: '169.58.18.71' } },
  }]);
});

test('buildRecoveryDiff: rejects invalid domain input before reading files', () => {
  assert.throws(
    () => buildRecoveryDiff('../secrets', () => { throw new Error('readFile should not be called'); }),
    /Invalid recovery domain: Subdomain must contain only lowercase letters, digits, and hyphens\./,
  );
});
