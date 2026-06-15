# Frequently asked questions

## Is this really free?

Yes. The domain is hosted on Cloudflare's Free plan and the project is a personal, not commercial, effort. If hosting costs ever become significant we'll figure out a sustainable model, but for now it's free.

## Why the `.app` TLD?

`.app` is a generic TLD (gTLD) that's widely recognised and a natural fit for a service that hosts apps and sites. Unlike some TLDs, `.app` enforces HTTPS (via the HSTS preload list) which is a security bonus.

## Can I have a wildcard subdomain?

Not in v1. Every subdomain must be registered individually. This keeps the system simple and avoids abuse. Wildcards may be reconsidered in a future version.

## Why the PR-based flow?

- **Trust:** every registration is reviewed by a human.
- **Audit trail:** Git history records every change.
- **Zero cost:** no database, no custom backend.
- **Composable:** built on top of GitHub's collaboration tools.

## Can I have MX records?

Not in v1. Only `A`, `AAAA`, `CNAME`, and `TXT` records are supported. MX support may be added in a future version if there's enough demand.

## What's the per-user cap?

Each GitHub user is limited to **5 subdomains** in v1. This is a soft cap; if you have a legitimate need for more, open an issue and a maintainer can grant an exception.

## Can I sell a subdomain?

No. Subdomains are granted for personal or open-source project use. Selling, auctioning, or trading subdomains is not permitted and will result in revocation.

## Can I use my subdomain for commercial purposes?

Yes, as long as it complies with the [Terms of Service](../TERMS_OF_SERVICE.md) and applicable law. You may host a commercial website, SaaS product, or any other lawful content.

## What if I delete my GitHub account?

Your subdomains will continue to resolve but you will lose the ability to update or transfer them. If you plan to delete your account, transfer ownership first (see [troubleshooting.md](troubleshooting.md#transferring-ownership)).

## How long until DNS propagates?

Typically under 5 minutes globally when using Cloudflare's DNS. Because Cloudflare is an authoritative DNS provider, changes are propagated across their global network very quickly.

## Will there be a website at the apex (`made-in.app`)?

Not in v1. The apex and `www.made-in.app` redirect to the [register repo](https://github.com/ternilabs/made-in.app). A landing page or portal may be built in the future.
