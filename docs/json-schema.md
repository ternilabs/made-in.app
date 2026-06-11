# JSON schema reference

Every registration file (`domains/<subdomain>.json`) must be a valid
JSON object with the following fields.

## Top-level fields

| Field         | Type   | Required | Description |
|---------------|--------|----------|-------------|
| `description` | string | yes      | One-line summary of what you'll host (1–140 chars, no control characters). |
| `repo`        | string | yes      | HTTPS URL to the GitHub repository for the project. |
| `owner`       | object | yes      | GitHub account that controls the subdomain (see below). |
| `record`      | object | yes      | DNS record to create (exactly one key, see below). |

## `owner` object

| Field      | Type   | Required | Description |
|------------|--------|----------|-------------|
| `username` | string | yes      | GitHub username (must match your GitHub account). |
| `email`    | string | no       | Contact email (used for abuse reports; kept private). |

- `username` must be 1–39 characters and match `[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])`.
- `email` must be a valid email address if present.

## `record` object

Must contain exactly one key. The key is the DNS record type and the
value is the target.

| Type    | Value format       | Example                          |
|---------|--------------------|----------------------------------|
| `A`     | IPv4 address       | `"185.199.108.153"`             |
| `AAAA`  | IPv6 address       | `"2606:50c0:8000::153"`         |
| `CNAME` | Hostname           | `"username.github.io"`           |
| `TXT`   | Arbitrary text     | `"v=spf1 -all"`                 |

### `A` — IPv4 address

```json
{ "record": { "A": "185.199.108.153" } }
```

### `AAAA` — IPv6 address

```json
{ "record": { "AAAA": "2606:50c0:8000::153" } }
```

### `CNAME` — canonical name

Must be a valid hostname and must NOT be an IP address or point to
`made-in.app` or any subdomain thereof.

```json
{ "record": { "CNAME": "username.github.io" } }
```

### `TXT` — text record

Must be 1–255 characters.

```json
{ "record": { "TXT": "v=spf1 include:_spf.google.com ~all" } }
```

## Example: complete registration

```json
{
  "description": "My personal blog and portfolio",
  "repo": "https://github.com/alice/alice.github.io",
  "owner": {
    "username": "alice"
  },
  "record": {
    "CNAME": "alice.github.io"
  }
}
```

## Reserved subdomains

These subdomains cannot be claimed:

```
www, mail, ftp, smtp, imap, pop, pop3,
admin, administrator, root, api,
ns, ns1, ns2, dns, mx, _dmarc, _domainkey, _acme-challenge,
status, blog, docs, help, support,
made-in, made, in, app,
cdn, static, assets, media, files,
sh, ssh, login, signup, auth, account, accounts,
billing, api-docs, swagger, openapi,
terms, privacy, security, abuse,
postmaster, hostmaster, webmaster,
no-reply, noreply
```

This list is maintained in [`util/reserved-list.js`](../util/reserved-list.js).
