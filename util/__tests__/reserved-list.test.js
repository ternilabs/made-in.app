import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RESERVED } from '../reserved-list.js';

describe('reserved list', () => {
  it('RESERVED is a non-empty array of strings', () => {
    assert.ok(Array.isArray(RESERVED));
    assert.ok(RESERVED.length > 0);
    for (const entry of RESERVED) {
      assert.equal(typeof entry, 'string');
    }
  });

  it('RESERVED entries are lowercase', () => {
    for (const entry of RESERVED) {
      assert.equal(entry, entry.toLowerCase());
    }
  });

  it('RESERVED contains required entries', () => {
    const required = [
      'www', 'mail', 'admin', 'api', 'ns', 'mx',
      'docs', 'help', 'support', 'blog', 'abuse',
      'postmaster', 'hostmaster', 'webmaster',
    ];
    for (const entry of required) {
      assert.ok(RESERVED.includes(entry), `missing required entry: ${entry}`);
    }
  });

  it('RESERVED contains no duplicates', () => {
    const seen = new Set();
    for (const entry of RESERVED) {
      assert.ok(!seen.has(entry), `duplicate entry: ${entry}`);
      seen.add(entry);
    }
  });
});
