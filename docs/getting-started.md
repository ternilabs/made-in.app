# Getting started

Registering a `made-in.app` subdomain takes about 5 minutes.

## 1. Pick a subdomain

Choose a label (the part before `.made-in.app`) that is:

- 2 to 32 characters
- Lowercase letters, digits, and hyphens only
- Not starting or ending with a hyphen
- Not containing consecutive hyphens
- Not [on the reserved list](json-schema.md#reserved-subdomains)

Examples: `alice`, `alice-blog`, `team-rocket`, `v3-test`.

## 2. Set up your target host

Your `record` field must point at a host you control. Most common:

- **GitHub Pages:** create a repo named `<username>.github.io`, push a static site, and set the custom domain to your subdomain.
- **Vercel / Netlify / Cloudflare Pages:** deploy your project and add your subdomain as a custom domain.
- **Raw IP:** set the `A` (or `AAAA`) record to your server's IP.

For GitHub Pages, the typical `record` is:
```json
{ "CNAME": "<username>.github.io" }
```

## 3. Fork the register repo

Go to https://github.com/ternilabs/made-in.app and click **Fork**.

## 4. Add your registration file

In your fork, create `domains/<your-subdomain>.json` with this
shape:

```json
{
  "description": "One sentence about what you'll host.",
  "repo": "https://github.com/<owner>/<repo>",
  "owner": { "username": "<your-github-username>" },
  "record": { "CNAME": "<username>.github.io" }
}
```

The `repo` field is optional — omit it for private repositories.

See [json-schema.md](json-schema.md) for the full schema and record-type examples.

## 5. Open a pull request

Commit the new file and open a PR against `made-in.app/register`'s `main` branch. Fill in the PR template. A maintainer will review your PR (most are reviewed within 48h).

## 6. Wait for the merge

When your PR is merged, the `deploy` workflow creates your DNS record within seconds. DNS propagation is typically complete globally within 5 minutes. Verify with:

```
dig <your-subdomain>.made-in.app @1.1.1.1
```

## 7. (Optional) Configure your host

If you're using GitHub Pages, add your subdomain as a custom domain in your repo's **Settings** → **Pages**. GitHub will automatically create a `CNAME` file with the subdomain name; commit that file. HTTPS provisioning can take up to 30 minutes.

## Next steps

- Read [json-schema.md](json-schema.md) for all record types.
- Skim [faq.md](faq.md) for common questions.
- If something goes wrong, see [troubleshooting.md](troubleshooting.md).
