import { RESERVED } from './reserved-list.js';

const NAME_RE = /^[a-z0-9-]+$/;
const PURE_NUMERIC_RE = /^[0-9]+$/;
const CONSECUTIVE_HYPHEN_RE = /--/;
const LEADING_TRAILING_HYPHEN_RE = /^-|-$/;

const SUPPORTED_TYPES = new Set(['A', 'AAAA', 'CNAME', 'TXT']);

const IPV4_RE = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d)$/;

const IPV6_RE = /^(?:[0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}$|^[0-9a-fA-F:]+::[0-9a-fA-F:]*$|^::1$|^::$/;

const HOSTNAME_RE = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

const MADE_IN_APP_RE = /(?:^|\.)made-in\.app$/;

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

export function validateRecord(record) {
  const errors = [];

  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    errors.push('Record must be a non-null object.');
    return { ok: false, errors };
  }

  const keys = Object.keys(record);
  if (keys.length !== 1) {
    errors.push('Record must have exactly one key.');
    return { ok: false, errors };
  }

  const type = keys[0];
  const value = record[type];

  if (typeof value !== 'string') {
    errors.push('Record value must be a string.');
    return { ok: false, errors };
  }

  if (!SUPPORTED_TYPES.has(type)) {
    errors.push(`Unsupported record type: ${type}.`);
    return { ok: false, errors };
  }

  switch (type) {
    case 'A':
      if (!IPV4_RE.test(value)) {
        errors.push('A record must be a valid IPv4 address.');
      }
      break;
    case 'AAAA':
      if (!IPV6_RE.test(value)) {
        errors.push('AAAA record must be a valid IPv6 address.');
      }
      break;
    case 'CNAME':
      if (IPV4_RE.test(value)) {
        errors.push('CNAME record must not be an IP address.');
      } else if (!HOSTNAME_RE.test(value)) {
        errors.push('CNAME record must be a valid hostname.');
      } else if (MADE_IN_APP_RE.test(value)) {
        errors.push('CNAME record must not point to made-in.app.');
      }
      break;
    case 'TXT':
      if (value.length === 0) {
        errors.push('TXT record must not be empty.');
      } else if (value.length > 255) {
        errors.push('TXT record must be at most 255 characters.');
      }
      break;
  }

  return { ok: errors.length === 0, errors };
}
