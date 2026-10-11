# Off-site checklist (for Mostafa)

Things only you can do. None of these should be faked — add a profile to `SAME_AS` (`src/lib/site.ts`) only once it
really exists.

## Once

- [ ] **Set `NEXT_PUBLIC_SITE_URL`** in Cloudflare Pages → Settings → Variables (Production) to the real domain,
      e.g. `https://yourdomain.com` (no trailing slash), then redeploy. Canonicals, hreflang, sitemap, JSON-LD and
      `/llms.txt` all use it; without it they fall back to the request host and pages render per request.
- [ ] **Google Search Console**: add the domain, submit `https://yourdomain.com/sitemap.xml`, inspect `/` and `/ru`.
- [ ] **Bing Webmaster Tools**: import from Search Console or add the site; submit the sitemap
      (ChatGPT Search and Copilot lean on Bing).
- [ ] **Yandex Webmaster** (Russian audience): add the site and submit the sitemap.
- [ ] **LinkedIn**: paste the one-liner (see `GEO.md`) into About; put the site URL in Contact info → Website;
      add the CV and best posts to Featured.
- [ ] **GitHub**: same one-liner in the bio; site URL in the profile; a pinned repo or profile README describing your
      BLE / WebRTC / FFI work.
- [ ] **Update the CV PDFs** (`public/Mostafa_Omar_CV_EN.pdf`, `…_RU.pdf`): new phone number and the site URL.

## Ongoing (quality over volume)

- [ ] Share every new blog post on LinkedIn with the post link (the preview uses the post's image).
- [ ] Answer Flutter / BLE / FFI questions on Stack Overflow, Reddit (r/FlutterDev) or GitHub Discussions when you
      genuinely can — link a post only when it actually answers the question.
- [ ] Optional profiles once you use them for real: Medium or dev.to cross-posts (with a canonical link back to your
      post), a YouTube walkthrough with the full transcript in the description, X/Twitter.
- [ ] Ask past clients or colleagues for LinkedIn recommendations (real ones only).
- [ ] Every Monday: run the weekly prompts in `GEO.md` and fill `citation-ledger.csv`.
