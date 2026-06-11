# Maintainer runbook

## Reviewing a registration PR

### Checklist

- [ ] PR template has been filled out (description, confirmation).
- [ ] The `owner.username` exists on GitHub (visit `https://github.com/<username>`).
- [ ] The `repo` URL is a valid GitHub repo that exists and relates to the description.
- [ ] The `description` is sensible, not spam, and 1–140 characters.
- [ ] The `record` target is controlled by the requester (or is a reasonable service like GitHub Pages / Vercel).
- [ ] The subdomain name passes validation (2–32 chars, lowercase, no reserved names, etc.).
- [ ] The PR does not exceed the per-user cap of 5 (check existing `domains/` files for the same owner).

If everything checks out, approve and merge. If not, leave a comment
explaining what needs to be fixed.

> **Trust but verify.** Most subdomains are benign, but check that
> the record target isn't obviously malicious or pointing to a domain
> the requester doesn't control.

## Handling report-abuse issues

1. **Triage within 24 hours.** Acknowledge the issue.
2. **Verify the abuse claim.** Check the subdomain's content. Take
   screenshots if needed.
3. **If verified:** open a PR to remove the domain file, merge it
   quickly, and close the abuse issue.
4. **Do not disclose the reporter's identity.** GitHub issues are
   public, so be vague about how you were alerted.
5. **If not verified:** explain why and close the issue.

## Handling ownership-transfer issues

1. Wait for **both** the current owner and the new owner to comment
   on the `[TRANSFER]` issue confirming the transfer.
2. Once confirmed, ask the new owner to open a PR updating
   `owner.username` and `owner.email` (if any) on the domain file.
3. Review the PR — it should only change the `owner` field.
4. **Exempt the new owner from the per-user cap** if the transfer
   would push them over 5 (they didn't choose to add a new domain,
   they inherited one).
5. Merge the PR.

## Recovering from a failed deploy

If the deploy workflow fails after merging a PR:

1. Go to **Actions** → failed run → **deploy** job.
2. Check the logs. Common causes:
   - `CF_API_TOKEN` expired → generate a new token and update the
     repo secret.
   - `CF_ZONE_ID` wrong → check it matches the Cloudflare dashboard.
   - Network error → re-run the workflow (Actions → failed run →
     Re-run jobs).
3. If the issue is intermittent, re-run. If persistent, open an
   infra issue.

## Adding a new record type

To add support for a new DNS record type (e.g. `MX`, `ALIAS`):

1. **`util/validate.js`:** add the type to `SUPPORTED_TYPES` and
   write a validation case in `validateRecord()`.
2. **`util/deploy.js`:** ensure `buildAddRequest` / `buildModifyRequest`
   handle the new type (Cloudflare API accepts any valid DNS type).
3. **`util/deploy.js`:** add the type to the delete lookup loop in
   `syncDiff` (`for (const t of ['CNAME', 'A', 'AAAA', 'TXT'])`).
4. **Tests:** add unit tests for validation and deploy logic.
5. **Docs:** update `docs/json-schema.md` with the new type and
   an example.
6. **State:** no changes needed — the state file is type-aware.

## Quarterly review

Every 3 months:

- [ ] Review the [Terms of Service](../TERMS_OF_SERVICE.md) and
      [Code of Conduct](../CODE_OF_CONDUCT.md) — still current?
- [ ] Review the per-user cap — still appropriate?
- [ ] Review the reserved-list — any new entries needed?
- [ ] Run `npm audit` / `dependabot` — update dependencies.
- [ ] Check Cloudflare dashboard — any billing changes or quota
      warnings?
- [ ] Verify `made-in.app` and `www.made-in.app` redirect rules are
      still active.
- [ ] Check domain renewal date (see
      [references/domain-renewal.md](../references/domain-renewal.md)).
