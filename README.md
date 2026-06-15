[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/G2G81U8M9Z)

# made-in.app

Free subdomain registration for `made-in.app`.

## How it works

1. Fork this repo.
2. Add a `domains/<your-subdomain>.json` file (see [docs/json-schema.md](docs/json-schema.md)).
3. Open a pull request.
4. A maintainer reviews and merges.
5. On merge, a GitHub Action creates the DNS record automatically.

### Example registration

Create `domains/your-subdomain.json` with this structure:

```json
{
  "description": "My personal site",
  "owner": { "username": "your-github-username" },
  "record": { "CNAME": "your-username.github.io" }
}
```

See [docs/json-schema.md](docs/json-schema.md) for the full schema (record types, optional `repo` field, description length limits).

DNS propagation typically takes 1–5 minutes after merge.

## Documentation

- [Getting started](docs/getting-started.md)
- [JSON schema](docs/json-schema.md)
- [Troubleshooting](docs/troubleshooting.md)
- [FAQ](docs/faq.md)
- [Maintainer runbook](docs/maintainer-runbook.md)

## License

This is a source-available project. You can use it and modify it for personal, non-commercial purposes, but you may not redistribute it or claim it as your own. See the [LICENSE](blob/main/LICENSE) file for full details.

## Code of conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). By participating you agree to its terms.
