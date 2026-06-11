import { RESERVED } from './reserved-list.js';
import { isIPv6 } from 'node:net';
import { readFileSync } from 'node:fs';

const NAME_RE = /^[a-z0-9-]+$/;
const PURE_NUMERIC_RE = /^[0-9]+$/;
const CONSECUTIVE_HYPHEN_RE = /--/;
const LEADING_TRAILING_HYPHEN_RE = /^-|-$/;

const SUPPORTED_TYPES = new Set(['A', 'AAAA', 'CNAME', 'TXT']);

const IPV4_RE = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d)$/;

const IPV6_RE = isIPv6;

const HOSTNAME_RE = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

const MADE_IN_APP_RE = /(?:^|\.)made-in\.app$/;

const GH_USER_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
const GH_REPO_RE = /^https:\/\/github\.com\/[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\/[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\/?$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
      if (!IPV6_RE(value)) {
        errors.push('AAAA record must be a valid IPv6 address.');
      }
      break;
    case 'CNAME':
      if (IPV4_RE.test(value) || IPV6_RE(value)) {
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

export function validateDescription(value) {
  if (typeof value !== 'string') return 'Description must be a string.';
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > 140) return 'Description must be between 1 and 140 characters.';
  if (/[\x00-\x1f]/.test(value)) return 'Description must not contain control characters.';
  return null;
}

export function validateRepo(value) {
  if (value === undefined) return null;
  if (typeof value !== 'string') return 'Repo must be a string.';
  if (!GH_REPO_RE.test(value)) return 'Repo must be a valid HTTPS GitHub URL.';
  return null;
}

export function validateOwner(owner) {
  if (!owner || typeof owner !== 'object' || Array.isArray(owner)) return 'Owner must be an object.';
  if (typeof owner.username !== 'string' || !GH_USER_RE.test(owner.username)) return 'Owner username must be a valid GitHub username.';
  if (owner.email !== undefined) {
    if (typeof owner.email !== 'string' || !EMAIL_RE.test(owner.email)) return 'Owner email must be a valid email address.';
  }
  return null;
}

export function validateRegistration(json) {
  const errors = [];
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    errors.push('Registration must be a non-null object.');
    return { ok: false, errors };
  }
  const descErr = validateDescription(json.description);
  if (descErr) errors.push(descErr);
  if (json.repo !== undefined) {
    const repoErr = validateRepo(json.repo);
    if (repoErr) errors.push(repoErr);
  }
  const ownerErr = validateOwner(json.owner);
  if (ownerErr) errors.push(ownerErr);
  const recordResult = validateRecord(json.record);
  if (!recordResult.ok) errors.push(...recordResult.errors);
  return { ok: errors.length === 0, errors };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--file' && i + 1 < argv.length) args.file = argv[++i];
    if (a === '--name' && i + 1 < argv.length) args.name = argv[++i];
  }
  return args;
}

export function main(argv = process.argv) {
  const args = parseArgs(argv);
  if (args.file) {
    try {
      const subdomain = args.file.split('/').pop().replace(/\.json$/, '');
      const raw = readFileSync(args.file, 'utf8');
      const json = JSON.parse(raw);
      const nameResult = validateSubdomainName(subdomain);
      const regResult = validateRegistration(json);
      const errors = [...nameResult.errors, ...regResult.errors];
      if (errors.length > 0) {
        for (const e of errors) console.error(`- ${e}`);
        return 1;
      }
      console.log(`OK: ${subdomain}`);
      return 0;
    } catch (err) {
      console.error(`Error: ${err.message}`);
      return 1;
    }
  }
  if (args.name) {
    const r = validateSubdomainName(args.name);
    if (!r.ok) {
      for (const e of r.errors) console.error(`- ${e}`);
      return 1;
    }
    console.log(`OK: ${args.name}`);
    return 0;
  }
  console.error('Usage: validate.js --file <path> | --name <name>');
  return 2;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main());
}
