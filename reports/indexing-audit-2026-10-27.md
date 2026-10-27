# Indexing and canonical audit — 2026-10-27

Base commit: 9a286b6. Request: investigate the GSC failed validations for 49 redirect URLs and 12 alternate canonical URLs, check SEO configuration and repair confirmed defects.

## What the report actually means

GSC overview last updated October 23: indexed 67; not indexed 68. Exclusions: 49 page-with-redirect, 12 alternate-with-proper-canonical, 7 discovered-not-indexed. The two validation attempts began October 18 and failed October 20. Redirect validation has 7 failed examples and 42 pending; alternate validation has 3 failed and 9 pending.

These validation failures do not establish broken redirects or a penalty. Google continued to find the expected old URL condition. An intentional redirect source is not meant to be indexed; a duplicate alias with the correct canonical is not meant to be independently indexed. Do not remove valid canonical tags or restore duplicate pages merely to make these categories green.

## Evidence collected

- All 74 canonical sitemap URLs: HTTP 200 without redirects, self-canonical, no robots/header noindex detected, reciprocal English/Chinese alternates. Local source validation: zero errors/warnings.
- All 49 GSC redirect examples and all 12 alternate examples were checked with full HTTP redirect chains. All ended in HTTP 200. Of the 49 historical redirect examples, 46 still redirected (307); 3 now served duplicate root content. The 12 alternate URLs returned 200 with the expected canonical. None was a canonical sitemap URL.
- GSC index inspection for `/en/uk-sellers`: discovered through sitemap, not yet crawled/indexed. This is a genuine visibility limitation separate from the old URL exclusions. The other discovered examples are EN China sellers, EN EPR vs VAT, EN Zalando, ZH China sellers, ZH Zalando and ZH UK sellers.
- Deployment check confirms Cloudflare Workers Builds, using static assets. There is no source Worker handler or Wrangler configuration in this repository.
- HTTP, www and `/en/` duplicates were still accessible. Canonical tags consolidate them, but permanent redirects provide a clearer migration signal.

Raw URL lists, GSC snapshots, validation details, pre-fix source report, HTML responses and the 135-URL HTTP audit are preserved in `C:/Users/Xin Chang/Documents/Codex/seo-audit-2026-10-27/`. These are point-in-time observations, not evidence of future indexing.

## Repair

- Add 81 explicit `_redirects` rules: known HTML aliases, English home aliases, and Chinese home aliases go straight to the existing HTTPS non-www canonical URL using 301. Canonical sitemap URLs are not redirected. No wildcard catch-all or language-based redirect is introduced.
- Correct the English homepage WebPage identifier from `/en/#webpage` to `/#webpage`, consistent with its canonical root. Keep the legacy HTML source copy synchronized.
- Extend `scripts/check_seo.py` to detect redirecting canonical pages, noncanonical internal aliases, mismatched structured page identifiers/social URLs, duplicate rules, nonpermanent rules and missing HTML/home alias rules.
- Domain/scheme normalization for ordinary HTTP and www URLs requires a Cloudflare zone redirect rule; `_redirects` cannot condition on host or protocol. Prepare that separately and verify access before claiming it is applied. At audit time the Cloudflare dashboard requires user sign-in.

## Acceptance checks

Run the repository check before commit. After deployment, test all 74 canonical URLs and all 61 GSC examples again, including loop/chain detection. Test query preservation and the English/Chinese homepage destinations. Expected: canonical pages remain 200/self-canonical; known legacy HTML aliases permanently redirect to the correct page; English home aliases lead to `/`, never to Chinese home. Only claim domain normalization after its separate live verification.

Do not restart all-known-URLs validation for expected redirects or proper-canonical aliases: the condition is intentionally retained. Check the canonical destination's indexing instead. GSC may continue displaying historical exclusions and failed validation until its data changes; no immediate green status is promised.

## Official references

- [Google page indexing report](https://support.google.com/webmasters/answer/7440203?hl=en): exclusion reasons and validation lifecycle.
- [Cloudflare Workers static asset redirects](https://developers.cloudflare.com/workers/static-assets/redirects/): redirect file syntax, precedence and lack of domain-level conditions.
