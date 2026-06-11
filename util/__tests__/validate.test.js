import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSubdomainName, validateRecord, validateRegistration } from '../validate.js';

test('validateSubdomainName: accepts a normal name', () => {
  assert.deepEqual(validateSubdomainName('alice'), { ok: true, errors: [] });
});

test('validateSubdomainName: rejects empty', () => {
  const r = validateSubdomainName('');
  assert.equal(r.ok, false);
  assert.ok(r.errors.length > 0);
});

test('validateSubdomainName: rejects too short', () => {
  const r = validateSubdomainName('a');
  assert.equal(r.ok, false);
});

test('validateSubdomainName: rejects too long', () => {
  const r = validateSubdomainName('a'.repeat(33));
  assert.equal(r.ok, false);
});

test('validateSubdomainName: rejects uppercase', () => {
  const r = validateSubdomainName('Alice');
  assert.equal(r.ok, false);
});

test('validateSubdomainName: rejects leading hyphen', () => {
  const r = validateSubdomainName('-alice');
  assert.equal(r.ok, false);
});

test('validateSubdomainName: rejects trailing hyphen', () => {
  const r = validateSubdomainName('alice-');
  assert.equal(r.ok, false);
});

test('validateSubdomainName: rejects consecutive hyphens', () => {
  const r = validateSubdomainName('al--ice');
  assert.equal(r.ok, false);
});

test('validateSubdomainName: rejects pure numeric', () => {
  const r = validateSubdomainName('12345');
  assert.equal(r.ok, false);
});

test('validateSubdomainName: rejects reserved', () => {
  const r = validateSubdomainName('www');
  assert.equal(r.ok, false);
});

test('validateSubdomainName: accepts 2-char name with letter', () => {
  assert.deepEqual(validateSubdomainName('a1'), { ok: true, errors: [] });
});

test('validateSubdomainName: accepts 32-char name', () => {
  const name = 'a' + 'b'.repeat(31);
  assert.equal(validateSubdomainName(name).ok, true);
});

test('validateSubdomainName: rejects bad characters', () => {
  const r = validateSubdomainName('ali ce');
  assert.equal(r.ok, false);
});

test('validateRecord: accepts valid A record', () => {
  const r = validateRecord({ A: '203.0.113.42' });
  assert.equal(r.ok, true);
});

test('validateRecord: rejects invalid A IPv4', () => {
  const r = validateRecord({ A: '999.0.0.1' });
  assert.equal(r.ok, false);
});

test('validateRecord: rejects A with hostname', () => {
  const r = validateRecord({ A: 'example.com' });
  assert.equal(r.ok, false);
});

test('validateRecord: rejects record with no keys', () => {
  const r = validateRecord({});
  assert.equal(r.ok, false);
});

test('validateRecord: rejects record with multiple keys', () => {
  const r = validateRecord({ A: '1.2.3.4', CNAME: 'x' });
  assert.equal(r.ok, false);
});

test('validateRecord: rejects unknown record type', () => {
  const r = validateRecord({ MX: '10 mail.example.com' });
  assert.equal(r.ok, false);
});

test('validateRecord: accepts valid AAAA record', () => {
  const r = validateRecord({ AAAA: '2001:db8::1' });
  assert.equal(r.ok, true);
});

test('validateRecord: rejects invalid AAAA', () => {
  const r = validateRecord({ AAAA: 'not::an::ip' });
  assert.equal(r.ok, false);
});

test('validateRecord: accepts valid CNAME', () => {
  const r = validateRecord({ CNAME: 'alice.github.io' });
  assert.equal(r.ok, true);
});

test('validateRecord: rejects CNAME pointing to IP literal', () => {
  const r = validateRecord({ CNAME: '1.2.3.4' });
  assert.equal(r.ok, false);
});

test('validateRecord: rejects CNAME with invalid hostname chars', () => {
  const r = validateRecord({ CNAME: 'under_score.example' });
  assert.equal(r.ok, false);
});

test('validateRecord: rejects CNAME pointing to made-in.app', () => {
  const r = validateRecord({ CNAME: 'made-in.app' });
  assert.equal(r.ok, false);
});

test('validateRecord: accepts valid TXT', () => {
  const r = validateRecord({ TXT: 'saas-verify=abc123' });
  assert.equal(r.ok, true);
});

test('validateRecord: rejects TXT over 255 chars', () => {
  const r = validateRecord({ TXT: 'a'.repeat(256) });
  assert.equal(r.ok, false);
});

test('validateRecord: rejects empty TXT', () => {
  const r = validateRecord({ TXT: '' });
  assert.equal(r.ok, false);
});

test('validateRegistration: accepts a complete registration', () => {
  const r = validateRegistration({
    description: 'My portfolio',
    repo: 'https://github.com/alice/alice',
    owner: { username: 'alice' },
    record: { CNAME: 'alice.github.io' },
  });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
});

test('validateRegistration: rejects missing description', () => {
  const r = validateRegistration({
    repo: 'https://github.com/alice/alice',
    owner: { username: 'alice' },
    record: { CNAME: 'alice.github.io' },
  });
  assert.equal(r.ok, false);
});

test('validateRegistration: rejects description over 140 chars', () => {
  const r = validateRegistration({
    description: 'a'.repeat(141),
    repo: 'https://github.com/alice/alice',
    owner: { username: 'alice' },
    record: { CNAME: 'alice.github.io' },
  });
  assert.equal(r.ok, false);
});

test('validateRegistration: rejects non-github repo URL', () => {
  const r = validateRegistration({
    description: 'x',
    repo: 'https://gitlab.com/alice/alice',
    owner: { username: 'alice' },
    record: { CNAME: 'alice.github.io' },
  });
  assert.equal(r.ok, false);
});

test('validateRegistration: rejects non-HTTPS repo URL', () => {
  const r = validateRegistration({
    description: 'x',
    repo: 'http://github.com/alice/alice',
    owner: { username: 'alice' },
    record: { CNAME: 'alice.github.io' },
  });
  assert.equal(r.ok, false);
});

test('validateRegistration: rejects invalid github username', () => {
  const r = validateRegistration({
    description: 'x',
    repo: 'https://github.com/alice/alice',
    owner: { username: '-alice-' },
    record: { CNAME: 'alice.github.io' },
  });
  assert.equal(r.ok, false);
});

test('validateRegistration: accepts optional owner email if valid', () => {
  const r = validateRegistration({
    description: 'x',
    repo: 'https://github.com/alice/alice',
    owner: { username: 'alice', email: 'alice@example.com' },
    record: { CNAME: 'alice.github.io' },
  });
  assert.equal(r.ok, true);
});

test('validateRegistration: rejects invalid owner email', () => {
  const r = validateRegistration({
    description: 'x',
    repo: 'https://github.com/alice/alice',
    owner: { username: 'alice', email: 'not-an-email' },
    record: { CNAME: 'alice.github.io' },
  });
  assert.equal(r.ok, false);
});

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = join(__dirname, '..', 'validate.js');

test('validate CLI: --file accepts a valid registration', () => {
  const path = join(__dirname, 'fixtures', 'valid.json');
  const out = execFileSync('node', [CLI, '--file', path], { encoding: 'utf8' });
  assert.match(out, /OK/);
});

test('validate CLI: --file rejects an invalid registration', () => {
  let exitCode = 0;
  try {
    execFileSync('node', [CLI, '--file', join(__dirname, 'fixtures', 'invalid.json')], { encoding: 'utf8' });
  } catch (err) {
    exitCode = err.status;
  }
  assert.equal(exitCode, 1);
});
