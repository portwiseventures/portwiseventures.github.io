
# Trade Intelligence Centre: how content works

All guides live in `intel-content.json`. Running `python3 tools/build_intel.py` (or the GitHub Action) turns that file into the
static pages: `intelligence.html`, `intelligence-<topic>.html`, `intel-<slug>.html`, plus `intel-index.json` (search), the homepage
strip and the sitemap. **Do not edit the generated pages by hand: edit `intel-content.json` and rebuild.**

## Add a guide (copy an existing entry in `articles` and change it)
Required: `slug` (lowercase-with-dashes, unique), `category` (market-insights | commodity-trends | regulations | country-trade | industry-reports | sustainable-materials),
`title`, `summary`, `published`, `updated` (YYYY-MM-DD), `tags`, `sections` (each `h` + `p` paragraphs and/or `ul` bullets), `takeaways` (3+), `sources` (1+ official/reputable links), `related_tools`.
In text, `**bold**` and `[label](https://link)` are supported. `related_tools` hrefs must be existing pages (the build fails on a broken link).

## Editorial rules (keep the section trustworthy)
1. Every guide cites at least one official or reputable source, and shows its update date.
2. No statistics, prices, rates or deadlines unless you can name the source and date. Re-check time-sensitive facts before each update.
3. Say "general information, not legal advice" (added automatically). Do not promise outcomes.
4. When rules change, change `updated` and the text, then rebuild.

## Publish an industry report
Add to `reports`: `{"title": "...", "date": "YYYY-MM-DD", "summary": "...", "link": "https://... or file.pdf"}`. Until then the page shows an honest empty state.
