import test from 'node:test';
import assert from 'node:assert/strict';
import { countOwned, buildWarning, main } from '../check-cap.mjs';

test('countOwned: returns count of files for the given username', () => {
  const files = new Map([
    ['alice.json', { owner: { username: 'alice' } }],
    ['bob.json',   { owner: { username: 'bob' } }],
    ['alice2.json',{ owner: { username: 'alice' } }],
  ]);
  assert.equal(countOwned(files, 'alice'), 2);
});

test('countOwned: returns 0 for unknown user', () => {
  const files = new Map([['alice.json', { owner: { username: 'alice' } }]]);
  assert.equal(countOwned(files, 'eve'), 0);
});

test('buildWarning: returns warning text at threshold', () => {
  const w = buildWarning('alice', 5);
  assert.equal(w, null);
});

test('buildWarning: returns warning text above threshold', () => {
  const w = buildWarning('alice', 6);
  assert.match(w, /alice/);
  assert.match(w, /6/);
});

test('buildWarning: returns null below threshold', () => {
  assert.equal(buildWarning('alice', 4), null);
});
