# Security policy for just4meed.com

Owner: Just4Me Education. Last reviewed: November 2026.

## What this policy protects

just4meed.com is a public, read-only website. Visitors may:

- view every page,
- follow links,
- watch videos and other content we post.

Everything else is blocked by default. In particular, the site does not run any scripts of its own, does not accept forms or uploads, does not set cookies, and does not collect any visitor or student information. Just4Me's promise to families is privacy first, and the public website keeps that promise by collecting nothing.

## How the protection works

The site is served by GitHub Pages from this repository. GitHub Pages does not let us set custom security headers, so the main protection is a **Content Security Policy (CSP)** in a `<meta>` tag at the top of every page. It tells the visitor's browser exactly what the page may load:

| Allowed | From | Why |
|---|---|---|
| Page styles | this site (`styles.css`), Google Fonts | Layout and fonts |
| Fonts | `fonts.gstatic.com` | Google Fonts files |
| Images | this site, inline icons, `i.ytimg.com` | Our images and YouTube thumbnails |
| Video and audio files | this site | Videos stored in this repo |
| Embedded video players | `www.youtube-nocookie.com`, `www.youtube.com` | YouTube videos |
| Scripts | **nothing** | Blocks injected or malicious code |
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

The automated check (`.github/workflows/security-check.yml`) runs on every change and blocks anything that breaks these rules.

### YouTube video

Use this template. Replace `VIDEO_ID` and the title:

```html
<iframe
  src="https://www.youtube-nocookie.com/embed/VIDEO_ID"
  title="Describe the video for screen readers"
  width="560" height="315"
  loading="lazy"
  referrerpolicy="strict-origin-when-cross-origin"
  sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
  allow="encrypted-media; picture-in-picture; fullscreen"
  allowfullscreen></iframe>
```

- Use `youtube-nocookie.com`. It doesn't set tracking cookies until the visitor presses play, which fits our privacy promise.
- Keep `referrerpolicy` as shown. YouTube refuses to play embeds that send no referrer.
- The `sandbox` line lets the player work but stops it from redirecting our page.

### Video or other files stored in this repo

Put the file in the repo (for example `media/intro.mp4`) and link it with a relative address:

```html
<video src="/media/intro.mp4" controls preload="metadata"></video>
```

No policy change is needed. Keep large files out of git where possible: GitHub warns at 50 MB and rejects files over 100 MB.

### Links

- Ordinary links need nothing extra.
- A link that opens a new tab (`target="_blank"`) must also have `rel="noopener noreferrer"`.
- Never use `javascript:` links.

### A new source (Vimeo, a podcast player, analytics, a sign-up form, payments)

Each new service is a conscious decision, not a quick edit:

1. Check what the service collects about visitors. Anything that tracks children needs review against COPPA and our privacy promise before it goes live.
2. Add only the exact address it needs to the matching directive in the CSP `<meta>` tag on **every** page. For example, Vimeo needs `https://player.vimeo.com` added to `frame-src`.
3. Never add `'unsafe-inline'`, `'unsafe-eval'`, `*`, or `http:`. The check rejects them.
4. A form or a script also needs the "Known limits" above closed first, and the check updated on purpose.

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
