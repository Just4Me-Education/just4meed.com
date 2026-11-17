#!/usr/bin/env python3
"""Security checks for just4meed.com.

  python3 .github/scripts/check_site.py          # check the HTML files in this repo
  python3 .github/scripts/check_site.py --live   # also check the live site

Exits non-zero if any check fails. Standard library only.
"""
import datetime
import html.parser
import pathlib
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
SITE = "https://just4meed.com"

# Directives every page's policy must contain exactly as written.
REQUIRED = {
    "default-src": "'none'",
    "script-src": "'self'",
    "object-src": "'none'",
    "base-uri": "'none'",
}
# Values that would undo the policy. Never allowed anywhere in it.
FORBIDDEN_VALUES = ["'unsafe-inline'", "'unsafe-eval'", "'unsafe-hashes'", "*", "http:", "data:"]
# data: is fine for images only (small inline icons).
DATA_OK_IN = {"img-src"}

failures = []


def fail(where, msg):
    failures.append(f"{where}: {msg}")


def parse_csp(value):
    out = {}
    for part in value.split(";"):
        bits = part.split()
        if bits:
            out[bits[0].lower()] = bits[1:]
    return out


class PageScan(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tags = []  # (tag, attrs dict, line)

    def handle_starttag(self, tag, attrs):
        d = {k.lower(): (v or "") for k, v in attrs}
        self.tags.append((tag, d, self.getpos()[0]))

    handle_startendtag = handle_starttag


def host_allowed(url, sources):
    p = urllib.parse.urlparse(url)
    if p.scheme == "" and not url.startswith("//"):
        return "'self'" in sources  # relative URL = this site
    if p.scheme != "https":
        return False
    origin = f"https://{p.netloc}"
    return origin in sources or "https:" in sources


def check_html(name, text, reference_csp=None):
    scan = PageScan()
    scan.feed(text)

    csp_tags = [d for t, d, _ in scan.tags
                if t == "meta" and d.get("http-equiv", "").lower() == "content-security-policy"]
    if len(csp_tags) != 1:
        fail(name, f"needs exactly one Content-Security-Policy meta tag, found {len(csp_tags)}")
        return None
    csp_text = " ".join(csp_tags[0]["content"].split())
    csp = parse_csp(csp_text)

    # The policy only covers what comes after it, so it must be right after <meta charset>.
    metas = [(t, d) for t, d, _ in scan.tags if t not in ("html", "head")][:2]
    if not (metas and "charset" in metas[0][1] and len(metas) > 1
            and metas[1][1].get("http-equiv", "").lower() == "content-security-policy"):
        fail(name, "the Content-Security-Policy meta tag must come right after <meta charset>")

    for k, v in REQUIRED.items():
        if csp.get(k) != [v]:
            fail(name, f"policy must contain \"{k} {v}\"")
    for k, vals in csp.items():
        for bad in FORBIDDEN_VALUES:
            if bad in vals and not (bad == "data:" and k in DATA_OK_IN):
                fail(name, f"policy directive {k} must not allow {bad}")
    if reference_csp is not None and csp_text != reference_csp:
        fail(name, "policy differs from index.html; every page must use the same policy")

    if not any(t == "meta" and d.get("name") == "referrer" for t, d, _ in scan.tags):
        fail(name, "missing <meta name=\"referrer\" content=\"strict-origin-when-cross-origin\">")

    frame_src = csp.get("frame-src", [])
    for tag, d, line in scan.tags:
        at = f"{name}:{line}"
        if tag == "script":
            src = d.get("src", "")
            if not src:
                fail(at, "inline <script> blocks are blocked by the policy; put the code in site.js")
            elif urllib.parse.urlparse(src).netloc or src.startswith("//"):
                fail(at, f"scripts may only come from this site's own files, not {src}")
        for attr, val in d.items():
            if attr.startswith("on"):
                fail(at, f"inline event handler {attr}= is not allowed")
            if attr == "style":
                fail(at, "style= attributes are blocked by the policy; put the CSS in styles.css")
            if attr in ("href", "src", "action", "formaction", "poster", "data") and \
                    val.strip().lower().startswith(("javascript:", "vbscript:")):
                fail(at, f"{attr} uses a script URL")
            if attr in ("src", "href", "poster") and val.startswith("http://"):
                fail(at, f"{attr} uses insecure http://: {val}")
        if tag in ("iframe", "frame", "embed", "object", "applet"):
            if tag != "iframe":
                fail(at, f"<{tag}> is not allowed; use an <iframe> for embeds")
                continue
            src = d.get("src", "")
            if not host_allowed(src, frame_src):
                fail(at, f"iframe source not in the policy's frame-src: {src}")
            if "sandbox" not in d:
                fail(at, "iframe needs a sandbox attribute (see SECURITY.md for the YouTube template)")
            elif "allow-top-navigation" in d["sandbox"].split():
                fail(at, "iframe sandbox must not include allow-top-navigation")
            if "referrerpolicy" not in d:
                fail(at, "iframe needs referrerpolicy=\"strict-origin-when-cross-origin\"")
        if tag == "a" and d.get("target", "").lower() == "_blank":
            rel = d.get("rel", "").lower().split()
            if "noopener" not in rel:
                fail(at, "links that open a new tab need rel=\"noopener noreferrer\"")
        if tag == "form":
            fail(at, "forms are blocked by the policy (form-action 'none'); see SECURITY.md before adding one")
    return csp_text


def check_security_txt(text, where):
    m = re.search(r"^Expires:\s*(\S+)", text, re.M)
    if not re.search(r"^Contact:\s*\S+", text, re.M):
        fail(where, "security.txt needs a Contact: line")
    if not m:
        fail(where, "security.txt needs an Expires: line")
        return
    try:
        exp = datetime.datetime.fromisoformat(m.group(1).replace("Z", "+00:00"))
    except ValueError:
        fail(where, f"security.txt Expires is not a valid date: {m.group(1)}")
        return
    days = (exp - datetime.datetime.now(datetime.timezone.utc)).days
    if days < 0:
        fail(where, "security.txt has expired; set a new Expires date (max 1 year ahead)")
    elif days < 30:
        print(f"warning: {where} expires in {days} days; renew it soon")


def fetch(url, follow=True):
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *a, **k):
            return None
    opener = urllib.request.build_opener() if follow else urllib.request.build_opener(NoRedirect)
    req = urllib.request.Request(url, headers={"User-Agent": "just4meed-security-check"})
    try:
        r = opener.open(req, timeout=20)
        return r.status, r.headers, r.read().decode("utf-8", "replace"), r.geturl()
    except urllib.error.HTTPError as e:
        return e.code, e.headers, "", url


def check_live(repo_csp):
    status, _, body, final = fetch(SITE + "/")
    if status != 200:
        fail("live", f"{SITE}/ returned HTTP {status}")
        return
    if not final.startswith("https://"):
        fail("live", f"site ended up on a non-HTTPS address: {final}")
    live_csp = check_html("live " + SITE + "/", body)
    if repo_csp and live_csp and live_csp != repo_csp:
        print("warning: live policy differs from the repo (normal for a few minutes after a deploy)")

    status, headers, _, _ = fetch("http://just4meed.com/", follow=False)
    loc = headers.get("Location", "") if headers else ""
    if status not in (301, 308) or not loc.startswith("https://"):
        fail("live", f"http:// does not redirect to https:// (got {status} {loc}); turn on 'Enforce HTTPS' in Pages settings")

    status, _, txt, _ = fetch(SITE + "/.well-known/security.txt")
    if status != 200:
        fail("live", f"/.well-known/security.txt returned HTTP {status}")
    else:
        check_security_txt(txt, "live security.txt")


def main():
    pages = sorted(p for p in ROOT.rglob("*.html")
                   if ".git" not in p.parts and ".github" not in p.parts and "node_modules" not in p.parts)
    index = ROOT / "index.html"
    ref = check_html("index.html", index.read_text(encoding="utf-8"))
    for p in pages:
        if p != index:
            check_html(str(p.relative_to(ROOT)), p.read_text(encoding="utf-8"), ref)

    st = ROOT / ".well-known" / "security.txt"
    if st.exists():
        check_security_txt(st.read_text(encoding="utf-8"), ".well-known/security.txt")
    else:
        fail(".well-known/security.txt", "file is missing")

    if not (ROOT / ".nojekyll").exists():
        fail(".nojekyll", "missing; without it GitHub Pages will not serve the .well-known folder")

    if "--live" in sys.argv:
        check_live(ref)

    if failures:
        print(f"{len(failures)} security check(s) failed:")
        for f in failures:
            print("  - " + f)
        sys.exit(1)
    print(f"All security checks passed ({len(pages)} page(s){', plus live site' if '--live' in sys.argv else ''}).")


if __name__ == "__main__":
    main()
