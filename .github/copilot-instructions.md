# Reviewer and AI-assistant instructions

This document is the canonical source of truth for reviewing or generating pull requests against this repository. It is intended for both human maintainers and AI reviewers (Copilot, etc.). When in doubt, follow the strictest interpretation.

## Validation rules

All `domains/<name>.json` files must pass `util/validate.js`. The CLI is the source of truth — read its error messages before guessing.

- **Subdomain name:** 2–32 chars, lowercase, alphanumeric + hyphens, no leading/trailing hyphens, no consecutive hyphens, must contain at least one letter, must not be pure numeric, must not be on the reserved list.
- **Record:** exactly one key, one of `A`, `AAAA`, `CNAME`, `TXT`. Value must be a string.
  - `A`: valid IPv4.
  - `AAAA`: valid IPv6.
  - `CNAME`: valid hostname, not an IP, must not point to `made-in.app` or any subdomain thereof.
  - `TXT`: 1–255 chars.
- **Description:** 1–140 chars, no control characters.
- **Owner.username:** valid GitHub username (1–39 chars, `[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])`).
- **Owner.email:** if present, valid email.
- **Repo:** if present, valid HTTPS GitHub URL.

## Reserved subdomains

The list in `util/reserved-list.js` is authoritative. Do not register any of these. To add a reserved name, edit that file and submit a separate PR.

## Per-user cap

Each GitHub user may own at most 5 subdomains. The CI posts a `::warning::` annotation when the cap is exceeded, but the cap race is known — see `docs/maintainer-runbook.md` → "Known limitations".

## Ownership transfers

MUST go through the `[TRANSFER]` issue template with dual confirmation (both `@old-user` and `@new-user` comment on the issue). A PR opened without a preceding confirmed issue is grounds to close without review. The new owner may be exempted from the per-user cap by the maintainer; do not enforce it on transfer PRs.

## Trusted maintainers

See `CODEOWNERS`. PRs that touch `util/`, `scripts/`, or workflows require their review.

## CI error message canon

When reviewing CI logs, the exact strings a reviewer should expect:

- From `util/validate.js`:
  - `Subdomain must be lowercase.`
  - `Subdomain must be between 2 and 32 characters.`
  - `Subdomain must contain only lowercase letters, digits, and hyphens.`
  - `Subdomain must not start or end with a hyphen.`
  - `Subdomain must not contain consecutive hyphens.`
  - `Subdomain must contain at least one letter.`
  - `This subdomain is reserved and cannot be claimed.`
  - `Record must have exactly one key.`
  - `A record must be a valid IPv4 address.`
  - `AAAA record must be a valid IPv6 address.`
  - `CNAME record must not be an IP address.`
  - `CNAME record must be a valid hostname.`
  - `CNAME record must not point to made-in.app.`
  - `TXT record must be between 1 and 255 characters.`
  - `Description must be between 1 and 140 characters.`
  - `Repo must be a valid HTTPS GitHub URL.`
  - `Owner username must be a valid GitHub username.`
  - `owner.username "<X>" does not match PR author "<Y>".` ← cross-check (new)

- From `scripts/check-cap.mjs`:
  - `::warning::Heads up @<user>: you now own <N> subdomains, which is above the soft cap of 5.`
