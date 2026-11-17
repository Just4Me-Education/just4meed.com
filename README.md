# just4meed.com

Placeholder homepage for Just4Me Education, served by GitHub Pages at https://just4meed.com.

- `index.html`: the whole page (no links, no forms, `noindex` for now).
- `CNAME`: tells GitHub Pages to serve this site at just4meed.com.
- The sample demo lives separately at https://demo.just4meed.com (repo `just4me-education-demo`).

## Security

- `SECURITY.md`: what the site allows, how to add videos and links safely, and how to report a problem.
- `styles.css`: the page styles, kept out of `index.html` so the security policy can block all inline code.
- `.well-known/security.txt`: public security contact (renew `Expires` yearly).
- `.github/workflows/security-check.yml`: checks every change, runs the browser tests in Chrome and Chromium, and checks the live site weekly.
- `tests/browser_tests.py`: browser tests that visitors can read the page, follow links and watch videos (including accessibility, mobile and dark mode), and that injected code is blocked.
- `favicon.svg`: the site icon.
- `docs/security/`: GitHub settings checklist, and a checklist for a move to Wix.
