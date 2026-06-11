import { RESERVED } from './reserved-list.js';

const NAME_RE = /^[a-z0-9-]+$/;
const PURE_NUMERIC_RE = /^[0-9]+$/;
const CONSECUTIVE_HYPHEN_RE = /--/;
const LEADING_TRAILING_HYPHEN_RE = /^-|-$/;

export function validateSubdomainName(name) {
  const errors = [];
  if (typeof name !== 'string' || name.length === 0) {
    errors.push('Subdomain must be a non-empty string.');
    return { ok: false, errors };
  }
  const lower = name.toLowerCase();
  if (lower !== name) {
    errors.push('Subdomain must be lowercase.');
  }
  if (lower.length < 2 || lower.length > 32) {
    errors.push('Subdomain must be between 2 and 32 characters.');
  }
  if (!NAME_RE.test(lower)) {
    errors.push('Subdomain must contain only lowercase letters, digits, and hyphens.');
  }
  if (LEADING_TRAILING_HYPHEN_RE.test(lower)) {
    errors.push('Subdomain must not start or end with a hyphen.');
  }
  if (CONSECUTIVE_HYPHEN_RE.test(lower)) {
    errors.push('Subdomain must not contain consecutive hyphens.');
  }
  if (PURE_NUMERIC_RE.test(lower)) {
    errors.push('Subdomain must contain at least one letter.');
  }
  if (RESERVED.includes(lower)) {
    errors.push('This subdomain is reserved and cannot be claimed.');
  }
  return { ok: errors.length === 0, errors };
}
