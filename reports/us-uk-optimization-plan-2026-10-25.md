# US / UK SEO and AI search execution plan

Prepared 2026-10-25. Base release: 6ac2062. The user authorized continued optimization with a plan followed by phased execution. Existing URLs, EU-wide service positioning, separate GPSR pricing and PPWR EPR mandate scope remain the basis for this work.

## Acceptance criteria

Preserve the six US/UK groups in the original dual-track checklist: Belgium authorised representative (US/UK), Belgium EPR registration (US/UK), EU EPR for US companies, EU EPR for UK sellers. Each group requires its fixed organic query in the top three AND an explicit BelComply recommendation for its paired AI question. Record citation links separately from named recommendations. Do not replace these with easier queries or GSC average positions. Repeat observations on separate dates before describing success as sustained. Google decides rankings and inclusion; no guaranteed outcome or deadline.

Keep the original 2026-10-17 baseline and the 2026-10-25 retest. Market parameters are not proof of a US/UK IP. A confirmed local-market environment is still required before claiming local-market validation. Track qualified US/UK enquiries separately; no traffic-to-enquiry attribution is currently established.

## Sequence and decision gates

1. **P0 / index and canonical evidence.** Inspect the US, UK and Belgium landing URLs in GSC. Record indexing, last crawl and selected canonical. Diagnose actual failures before changes. Index overview dated October 16 cannot establish the October 25 state.
2. **P0 / positioning correction.** Remove remaining Belgium Focus metadata from overseas landing pages; align titles, social metadata and WebPage/Service names. Keep existing canonical and hreflang URLs. This implements the user's already-approved EU-wide positioning.
3. **P1 / useful landing content and contextual links.** Make the existing US/UK pages answer who BelComply supports, which work can be scoped, what to prepare and where to go next. Use existing approved services, clear English, separate national routes and links to relevant guides. Add bilingual counterparts. No invented service promises, turnaround, prices, credentials or endorsements. Keep service pages commercial and guides explanatory. Use the existing design components and existing URL structure.
4. **P1 / credible evidence.** Audit company identity and official source links; identify the precise missing proof. New case studies, credentials, substantive business claims, major restructuring and third-party outreach require factual input or a concrete user decision before publication. Do not manufacture reviews or backlinks.
5. **Measurement / feedback.** Record actual release time. Observe GSC crawl/indexing first, then fixed-query/AI results at day 7 and day 14 after that release, using comparable markets/language/device. Compare GSC query-by-page-by-country data over complete windows; low volume and query mix limit inference. If pages remain indexed but do not rank, inspect intent, evidence and competing results before another content batch.

## Effort allocation (planning estimate, not Google factor weights)

- 20% indexing, canonical and measurement verification.
- 40% differentiated US/UK landing content and useful decision material.
- 20% contextual links and service/guide topic ownership.
- 15% verifiable company and external trust evidence.
- 5% metadata/schema consistency and regression checks.

There is no evidence that these percentages represent causal ranking contribution. Today's observations establish low US/UK visibility, not its single cause. Prioritize controllable defects and evaluate hypotheses after recrawling.

## Release checks

Each coherent batch gets a reversible commit. Run scripts/check_seo.py, inspect the diff, verify bilingual synchronization and browser desktop/mobile layout for visible changes. Verify live HTTP/content after deployment. Update only the lastmod entries of genuinely changed pages. A successful technical check is not evidence of ranking or AI inclusion.

## Source basis

- [Google Search Essentials](https://developers.google.com/search/docs/essentials): helpful content, descriptive titles and crawlable links.
- [Google AI optimization guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide): indexing and useful, reliable content remain foundational; no special AI text-file or schema shortcut guarantees inclusion.
- GSC and fixed-query evidence: outputs/retest-2026-10-25-1042 in the original task output directory.

## Progress

- Plan recorded before implementation.
- Confirmed defect: US, UK and China English service metadata retains Belgium Focus; Chinese counterparts already describe EU27 coverage.
- GSC US landing URL: URL is on Google (current inspection); crawl/canonical details pending capture.
