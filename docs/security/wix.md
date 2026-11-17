# Security checklist if just4meed.com moves to Wix

On Wix, Wix's servers deliver the site and Wix decides most security settings. Wix doesn't let site owners set their own Content Security Policy, and Wix pages run Wix's own scripts. So the policy in this repository's `index.html` won't carry over. Protection then comes mostly from locking down the Wix account and keeping what's added to the site to a minimum.

## Before the move

- [ ] Turn on two-factor authentication on every Wix account that can edit the site.
- [ ] Decide who needs access. In **Settings → Roles & Permissions**, give each person the lowest role that works (for example *Website Manager* or *Blog Writer* instead of *Admin*). Only the owner should have *Admin*.
- [ ] Keep the GitHub organization's verified domain for `just4meed.com` (see `repo-protections.md`) even after the move. It stops anyone from claiming the name on GitHub.

## During the move

- [ ] Change the DNS records to Wix's values. Then **remove the custom domain from this repository's Pages settings and delete the `CNAME` file**, so no stale GitHub record points at the domain.
- [ ] Confirm HTTPS is on in Wix (it's on by default for connected domains) and that `http://just4meed.com` redirects to `https://`.
- [ ] Update or remove any CAA DNS record so Wix can get a certificate.

## Keeping the Wix site locked down

The site should still only let visitors view pages, follow links and watch videos.

- [ ] **Videos:** use Wix's own Video Player element with YouTube links. Avoid the *Embed HTML / iframe* element where a built-in element exists.
- [ ] **Custom Code (Settings → Custom Code):** keep it empty. Every snippet runs on every page with full access. If one is ever needed, record who added it, why, and where it came from.
- [ ] **Apps (Wix App Market):** install only what's needed. Each app can collect visitor data, so check its privacy policy against COPPA and our promise before installing. Remove apps that aren't in use.
- [ ] **Forms, Members Area, Wix Payments:** leave them off until there's a reviewed plan for what they collect. Anything that collects information from or about children needs a COPPA review first.
- [ ] **Cookie banner (Settings → Privacy & Cookies):** turn it on if any analytics or marketing tools are added, and default to *essential only*.
- [ ] **Velo (Dev Mode):** if it's ever turned on, keep secrets in the Secrets Manager, never in code, and review every backend function for who's allowed to call it.

## After the move

- [ ] The live-site part of the security check in this repo (`check_site.py --live`) expects the GitHub Pages policy and will start failing. Change the workflow's `live` job to run only the HTTPS and `security.txt` checks, or remove it.
- [ ] Publish the security contact where Wix allows it: at `/.well-known/security.txt` if it can be served, otherwise on a "Security" page with the same text.
- [ ] Review this list every six months, and whenever someone joins or leaves.
