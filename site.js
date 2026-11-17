// Site scripts for just4meed.com. The security policy only allows scripts from this site's own files,
// so all page code lives here: never inline <script> blocks or onclick= attributes.
// Podcast chapter buttons (sample page only).
(function () {
  var a = document.getElementById('pod-audio');
  if (!a) return;
  document.querySelectorAll('.chaps button').forEach(function (b) {
    b.addEventListener('click', function () { a.currentTime = +b.getAttribute('data-t'); var p = a.play(); if (p && p.catch) p.catch(function () {}); });
  });
})();

// Click-to-play YouTube videos (sample page). Each video shows a still image stored on this site, so nothing
// is loaded from YouTube (and YouTube can't set cookies) until the visitor presses play. The player is then
// built here with the same safety settings as the template in SECURITY.md.
document.querySelectorAll('.yt-play').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var id = btn.getAttribute('data-yt');
    if (!/^[\w-]{11}$/.test(id)) return;
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
    f.title = btn.getAttribute('data-title') || 'Video';
    f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox');
    f.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
    f.setAttribute('allowfullscreen', '');
    btn.replaceWith(f);
    f.focus();
  });
});

// "Copy" buttons next to email addresses.
document.querySelectorAll('.copy-email').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var email = btn.getAttribute('data-email');
    function done() { btn.textContent = 'Copied!'; setTimeout(function () { btn.textContent = 'Copy'; }, 2000); }
    function fallback() {
      var t = document.createElement('textarea');
      t.value = email; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); done(); } catch (e) { btn.textContent = email; }
      document.body.removeChild(t);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(email).then(done, fallback);
    } else { fallback(); }
  });
});
