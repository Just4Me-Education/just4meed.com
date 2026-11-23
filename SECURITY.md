# Security policy for just4meed.com

Owner: Just4Me Education. Last reviewed: November 2026.

## What this policy protects

just4meed.com is a public, read-only website. Visitors may:

- view every page,
- follow links,
- watch videos and other content we post.

Everything else is blocked by default. The only code the site runs is its own script files: `site.js` (the "Copy" email buttons, podcast chapter buttons and click-to-play videos) and, on the Level Setting pages, `level-setting/check.js` with its question files. The Dig Site example game (`games/dig-site/`) runs `dig.js` with its question file `questions.js`; like the level checks, it keeps everything in the page's memory and sends nothing. The level checks keep everything in the page's memory, send nothing (the policy's `connect-src 'none'` and `form-action 'none'` still apply), and build the downloaded results file in the browser. The site does not accept forms or uploads, sets no cookies of its own, and runs no analytics. Fonts and images are served from this site, so opening a page sends nothing to Google or any other company.

The one exception is YouTube. Each video shows a still image stored on this site, and the YouTube player loads only when the visitor presses play. From then on YouTube (Google) receives the visitor's IP address and browser details and may store cookies on their device. Like any host, GitHub Pages also sees visitors' IP addresses to serve the pages. The public explanation for families is the privacy notice at [/privacy/](privacy/index.html); keep it in step with this file.

## How the protection works

The site is served by GitHub Pages from the `main` branch of this repository. GitHub Pages does not let us set custom security headers, so the main protection is a **Content Security Policy (CSP)** in a `<meta>` tag at the top of every page. It tells the visitor's browser exactly what the page may load:

| Allowed | From | Why |
|---|---|---|
| Page styles | this site only (`styles.css`, `sample/styles.css`, `fonts/fonts.css`) | Layout and fonts |
| Fonts | this site only (`fonts/`) | Atkinson Hyperlegible and Bricolage Grotesque, stored here so no visit is reported to Google |
| Images | this site, inline icons | Our images, including the video still images |
| Video and audio files | this site | Videos and podcast audio stored in this repo |
| Embedded video players | `www.youtube-nocookie.com` | YouTube videos, loaded only after the visitor presses play |
| Scripts | this site's own files only (`site.js`) | Copy buttons, podcast chapters and click-to-play videos work; injected, inline and outside scripts are blocked |
| Forms, plugins, background connections | **nothing** | Nothing to submit, nothing to leak |

Anything not on that list is refused by the browser, even if someone manages to slip it into a page.

The policy also:

- upgrades any stray `http://` request to `https://`,
- stops the page's base address from being changed (`base-uri 'none'`),
- sends other sites only our domain name, never the full page address, when a visitor follows a link (`referrer` policy).

### Known limits

A policy in a `<meta>` tag cannot do everything a server header can. On GitHub Pages without a proxy in front, these are **not** covered:

- **Clickjacking:** another site could show just4meed.com inside a frame. The risk is low because the site has no buttons that do anything, no logins and no forms.
- **HSTS:** browsers aren't told to always use HTTPS ahead of time. GitHub's "Enforce HTTPS" setting still redirects every `http://` visit.

If the site ever adds sign-in, forms or payments, both gaps must be closed first, by putting a proxy such as Cloudflare in front or by moving to a host that sets headers. See also the Wix section below.

## Adding content

The automated check (`.github/workflows/security-check.yml`) runs on every change and blocks anything that breaks these rules. It also opens the site in Chrome and Chromium (`tests/browser_tests.py`) to confirm visitors can still use every page and that injected code is blocked.

### After editing a .css or .js file

Run `python3 .github/scripts/check_site.py --fix`. It updates the `?v=` stamp on every link to that file. Browsers keep the site's styles and scripts for 10 minutes, and the new stamp makes them load the new version at once, so a page never runs with an old `site.js`. The check fails if a stamp is out of date.

### YouTube video

Videos use click-to-play, so nothing loads from YouTube until the visitor chooses to watch.

1. Save the video's still image in `sample/img/videos/VIDEO_ID.jpg` (360 × 640 for a Short, 640 × 360 for a regular video). Download it once from `https://i.ytimg.com/vi/VIDEO_ID/oar2.jpg` (Shorts) or `hqdefault.jpg` (regular videos). Never link to `i.ytimg.com` from a page: that would tell Google about every visit.
2. Use this template. Replace `VIDEO_ID` and the title in all three places:

```html
<div class="frame"><button type="button" class="yt-play" data-yt="VIDEO_ID" data-title="Video title"
    aria-label="Play video: Video title (plays from YouTube)">
  <img src="img/videos/VIDEO_ID.jpg" width="360" height="640" alt="" loading="lazy">
  <span class="yt-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg></span>
  <span class="yt-note" aria-hidden="true">Plays from YouTube</span>
</button></div>
```

When the button is pressed, `site.js` swaps it for this player. If you ever need a player in the page itself, use exactly this:

```html
<iframe
  src="https://www.youtube-nocookie.com/embed/VIDEO_ID?rel=0"
  title="Describe the video for screen readers"
  width="560" height="315"
  loading="lazy"
  referrerpolicy="strict-origin-when-cross-origin"
  sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
  allow="encrypted-media; picture-in-picture; fullscreen"
  allowfullscreen></iframe>
```

- Use `youtube-nocookie.com`. It cuts down tracking, but YouTube can still store data once a video plays, which is why the click-to-play image comes first.
- Keep `referrerpolicy` as shown. YouTube refuses to play embeds that send no referrer.
- The `sandbox` line lets the player work but stops it from redirecting our page.
- In YouTube Studio, mark each video "Made for kids". That turns off personalized ads and comments on it.

### Video or other files stored in this repo

Put the file in the repo (for example `media/intro.mp4`) and link it with a relative address:

```html
<video controls preload="metadata" width="640">
  <source src="/media/intro.webm" type="video/webm">
  <source src="/media/intro.mp4" type="video/mp4">
</video>
```

Include both formats: Chromium and some Linux browsers can't play MP4 on its own, and older Safari prefers MP4. No policy change is needed. Keep large files out of git where possible: GitHub warns at 50 MB and rejects files over 100 MB.

### Links

- Ordinary links need nothing extra.
- A link that opens a new tab (`target="_blank"`) must also have `rel="noopener"` (add `noreferrer` for links to other sites).
- PDFs and other files in this repo: link to them normally. They open in the browser's own viewer.
- Never use `javascript:` links.

### A new source (Vimeo, a podcast player, analytics, a sign-up form, payments)

Each new service is a conscious decision, not a quick edit:

1. Check what the service collects about visitors. Anything that tracks children needs review against COPPA and our privacy promise before it goes live.
2. Add only the exact address it needs to the matching directive in the CSP `<meta>` tag on **every** page. For example, Vimeo needs `https://player.vimeo.com` added to `frame-src`.
3. Never add `'unsafe-inline'`, `'unsafe-eval'`, `*`, or `http:`. The check rejects them.
4. New page features go in `site.js`. Never use inline `<script>` blocks, `onclick=` attributes, or scripts from other sites; the policy blocks them and the check fails.
5. A form also needs the "Known limits" above closed first, and the check updated on purpose.

## Rules for people who edit the site

- Turn on two-factor authentication for your GitHub account.
- Never put passwords, API keys, family information or student information in this repository, not even briefly. Git history keeps everything.
- Changes go through a pull request, and the security check must pass before merging.
- Don't paste code snippets from third-party sites into pages without review.

Setup steps for the repository and the GitHub organization are in [`docs/security/repo-protections.md`](docs/security/repo-protections.md).

## If the site moves to Wix

Wix serves the site from its own servers and sets most security settings itself. This repository and its checks would then no longer protect the live site. Follow [`docs/security/wix.md`](docs/security/wix.md) before and after the move.

## Reporting a security problem

If you find a security problem with just4meed.com, please tell us privately:

- **Preferred:** [report it privately on GitHub](https://github.com/Just4Me-Education/just4meed.com/security/advisories/new)
- **Email:** memberservice@just4meed.com with "Security" in the subject

Please don't open a public issue. We'll reply within 5 business days and keep you updated until it's fixed. Please don't access anyone else's data, disrupt the site, or run automated scanners at high volume while testing.

The same contact details are published at https://just4meed.com/.well-known/security.txt. Renew its `Expires` date at least once a year; the check warns 30 days before it runs out.
