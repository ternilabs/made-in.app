import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSubdomainName } from '../validate.js';

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
