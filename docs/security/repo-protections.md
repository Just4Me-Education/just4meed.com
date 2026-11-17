# Repository and organization protections

These settings live in GitHub, not in files, so someone with admin rights has to turn them on. Work through the list once, then review it every six months. Tick items off here in a pull request as they're done.

## 1. Organization (Just4Me-Education → Settings)

- [ ] **Authentication security → Require two-factor authentication** for everyone in the organization.
- [ ] **Pages → Add a verified domain:** verify `just4meed.com`. This stops anyone else on GitHub from taking over the domain or a subdomain such as `demo.just4meed.com` if a Pages site is ever switched off. Do this first; it's the most important item here.
- [ ] **Member privileges → Base permissions:** set to *Read*. Give write or admin access per repository, only to the people who need it.
- [ ] **Actions → General:** allow only actions created by GitHub and verified creators. Set default workflow permissions to *Read repository contents*.

## 2. This repository (Settings)

- [ ] **General → Default branch:** the default branch is currently `claude/project-thread-mbp78d`, and the live site is built from it. Rename it to `main` (Settings → Branches → rename), then confirm **Pages** still shows `main` as its source.
- [ ] **Rules → Rulesets → New branch ruleset** targeting the default branch:
  - Require a pull request before merging (1 approval once there's a second editor).
  - Require status checks to pass: `security-check`.
  - Block force pushes. Restrict deletions.
- [ ] **Pages:** tick **Enforce HTTPS**. Keep the custom domain set to `just4meed.com`.
- [ ] **Advanced Security** (Code security):
  - Private vulnerability reporting: **Enable**. `SECURITY.md` and `security.txt` link to it.
  - Dependabot alerts and Dependabot security updates: **Enable**.
  - Secret scanning and Push protection: **Enable**. This blocks pushes that contain passwords or keys.
- [ ] **Actions → General → Fork pull request workflows:** require approval for all outside collaborators.
- [ ] **Collaborators and teams:** remove anyone who no longer needs access.

## 3. Domain and DNS (at the registrar)

- [ ] Turn on two-factor authentication on the registrar account, and turn on registrar lock (transfer lock).
- [ ] Point records only at things you control. Don't use wildcard (`*.just4meed.com`) records. Delete records for anything that's been shut down, so a stale record can't be claimed by someone else.
- [ ] Optional: add a CAA record allowing only `letsencrypt.org` (GitHub Pages' certificate provider). If the site moves to Wix, update it to Wix's certificate provider first.

## 4. The demo site (demo.just4meed.com)

The demo lives in the separate `just4me-education-demo` repository. Apply sections 2 and 3 there as well, and copy in `SECURITY.md`, the CSP `<meta>` tag and the security check workflow.

## What runs automatically

| File | What it does |
|---|---|
| `.github/workflows/security-check.yml` | On every pull request and push: checks every page follows the policy. Weekly and after each push to the default branch: also checks the live site (HTTPS redirect, policy served, `security.txt` valid). |
| `.github/scripts/check_site.py` | The checks themselves. Run `python3 .github/scripts/check_site.py --live` locally to try it. |
| `.github/dependabot.yml` | Opens pull requests when the GitHub Actions used by the workflow get security updates. |
