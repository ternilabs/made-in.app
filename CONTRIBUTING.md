# Contributing

Thanks for your interest in registering a `made-in.app` subdomain.

## Quick start

1. Fork this repository.
2. Add a single file `domains/<your-subdomain>.json` matching the
   [JSON schema](docs/json-schema.md). The filename (minus `.json`)
   is your subdomain.
3. Use only the GitHub account you own as `owner.username`.
4. Open a pull request using the template.
5. Wait for a maintainer review. Most PRs are reviewed within 48h.

## Subdomain rules

- 2 to 32 characters
- Lowercase letters, digits, and hyphens only
- No leading or trailing hyphens
- No consecutive hyphens (`--`)
- Must contain at least one letter
- Not on the [reserved list](docs/json-schema.md#reserved-subdomains)

## Record types

v1 supports `A`, `AAAA`, `CNAME`, and `TXT`. See
[docs/json-schema.md](docs/json-schema.md) for the full schema and
examples.

## Per-user cap

Each GitHub user is limited to **5 subdomains** in v1. The CI posts a
warning if your PR would exceed this; maintainers may grant exceptions.

## Updates, transfers, and releases

- **Update an existing subdomain:** open a PR modifying the file.
- **Transfer ownership:** open a `[TRANSFER]` issue first (see
  `.github/ISSUE_TEMPLATE/ownership-transfer.md`).
- **Release your subdomain:** open a PR deleting the file.

## Reporting abuse

Open a `report-abuse` issue against this repo.

## Documentation

- [Getting started](docs/getting-started.md)
- [JSON schema](docs/json-schema.md)
- [Troubleshooting](docs/troubleshooting.md)
- [FAQ](docs/faq.md)
- [Maintainer runbook](docs/maintainer-runbook.md)

## Code of conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
