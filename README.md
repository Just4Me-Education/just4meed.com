# just4meed.com

Placeholder homepage for Just4Me Education, served by GitHub Pages at https://just4meed.com.

- `index.html`: the whole page (no links, no forms, `noindex` for now).
- `CNAME`: tells GitHub Pages to serve this site at just4meed.com.
- The sample demo lives separately at https://demo.just4meed.com (repo `just4me-education-demo`).

## Security

- `SECURITY.md`: what the site allows, how to add videos and links safely, and how to report a problem.
- `styles.css`: the page styles, kept out of `index.html` so the security policy can block all inline code.
- `.well-known/security.txt`: public security contact (renew `Expires` yearly).
- `.github/workflows/security-check.yml`: checks every change, and the live site weekly.
- `docs/security/`: GitHub settings checklist, and a checklist for a move to Wix.
