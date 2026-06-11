# Troubleshooting

## PR failed validation

If the CI check on your PR failed, check the CI log for error
messages. Common causes:

- **Invalid subdomain name:** see the naming rules in
  [getting-started.md](getting-started.md#1-pick-a-subdomain).
- **Missing required field:** every registration must have
  `description`, `repo`, `owner`, and `record`.
- **Record has more than one key:** exactly one record type per file
  (e.g. `{"CNAME": "…"}` not `{"CNAME": "…", "A": "…"}`).
- **CNAME points to `made-in.app`:** not allowed.
- **Repository URL is not a valid GitHub URL:** must start with
  `https://github.com/`.
- **Owner username doesn't match your GitHub account:** the PR
  template may require confirmation.
- **Description is too long:** max 140 characters.
- **You already have 5 subdomains:** the per-user cap. Open an issue
  if you need an exception.

Fix the issue, push to your branch again, and the check will
re-run automatically.

## DNS not resolving

If `dig <your-subdomain>.made-in.app @1.1.1.1` returns no answer:

1. **Confirm the PR was merged.** Check that your domain file exists
   in the `main` branch of `made-in.app/register`.
2. **Wait.** The deploy workflow runs within seconds of the merge,
   but DNS propagation can take a few minutes. Wait 5 minutes and
   try again.
3. **Check with Cloudflare's DNS.** Always use `@1.1.1.1` to query
   Cloudflare's resolver directly — your local DNS may be cached.

```
dig <your-subdomain>.made-in.app @1.1.1.1
```

## GitHub Pages "no site here"

If you visit your subdomain and see "There isn't a GitHub Pages site
here":

1. Make sure you've created a GitHub Pages site in your repository
   (Settings → Pages).
2. Add your subdomain as a **Custom domain** in the Pages settings.
   GitHub will prompt you to commit a `CNAME` file.
3. Wait for HTTPS provisioning (can take up to 30 minutes).
4. If the problem persists, remove the custom domain, re-add it, and
   wait again.

## Vercel / Netlify not loading

1. Add your subdomain as a custom domain in your hosting provider's
   dashboard.
2. On Vercel, ensure you've added the domain under your project's
   **Domains** settings.
3. On Netlify, add the domain under **Site settings** → **Domain
   management** → **Add custom domain**.
4. DNS must point to the provider's target (usually a CNAME like
   `cname.vercel-dns.com` or `<site>.netlify.app`). Your registration
   file should match whatever the provider tells you to set.

## Deploy failing

If the deploy workflow (after merge) fails:

1. Go to the **Actions** tab in the `made-in.app/register` repo.
2. Click the failed run and inspect the logs.
3. Common causes:
   - Cloudflare API token expired or revoked.
   - Zone ID misconfigured.
   - GitHub Actions intermittent failure (re-run the workflow).
4. If you can't determine the cause, open an issue with the run URL.

## Changing your record target

Open a new PR that modifies your domain file's `record` field. For
example, to switch from GitHub Pages to Vercel:

```json
{
  "record": { "CNAME": "cname.vercel-dns.com" }
}
```

The CI will validate the new record. Once merged, the deploy
workflow updates the DNS record.

## Transferring ownership

If you want to transfer your subdomain to another GitHub user:

1. Open a `[TRANSFER]` issue using the template.
2. Both current and new owner comment confirming the transfer.
3. The new owner opens a PR updating the `owner.username` field.
4. A maintainer merges the PR.

## Releasing a subdomain

If you no longer need your subdomain:

1. Open a PR that **deletes** your domain file (`domains/<name>.json`).
2. When the PR is merged, the deploy workflow removes the DNS record.
3. The subdomain becomes available for anyone else to claim.
