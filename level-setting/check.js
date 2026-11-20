// Level Setting checks for just4meed.com (reading and math). Loaded after items-reading.js or items-math.js.
// The site's security policy only allows scripts from this site's own files and blocks style= attributes,
// so every look comes from check.css classes and nothing here writes inline styles into the page.
// Nothing is saved or sent anywhere: everything lives in this page's memory and is gone when the page closes.
(function () {
"use strict";
var READING = TEST_KIND === "reading";
var GRADES = READING ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6, 7, 8];
var TOP = GRADES[GRADES.length - 1];
var TITLE = READING ? "Reading Level Check" : "Math Level Check";
var VERSION = "Beta 0.1";
var FEEDBACK_EMAIL = "memberservice@just4meed.com";
var NEEDS = ["Dyslexia", "ADHD", "Anxiety about tests"];
function gName(g) { return g === 0 ? "Kindergarten" : "Grade " + g; }
function gShort(g) { return g === 0 ? "K" : String(g); }

/* ---------- state (memory only) ---------- */
function freshState(setup) {
  return {
    room: "parent", pview: "setup",
    setup: setup || { nick: "", grade: 3, attention: "Average", needs: [], skip: [], readAloud: true },
    plan: [], step: 0, pr: 0,
    words: null, story: null, math: {}, log: [],
    startedAt: null, finishedAt: null, endedEarly: false, paused: false, gate: false, downloaded: false
  };
}
var S = freshState();
var UI = { sel: null, input: "", t0: Date.now(), prOk: false };

function $(sel) { return document.querySelector(sel); }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
function nickRaw() { return S.setup.nick || "Your student"; }
function nick() { return esc(nickRaw()); }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function shortAttn() { return S.setup.attention === "Short" || S.setup.needs.indexOf("ADHD") >= 0; }
function anxious() { return S.setup.needs.indexOf("Anxiety about tests") >= 0; }
function inProgress() { return S.plan.length > 0 && !S.finishedAt; }

/* Stable shuffle so options don't always appear in the same order, but stay put on re-render. */
function seeded(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return function () { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; }
function shuffled(opts, key) { var r = seeded(key), a = opts.map(function (o, i) { return { o: o, i: i }; }); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

/* ---------- math areas ---------- */
function eligible(grade) { return READING ? [] : MATH.filter(function (st) { return st.min <= grade && st.max >= grade - 1; }); }
function chosen() { return eligible(S.setup.grade).filter(function (st) { return S.setup.skip.indexOf(st.id) < 0; }); }
function mStart(st) { return Math.min(st.max, Math.max(st.min, S.setup.grade - 1)); }
function rStart() { return Math.max(0, Math.min(TOP, S.setup.grade - 1)); }

/* ---------- the student's path ---------- */
function buildPlan() {
  var p = ["hello"];
  if (READING) { p.push("words", "break", "stories"); }
  else {
    p.push("practice");
    var parts = chosen(), every = shortAttn() ? 2 : 3;
    parts.forEach(function (st, i) { p.push("m-" + st.id); if ((i + 1) % every === 0 && i < parts.length - 1) p.push("break"); });
  }
  p.push("done");
  return p;
}

/* ---------- adaptive rules ----------
   Each section keeps {level, idx, res: {level: [true/false...]}, done}. */
var RULES = {
  words: { per: 6, up: 5, pass: 4 },  /* 5-6 right: up a level; 4: stop here; 0-3: down if lower not tried */
  story: { per: 5, up: 5, pass: 4 },  /* 5: up; 4: stop; 0-3: down */
  math: { per: 3, up: 3, pass: 2 }    /* 3: up; 2: stop; 0-1: down */
};
var FAST = 1.5; /* seconds; answers faster than this may be guesses (3 s for story questions) */
function nextLevel(sec, rule, has) {
  var score = sec.res[sec.level].filter(Boolean).length;
  if (score >= rule.up && has(sec.level + 1) && sec.res[sec.level + 1] == null) return sec.level + 1;
  if (score < rule.pass && has(sec.level - 1) && sec.res[sec.level - 1] == null) return sec.level - 1;
  return null;
}
function levelOf(sec, rule) {
  if (!sec) return null; var best = null;
  Object.keys(sec.res).forEach(function (k) { var r = sec.res[k], sc = r.filter(Boolean).length; if (r.length >= rule.per && sc >= rule.pass && (best === null || +k > best)) best = +k; });
  return best;
}
function lowestTried(sec) { return Math.min.apply(null, Object.keys(sec.res).map(Number)); }
function wordsSec() { if (!S.words) S.words = { level: rStart(), idx: 0, res: {}, done: false }; return S.words; }
function storySec() { if (!S.story) S.story = { level: rStart(), idx: 0, res: {}, phase: "read", readFor: null, readStart: null, readSecs: {}, done: false }; return S.story; }
function mathSec(id) { var st = findArea(id); if (!S.math[id]) S.math[id] = { level: mStart(st), idx: 0, res: {}, done: false }; return S.math[id]; }
function findArea(id) { for (var i = 0; i < MATH.length; i++) if (MATH[i].id === id) return MATH[i]; return null; }

function record(section, level, item, correct, given) {
  var secs = Math.round((Date.now() - UI.t0) / 100) / 10;
  S.log.push({ section: section, level: level, item: item, correct: correct, given: given, secs: secs });
}
function isNumMatch(input, ans) {
  var a = String(input).replace(/[,\s$]/g, "").replace(/−/g, "-");
  if (a === "" || a === "-" || isNaN(+a)) return false;
  return Math.abs(+a - +ans) < 1e-9;
}

/* =========================================================================
   RENDER
   ========================================================================= */
function render() {
  document.body.classList.toggle("dys", S.setup.needs.indexOf("Dyslexia") >= 0);
  var app = $("#app");
  renderTop();
  if (location.hash === "#review" && S.room === "parent") { app.innerHTML = vReview(); return; }
  if (S.room === "student") {
    var step = S.plan[S.step];
    if (S.gate) app.innerHTML = vGate();
    else if (S.paused) app.innerHTML = vPause();
    else if (step === "hello") app.innerHTML = vHello();
    else if (step === "practice") app.innerHTML = vPractice();
    else if (step === "words") app.innerHTML = vWords();
    else if (step === "stories") app.innerHTML = vStory();
    else if (step === "break") app.innerHTML = vBreak();
    else if (step.indexOf("m-") === 0) app.innerHTML = vMath(step.slice(2));
    else if (step === "done") app.innerHTML = vDone();
    UI.t0 = Date.now();
    var nb = $("#numIn"); if (nb && matchMedia("(pointer: fine)").matches) nb.focus({ preventScroll: true });
    return;
  }
  if (S.pview === "handoff") app.innerHTML = vHandoff();
  else if (S.pview === "results") app.innerHTML = vResults();
  else if (S.pview === "deleteAsk") app.innerHTML = vDeleteAsk();
  else if (S.pview === "deleted") app.innerHTML = vDeleted();
  else app.innerHTML = vSetup();
}
function renderTop() {
  var tools = $("#tools"), path = $("#path");
  path.innerHTML = "";
  if (S.room === "student") {
    $("#modeBadge").textContent = nickRaw() + "'s turn";
    var step = S.plan[S.step];
    tools.innerHTML = (step !== "done" && !S.paused && !S.gate ? '<button type="button" class="cbtn ghost sm" data-act="pause">I need a break</button>' : "") +
      (S.gate ? "" : '<button type="button" class="cbtn ghost sm hold" data-hold="gate" aria-label="Grown-ups: press and hold"><span class="fill"></span><span>Grown-ups: hold</span></button>');
    S.plan.forEach(function (_, i) { var s = document.createElement("span"); if (i < S.step) s.className = "done"; else if (i === S.step) s.className = "now"; path.appendChild(s); });
  } else {
    $("#modeBadge").textContent = TITLE + " · " + VERSION;
    tools.innerHTML = location.hash === "#review"
      ? '<button type="button" class="cbtn ghost sm" data-act="closeReview">Back to the check</button>'
      : '<button type="button" class="cbtn ghost sm" data-act="openReview">Reviewer view</button><a class="btn btn-line btn-small" href="/level-setting/">All checks</a>';
  }
}

/* ---------- parent: setup ---------- */
function opt(v, cur, label) { return '<option value="' + v + '"' + (String(v) === String(cur) ? " selected" : "") + ">" + label + "</option>"; }
function chip(name, val, checked, label) { return '<label class="chip"><input type="checkbox" name="' + name + '" value="' + esc(val) + '"' + (checked ? " checked" : "") + "><span>" + esc(label || val) + "</span></label>"; }
function vSetup() {
  var s = S.setup;
  return '<div class="stack-lg">' +
    (inProgress() ? '<div class="notice warn row"><span><strong>' + nick() + ' has a check in progress</strong> (' + S.log.length + ' questions answered).</span><span class="spacer"></span><button type="button" class="cbtn primary" data-act="resumeStudent">Hand back to ' + nick() + "</button></div>" : "") +
    (S.finishedAt ? '<div class="notice info row"><span><strong>' + nick() + "'s results are ready.</strong></span><span class=\"spacer\"></span><button type=\"button\" class=\"cbtn primary\" data-act=\"showResults\">See results</button></div>" : "") +
    '<div class="stack"><span class="eyebrow">' + TITLE + " · for the parent</span>" +
    "<h1>Find your student's " + (READING ? "reading" : "math") + " starting point</h1>" +
    '<p class="lede measure">Enter a few details, then hand the device to your student. The check moves up or down a level as they answer. When they finish, you get a one-time results page to download. It is not a grade, and there is no pass or fail.</p></div>' +
    '<div class="card stack" id="setupForm" role="group" aria-labelledby="setupTitle">' +
    '<h2 id="setupTitle">About your student</h2>' +
    '<div class="notice small">Use a nickname, not a real name. Nothing you enter is saved or sent anywhere. It stays on this page, and it is deleted when you close the page or press Delete when you finish.</div>' +
    '<div class="grid2">' +
    '<label class="f" for="nickIn">Nickname<input type="text" id="nickIn" maxlength="20" value="' + esc(s.nick) + '" placeholder="For example, Bean" autocomplete="off"></label>' +
    '<label class="f" for="gradeIn">Grade this school year<select id="gradeIn">' + GRADES.map(function (g) { return opt(g, s.grade, gName(g)); }).join("") + "</select></label>" +
    '<label class="f" for="attnIn">Attention span<select id="attnIn">' + ["Short", "Average", "Long"].map(function (a) { return opt(a, s.attention, a); }).join("") + "</select></label>" +
    "</div>" +
    "<fieldset><legend>Learning needs (changes how the check is shown)</legend><div class=\"chips\">" + NEEDS.map(function (n) { return chip("needs", n, s.needs.indexOf(n) >= 0); }).join("") + "</div></fieldset>" +
    (READING ? "" :
      '<fieldset><legend>Math areas to check</legend><div class="chips" id="areaChips">' + areaChips() + "</div></fieldset>" +
      '<fieldset><legend>Help with reading the questions</legend><div class="chips">' + chip("aloud", "on", s.readAloud, "Show “Read it to me” buttons") + "</div></fieldset>") +
    '<p class="small err" id="setupErr" hidden>Pick at least one math area.</p>' +
    '<div class="plan-list" id="planPreview">' + planPreview() + "</div>" +
    '<div class="row"><button type="button" class="cbtn primary big" data-act="toHandoff">Next: get ready</button><span class="small muted" id="estLine">' + estLine() + "</span></div>" +
    "</div></div>";
}
function areaChips() { return eligible(S.setup.grade).map(function (st) { return chip("area", st.id, S.setup.skip.indexOf(st.id) < 0, st.name); }).join(""); }
function estLine() {
  if (READING) return "About 15 minutes for your student, with a break.";
  var n = chosen().length; return n ? "About " + n * 3 + "–" + n * 4 + " minutes for your student, with breaks. " + n + " areas, about " + n * 7 + " questions." : "";
}
function planPreview() {
  var s = S.setup, out = [], a = [];
  if (READING) {
    out.push("<div><h3>What your student will see</h3><p class=\"small muted\"><b>Word check:</b> " + (s.grade <= 1 ? "match pictures to words" : "pick the word that finishes a sentence") + ", starting at " + gName(rStart()) + ".<br><b>Stories:</b> read a short story, then answer 5 questions. Moves up or down a level.</p></div>");
    a.push("No clock is shown, and there is no time limit.");
    a.push("Nothing is read aloud, because that would check listening instead of reading.");
  } else {
    var parts = chosen();
    out.push("<div><h3>What your student will see</h3><p class=\"small muted\">A practice screen first, then:<br>" + (parts.map(function (st) { return esc(st.name) + " (starts at " + gName(mStart(st)) + ")"; }).join("<br>") || "No areas picked yet.") + "<br>3 questions per level, tapped or typed.</p></div>");
    a.push("No clock is shown, and there is no time limit.");
    if (s.readAloud) a.push("Every question can be read aloud by the device.");
  }
  a.push("Your student is never told whether an answer was right.");
  if (s.needs.indexOf("Dyslexia") >= 0) a.push("Extra letter and word spacing.");
  if (shortAttn()) a.push(READING ? "A break screen between parts." : "A break screen after every 2 areas.");
  if (anxious()) a.push("Extra encouragement between questions.");
  out.push('<div><h3>Adjustments on</h3><p class="small muted">' + a.join("<br>") + "</p></div>");
  return out.join("");
}
function readSetupForm() {
  var s = S.setup;
  s.nick = ($("#nickIn").value || "").trim().slice(0, 20);
  s.grade = +$("#gradeIn").value; s.attention = $("#attnIn").value;
  s.needs = [].slice.call(document.querySelectorAll('input[name="needs"]:checked')).map(function (i) { return i.value; });
  if (!READING) {
    var shown = [].slice.call(document.querySelectorAll('input[name="area"]'));
    var shownIds = shown.map(function (i) { return i.value; });
    s.skip = s.skip.filter(function (id) { return shownIds.indexOf(id) < 0; }).concat(shown.filter(function (i) { return !i.checked; }).map(function (i) { return i.value; }));
    s.readAloud = !!document.querySelector('input[name="aloud"]:checked');
  }
}

/* ---------- parent: handoff ---------- */
function vHandoff() {
  var mins = READING ? "About 15 minutes." : "About " + chosen().length * 3 + "–" + chosen().length * 4 + " minutes.";
  return '<div class="stack-lg"><div class="stack"><span class="eyebrow">Before you hand it over</span><h2>Get ' + nick() + " ready</h2></div>" +
    '<div class="card stack"><ul class="clean">' +
    "<li><b>A quiet spot</b> with the device" + (READING ? "." : ", a pencil, and scratch paper.") + "</li>" +
    "<li><b>" + mins + "</b> " + nick() + " can tap <b>I need a break</b> any time. Please keep this page open: answers are only kept while it is open.</li>" +
    "<li><b>No helping with answers.</b> If " + nick() + ' asks for help, say: "Just do your best. It\'s okay to tap <i>I don\'t know</i>."</li>' +
    "<li><b>When they finish,</b> the screen asks them to come get you. Press and hold <b>Grown-ups: hold</b> at the top for about 3 seconds to see the results.</li>" +
    "</ul>" +
    '<div class="notice"><strong>What to say:</strong> "This helps us find out what you already know so your lessons are just right. Some questions will be easy and some will be tricky. Tricky is okay. Just do your best."</div></div>' +
    '<div class="row"><button type="button" class="cbtn ghost" data-act="toSetup">Back</button><span class="spacer"></span><button type="button" class="cbtn primary big" data-act="handOver">Hand to ' + nick() + "</button></div></div>";
}

/* ---------- student: shared pieces ---------- */
function speakable(t) {
  var den = { 2: ["half", "halves"], 3: ["third", "thirds"], 4: ["fourth", "fourths"], 5: ["fifth", "fifths"], 6: ["sixth", "sixths"], 8: ["eighth", "eighths"], 10: ["tenth", "tenths"], 12: ["twelfth", "twelfths"], 16: ["sixteenth", "sixteenths"] };
  return t
    .replace(/(\d+)\/(\d+)/g, function (m, n, d) { return den[d] ? n + " " + den[d][+n === 1 ? 0 : 1] : n + " over " + d; })
    .replace(/−\s/g, " minus ").replace(/−/g, "negative ")
    .replace(/×/g, " times ").replace(/÷/g, " divided by ").replace(/=\s*\?/g, "").replace(/ = /g, " equals ")
    .replace(/_+/g, " blank ").replace(/%/g, " percent").replace(/°F/g, " degrees").replace(/π/g, "pi");
}
function sayBtn(text) { return !READING && S.setup.readAloud && "speechSynthesis" in window ? '<button type="button" class="cbtn ghost" data-act="say" data-text="' + esc(text) + '">Read it to me</button>' : ""; }
function vChoices(opts, key, cls) {
  var long = opts.some(function (o) { return o.length > 14; });
  return '<div class="opts ' + (long ? "long" : cls || "") + '" role="radiogroup">' + shuffled(opts, key).map(function (x) {
    return '<button type="button" class="opt' + (UI.sel === x.i ? " sel" : "") + '" role="radio" aria-checked="' + (UI.sel === x.i) + '" data-act="pick" data-i="' + x.i + '">' + fracHTML(x.o) + "</button>";
  }).join("") + "</div>";
}
function vNumber(neg) {
  var keys = ["7", "8", "9", "⌫", "4", "5", "6", ".", "1", "2", "3", neg ? "−" : ",", "0"];
  return '<input class="numbox" id="numIn" inputmode="' + (neg ? "text" : "decimal") + '" autocomplete="off" aria-label="Your answer" value="' + esc(UI.input) + '" placeholder="?">' +
    '<div class="keypad">' + keys.map(function (k) { return '<button type="button" class="cbtn' + (k === "0" ? " wide" : "") + '" data-act="key" data-k="' + k + '" aria-label="' + (k === "⌫" ? "Delete" : k === "−" ? "Negative sign" : k) + '">' + k + "</button>"; }).join("") + "</div>";
}
function answerBar(ready, idk) {
  return '<div class="stu-actions">' + (idk === false ? "" : '<button type="button" class="cbtn ghost" data-act="idk">I don\'t know</button>') +
    '<button type="button" class="cbtn primary big" data-act="submit"' + (ready ? "" : " disabled") + ">Next</button></div>";
}
var CHEERS = ["Nice focus!", "Keep going!", "You're doing great.", "Thanks for trying your best.", "You've got this.", "Tricky ones help us learn."];
function cheer() { return anxious() ? '<p class="hint">' + CHEERS[S.log.length % CHEERS.length] + "</p>" : ""; }

/* ---------- student: screens ---------- */
function vHello() {
  return '<div class="stu"><div class="pic" aria-hidden="true">' + (READING ? "📚" : "🧮") + "</div>" +
    '<div class="q">Hi ' + nick() + "!</div>" +
    '<p class="hint measure-narrow">You\'ll answer some ' + (READING ? "reading" : "math") + " questions so we can make lessons that are just right for you. Some will be easy and some will be tricky. Tricky is okay!</p>" +
    '<ul class="clean left measure-narrow">' +
    (READING ? "<li>Tap an answer, then tap <b>Next</b>.</li>" : "<li>Tap an answer, or type a number with the number buttons. Then tap <b>Next</b>.</li><li>Use your pencil and scratch paper as much as you like.</li>") +
    "<li>There is no timer. Take your time.</li>" +
    "<li>If you don't know, tap <b>I don't know</b>. That's fine.</li>" +
    (!READING && S.setup.readAloud ? "<li>Tap <b>Read it to me</b> to hear a question.</li>" : "") +
    "<li>Need a rest? Tap <b>I need a break</b> at the top.</li></ul>" +
    '<button type="button" class="cbtn primary big" data-act="next">' + (READING ? "Let's start" : "Let's practice first") + "</button></div>";
}
function vPractice() {
  var it = PRACTICE[S.pr];
  var ready = it.t === "mc" ? UI.sel != null : UI.input.trim() !== "";
  var last = S.pr >= PRACTICE.length - 1;
  if (UI.prOk) return '<div class="stu"><div class="pic" aria-hidden="true">👍</div><div class="q">That\'s how it works!</div>' +
    '<p class="hint">' + (last ? "Now the real questions start. They don't show if you got them right, so just do your best and keep going." : "One more practice question.") + "</p>" +
    '<button type="button" class="cbtn primary big" data-act="prNext">' + (last ? "Start math" : "Next practice") + "</button></div>";
  return '<div class="stack"><div class="row"><span class="eyebrow-soft">Practice ' + (S.pr + 1) + " of " + PRACTICE.length + " · not counted</span></div>" +
    '<div class="stu"><div class="q">' + esc(it.q) + "</div>" + sayBtn(it.q) +
    (it.t === "mc" ? vChoices(it.o, "pr" + S.pr) : vNumber(false)) + answerBar(ready, false) + "</div></div>";
}
function vWords() {
  var W = wordsSec(); if (W.done) return vSectionDone("Word check done!", "Next up: short stories.");
  var it = WORDS[W.level][W.idx], key = "w" + W.level + "-" + W.idx;
  return '<div class="stack"><div class="row"><span class="eyebrow-soft">Word check · ' + (W.idx + 1) + " of " + RULES.words.per + "</span></div>" +
    '<div class="stu">' + cheer() +
    (it.pic ? '<p class="hint">Which word matches the picture?</p><div class="pic" role="img" aria-label="picture">' + it.pic + "</div>"
            : '<p class="hint">Pick the word that best finishes the sentence.</p><div class="q sentence">' + esc(it.s).replace("___", '<span class="blank" aria-label="blank"></span>') + "</div>") +
    vChoices(it.o, key, "four") + answerBar(UI.sel != null) + "</div></div>";
}
function passageHTML(P, extra) { return '<div class="passage' + (extra ? " " + extra : "") + '">' + P.paras.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>"; }
function vStory() {
  var T = storySec(); if (T.done) return vSectionDone("Stories done!", "");
  var P = PASSAGES[T.level];
  if (T.phase === "read") {
    if (T.readFor !== T.level) { T.readFor = T.level; T.readStart = Date.now(); }
    return '<div class="stack"><div class="row"><span class="eyebrow-soft">Story ' + (Object.keys(T.res).length + 1) + "</span></div>" +
      '<div class="stu read"><p class="hint">Read this story carefully. Then you\'ll answer 5 questions about it.</p>' +
      '<div class="passage-title">' + esc(P.title) + "</div>" + passageHTML(P) +
      '<div class="stu-actions"><button type="button" class="cbtn primary big" data-act="doneReading">I\'m done reading</button></div></div></div>';
  }
  var q = P.qs[T.idx];
  return '<div class="stack"><div class="row"><span class="eyebrow-soft">' + esc(P.title) + " · question " + (T.idx + 1) + " of 5</span></div>" +
    '<div class="stu">' + cheer() + '<div class="q">' + esc(q.q) + "</div>" +
    vChoices(q.o, "s" + T.level + "-" + T.idx, "four") +
    '<details class="lookback"><summary>Look back at the story</summary>' + passageHTML(P) + "</details>" +
    answerBar(UI.sel != null) + "</div></div>";
}
function vBreak() {
  return '<div class="stu"><div class="pic" aria-hidden="true">🌟</div><div class="q">Great work! Time for a stretch.</div>' +
    '<p class="hint">Stand up, wiggle, get a drink of water. Come back when you\'re ready.</p>' +
    '<button type="button" class="cbtn primary big" data-act="next">I\'m ready</button></div>';
}
function vPause() {
  return '<div class="stu"><div class="pic" aria-hidden="true">⏸️</div><div class="q">Break time</div>' +
    '<p class="hint">Take as long as you need. Keep this page open so your answers stay.</p>' +
    '<button type="button" class="cbtn primary big" data-act="unpause">Keep going</button></div>';
}
function vMath(id) {
  var st = findArea(id), M = mathSec(id), parts = chosen();
  var partNo = parts.map(function (x) { return x.id; }).indexOf(id) + 1;
  if (M.done) return vSectionDone("Nice work!", S.plan[S.step + 1] === "done" ? "That was the last part." : "On to the next part.");
  var it = st.levels[M.level].items[M.idx];
  var ready = it.t === "mc" ? UI.sel != null : UI.input.trim() !== "";
  return '<div class="stack"><div class="row"><span class="eyebrow-soft">Part ' + partNo + " of " + parts.length + " · " + esc(st.name) + "</span></div>" +
    '<div class="stu">' + cheer() + (it.fig ? figure(it.fig) : "") +
    '<div class="q' + (it.q.length > 60 ? " long" : "") + '">' + fracHTML(it.q) + "</div>" + sayBtn(it.say || it.q) +
    (it.t === "mc" ? vChoices(it.o, "m" + id + M.level + "-" + M.idx) : vNumber(!!it.neg)) + answerBar(ready) + "</div></div>";
}
function vSectionDone(title, sub) {
  return '<div class="stu"><div class="pic" aria-hidden="true">✅</div><div class="q">' + esc(title) + "</div>" + (sub ? '<p class="hint">' + esc(sub) + "</p>" : "") +
    '<button type="button" class="cbtn primary big" data-act="next">Next</button></div>';
}
function vDone() {
  return '<div class="stu"><div class="pic" aria-hidden="true">🎉</div><div class="q">All done, ' + nick() + "!</div>" +
    '<p class="hint">Thank you for trying so hard. Please go get your grown-up now.</p>' +
    '<p class="small muted">Grown-ups: press and hold the button at the top of the screen to see the results.</p></div>';
}
function vGate() {
  return '<div class="stack-lg"><div class="stack"><span class="eyebrow">For the parent</span><h2>' + nick() + " is part way through</h2>" +
    '<p class="muted">' + S.log.length + " questions answered so far.</p></div>" +
    '<div class="row"><button type="button" class="cbtn primary big" data-act="closeGate">Return to ' + nick() + "'s check</button>" +
    '<button type="button" class="cbtn" data-act="endEarly">End now and see results</button></div></div>';
}

/* ---------- figures (inline SVG, colored by check.css classes) ---------- */
function fracHTML(s) { return esc(s).replace(/(\d+)\/(\d+)/g, '<span class="frac"><span>$1</span><span>$2</span></span>'); }
function figure(f) {
  function svg(label, w, h, body) { return '<svg class="fig" role="img" aria-label="' + esc(label) + '" viewBox="0 0 ' + w + " " + h + '" width="' + w + '">' + body + "</svg>"; }
  function T(x, y, txt, cls, anchor) { return '<text class="' + (cls || "lbl") + '" x="' + x + '" y="' + y + '" text-anchor="' + (anchor || "middle") + '" dominant-baseline="middle">' + esc(txt) + "</text>"; }
  function L(x1, y1, x2, y2, cls) { return '<line class="' + cls + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/>'; }
  var s = "", i, k, x, y;
  if (f.t === "dots") {
    var per = 5, gap = 46, rows = Math.ceil(f.n / per);
    for (i = 0; i < f.n; i++) s += '<circle class="dotc" cx="' + ((i % per) * gap + gap / 2) + '" cy="' + (Math.floor(i / per) * gap + gap / 2) + '" r="16"/>';
    return svg(f.n + " dots", per * gap, rows * gap, s);
  }
  if (f.t === "array") {
    var g2 = 46;
    var star = function (cx, cy) { var p = []; for (var q = 0; q < 10; q++) { var a = Math.PI / 5 * q - Math.PI / 2, rr = q % 2 ? 7 : 17; p.push((cx + rr * Math.cos(a)).toFixed(1) + "," + (cy + rr * Math.sin(a)).toFixed(1)); } return '<polygon class="shade" points="' + p.join(" ") + '"/>'; };
    for (i = 0; i < f.r; i++) for (k = 0; k < f.c; k++) s += star(k * g2 + g2 / 2, i * g2 + g2 / 2);
    return svg(f.r + " rows of " + f.c + " stars", f.c * g2, f.r * g2, s);
  }
  if (f.t === "circle") {
    var cx = 80, cy = 80, r = 70;
    for (k = 0; k < f.p; k++) {
      var a1 = 2 * Math.PI * k / f.p - Math.PI / 2, a2 = 2 * Math.PI * (k + 1) / f.p - Math.PI / 2;
      s += '<path class="' + (k < f.s ? "shade" : "empty") + '" d="M' + cx + "," + cy + " L" + (cx + r * Math.cos(a1)).toFixed(2) + "," + (cy + r * Math.sin(a1)).toFixed(2) + " A" + r + "," + r + " 0 0 1 " + (cx + r * Math.cos(a2)).toFixed(2) + "," + (cy + r * Math.sin(a2)).toFixed(2) + ' Z"/>';
    }
    return svg("circle cut into " + f.p + " equal parts, " + f.s + " shaded", 160, 160, s);
  }
  if (f.t === "rect") {
    var pw = 300 / f.p;
    for (k = 0; k < f.p; k++) s += '<rect class="' + (k < f.s ? "shade" : "empty") + '" x="' + (k * pw + 2).toFixed(1) + '" y="2" width="' + pw.toFixed(1) + '" height="76"/>';
    return svg("bar cut into " + f.p + " equal parts, " + f.s + " shaded", 304, 80, s);
  }
  if (f.t === "base") {
    x = 4;
    for (i = 0; i < f.tens; i++) { for (k = 0; k < 10; k++) s += '<rect class="shade" x="' + x + '" y="' + (4 + k * 16) + '" width="16" height="16"/>'; x += 26; }
    x += 14;
    for (i = 0; i < f.ones; i++) s += '<rect class="shade" x="' + (x + (i % 2) * 22) + '" y="' + (4 + Math.floor(i / 2) * 22) + '" width="16" height="16"/>';
    return svg(f.tens + " tens sticks and " + f.ones + " ones squares", x + 44, 168, s);
  }
  if (f.t === "shape") {
    var rot = f.k === 4 ? Math.PI / 4 : -Math.PI / 2, pts = [];
    for (i = 0; i < f.k; i++) { var an = rot + 2 * Math.PI * i / f.k; pts.push((90 + 70 * Math.cos(an)).toFixed(1) + "," + (90 + 70 * Math.sin(an) + (f.k === 3 ? 12 : 0)).toFixed(1)); }
    return svg("a shape with " + f.k + " sides", 180, 180, '<polygon class="shade" points="' + pts.join(" ") + '"/>');
  }
  if (f.t === "lens") {
    var max = Math.max.apply(null, f.L.map(function (l) { return l[1]; }));
    f.L.forEach(function (l, j) { y = 24 + j * 48; s += T(16, y, l[0]) + L(44, y, 44 + l[1] * 50, y, "ln w8"); });
    return svg("three lines labeled " + f.L.map(function (l) { return l[0]; }).join(", "), 60 + max * 50, 24 + f.L.length * 48 - 10, s);
  }
  if (f.t === "clock") {
    var c = 100; s = '<circle class="face" cx="' + c + '" cy="' + c + '" r="88"/>';
    for (i = 1; i <= 12; i++) { var a = Math.PI / 6 * i - Math.PI / 2; s += T((c + 70 * Math.cos(a)).toFixed(1), (c + 70 * Math.sin(a)).toFixed(1), String(i)); }
    for (i = 0; i < 60; i++) { var b = Math.PI / 30 * i, r1 = i % 5 ? 83 : 79; s += L((c + r1 * Math.sin(b)).toFixed(1), (c - r1 * Math.cos(b)).toFixed(1), (c + 87 * Math.sin(b)).toFixed(1), (c - 87 * Math.cos(b)).toFixed(1), "thin"); }
    var ha = ((f.h % 12) + f.m / 60) * Math.PI / 6, ma = f.m * Math.PI / 30;
    s += L(c, c, (c + 42 * Math.sin(ha)).toFixed(1), (c - 42 * Math.cos(ha)).toFixed(1), "ln w7");
    s += L(c, c, (c + 64 * Math.sin(ma)).toFixed(1), (c - 64 * Math.cos(ma)).toFixed(1), "ln w4");
    s += '<circle class="hub" cx="' + c + '" cy="' + c + '" r="5"/>';
    return svg("an analog clock", 200, 200, s);
  }
  if (f.t === "ruler") {
    var u = 40, x0 = 20, e = x0 + f.len * u;
    s = '<rect class="shade" x="' + x0 + '" y="14" width="' + f.len * u + '" height="22" rx="4"/><polygon class="shade" points="' + e + ",14 " + (e + 18) + ",25 " + e + ',36"/>';
    s += '<rect class="empty" x="' + x0 + '" y="52" width="400" height="44"/>';
    for (i = 0; i <= 10; i++) s += L(x0 + i * u, 52, x0 + i * u, 68, "ln w2") + T(x0 + i * u, 82, String(i), "lbl-s");
    return svg("a pencil above a ruler", 440, 104, s);
  }
  if (f.t === "graph") {
    var top = 10, step = 20, gx = 40, y0 = 40 + top * step, bw = 54, gp = 30, right = gx + f.data.length * (bw + gp) + gp;
    s = T((gx + right) / 2, 16, f.title, "lbl-s");
    for (var v = 0; v <= top; v++) { y = y0 - v * step; s += L(gx, y, right, y, "grid") + T(gx - 10, y, String(v), "lbl-s", "end"); }
    f.data.forEach(function (d, j) { var bx = gx + gp + j * (bw + gp); s += '<rect class="bar" x="' + bx + '" y="' + (y0 - d[1] * step) + '" width="' + bw + '" height="' + d[1] * step + '"/>' + T(bx + bw / 2, y0 + 18, d[0], "lbl-s"); });
    s += L(gx, y0, right, y0, "ln w2");
    return svg("bar graph: " + f.title, right + 10, y0 + 34, s);
  }
  if (f.t === "rectDim") {
    var uu = 36, rx = 40, ry = 14, W = f.w * uu, H = f.h * uu;
    s = '<rect class="empty" x="' + rx + '" y="' + ry + '" width="' + W + '" height="' + H + '"/>';
    if (f.grid) { for (i = 1; i < f.w; i++) s += L(rx + i * uu, ry, rx + i * uu, ry + H, "thin"); for (k = 1; k < f.h; k++) s += L(rx, ry + k * uu, rx + W, ry + k * uu, "thin"); }
    s += T(rx + W / 2, ry + H + 22, f.w + " units") + T(rx - 10, ry + H / 2, String(f.h), "lbl", "end");
    return svg("rectangle " + f.w + " units by " + f.h + " units", rx + W + 16, ry + H + 40, s);
  }
  if (f.t === "angle") {
    var vx = 60, vy = 150, len = 150, ang = f.deg * Math.PI / 180, ex = vx + len * Math.cos(ang), ey = vy - len * Math.sin(ang);
    s = L(vx, vy, vx + len, vy, "ln") + L(vx, vy, ex.toFixed(1), ey.toFixed(1), "ln");
    s += '<path class="thin w25" d="M' + (vx + 34) + "," + vy + " A34,34 0 0 0 " + (vx + 34 * Math.cos(ang)).toFixed(1) + "," + (vy - 34 * Math.sin(ang)).toFixed(1) + '"/>';
    var minX = Math.min(0, ex - 10), w = Math.round(vx + len + 10 - minX);
    return '<svg class="fig" role="img" aria-label="an angle" viewBox="' + Math.round(minX) + " 0 " + w + ' 160" width="' + w + '">' + s + "</svg>";
  }
  if (f.t === "box") {
    var bu = 40, dx = 0.35 * f.w * bu, bx0 = 20, by0 = 20 + dx, BL = f.l * bu, BH = f.h * bu;
    s = '<polygon class="empty" points="' + bx0 + "," + by0 + " " + (bx0 + dx) + "," + (by0 - dx) + " " + (bx0 + dx + BL) + "," + (by0 - dx) + " " + (bx0 + BL) + "," + by0 + '"/>';
    s += '<polygon class="empty" points="' + (bx0 + BL) + "," + by0 + " " + (bx0 + BL + dx) + "," + (by0 - dx) + " " + (bx0 + BL + dx) + "," + (by0 - dx + BH) + " " + (bx0 + BL) + "," + (by0 + BH) + '"/>';
    s += '<rect class="shade" x="' + bx0 + '" y="' + by0 + '" width="' + BL + '" height="' + BH + '"/>';
    s += T(bx0 + BL / 2, by0 + BH + 20, String(f.l)) + T(bx0 + BL + dx / 2 + 14, by0 + BH - dx / 2 + 4, String(f.w), "lbl", "start") + T(bx0 - 8, by0 + BH / 2, String(f.h), "lbl", "end");
    return svg("a box " + f.l + " by " + f.w + " by " + f.h + " units", bx0 + BL + dx + 40, by0 + BH + 36, s);
  }
  if (f.t === "tri") {
    var tu = 26, tx = 20, TB = f.b * tu, TH = f.h * tu, ty = 14 + TH, apex = tx + TB * 0.35;
    s = '<polygon class="shade" points="' + tx + "," + ty + " " + (tx + TB) + "," + ty + " " + apex + "," + (ty - TH) + '"/>' + L(apex, ty, apex, ty - TH, "dash");
    s += '<rect class="thin" x="' + apex + '" y="' + (ty - 12) + '" width="12" height="12"/>';
    s += T(tx + TB / 2, ty + 22, "base " + f.b) + T(apex + 10, ty - TH / 2, "height " + f.h, "lbl", "start");
    return svg("triangle with base " + f.b + " and height " + f.h, tx + TB + 20, ty + 38, s);
  }
  if (f.t === "rtri") {
    var ru = 22, qx = 50, A = f.a * ru, B = f.b * ru, qy = 14 + A;
    s = '<polygon class="shade" points="' + qx + "," + qy + " " + (qx + B) + "," + qy + " " + qx + "," + (qy - A) + '"/><rect class="thin" x="' + qx + '" y="' + (qy - 14) + '" width="14" height="14"/>';
    s += T(qx - 12, qy - A / 2, String(f.a), "lbl", "end") + T(qx + B / 2, qy + 22, String(f.b)) + T(qx + B / 2 + 16, qy - A / 2 - 10, "?", "lbl", "start");
    return svg("right triangle with sides " + f.a + " and " + f.b, qx + B + 30, qy + 38, s);
  }
  if (f.t === "numline") {
    var nu = 40, n = f.hi - f.lo, nx = 24;
    s = L(nx - 14, 40, nx + n * nu + 14, 40, "ln");
    for (i = 0; i <= n; i++) { var val = f.lo + i; x = nx + i * nu; s += L(x, 30, x, 50, "ln w2"); if (val % 5 === 0) s += T(x, 70, val < 0 ? "−" + Math.abs(val) : String(val), "lbl-s"); }
    s += '<circle class="pt" cx="' + (nx + (f.at - f.lo) * nu) + '" cy="40" r="9"/>';
    return svg("number line from " + f.lo + " to " + f.hi + " with a red dot", nx * 2 + n * nu, 84, s);
  }
  return "";
}

/* ---------- student: answering ---------- */
function submit(idk) {
  var step = S.plan[S.step];
  if (step === "practice") { UI.prOk = true; UI.sel = null; UI.input = ""; render(); return; }
  if (step === "words") {
    var W = wordsSec(), it = WORDS[W.level][W.idx];
    record("Word check", W.level, it.label || it.s, !idk && UI.sel === 0, idk ? "I don't know" : it.o[UI.sel]);
    advance(W, RULES.words, function (l) { return !!WORDS[l]; });
  } else if (step === "stories") {
    var T = storySec(), q = PASSAGES[T.level].qs[T.idx];
    record("Stories", T.level, PASSAGES[T.level].title + ": " + q.q, !idk && UI.sel === 0, idk ? "I don't know" : q.o[UI.sel]);
    var before = T.level;
    advance(T, RULES.story, function (l) { return !!PASSAGES[l]; });
    if (T.level !== before) T.phase = "read";
  } else if (step.indexOf("m-") === 0) {
    var id = step.slice(2), st = findArea(id), M = mathSec(id), mi = st.levels[M.level].items[M.idx];
    var ok = !idk && (mi.t === "mc" ? UI.sel === 0 : isNumMatch(UI.input, mi.ans));
    record(id, M.level, mi.q, ok, idk ? "I don't know" : mi.t === "mc" ? mi.o[UI.sel] : UI.input);
    advance(M, RULES.math, function (l) { return !!st.levels[l] && l <= S.setup.grade + 2; });
  }
  UI.sel = null; UI.input = "";
  render(); window.scrollTo(0, 0);
}
function advance(sec, rule, has) {
  var last = S.log[S.log.length - 1];
  (sec.res[sec.level] = sec.res[sec.level] || []).push(last.correct);
  if (sec.res[sec.level].length < rule.per) { sec.idx++; return; }
  var nx = nextLevel(sec, rule, has);
  if (nx == null) sec.done = true; else { sec.level = nx; sec.idx = 0; }
}
function nextStep() {
  if (S.step < S.plan.length - 1) S.step++;
  if (S.plan[S.step] === "done" && !S.finishedAt) S.finishedAt = Date.now();
  UI.sel = null; UI.input = ""; UI.prOk = false; render(); window.scrollTo(0, 0);
}

/* =========================================================================
   RESULTS
   ========================================================================= */
function fmtTime(sec) { var m = Math.floor(sec / 60), s = Math.round(sec % 60); return m ? m + " min " + s + " sec" : s + " sec"; }
function scoreList(res) { return Object.keys(res).map(Number).sort(function (a, b) { return a - b; }).map(function (k) { return gShort(k) + ": " + res[k].filter(Boolean).length + "/" + res[k].length; }).join(", "); }
function ladderRow(name, sec, rule, min, max, final) {
  var cells = "";
  GRADES.forEach(function (g) {
    var gc = !READING && g === S.setup.grade ? " grade" : "";
    if (g < min || g > max) { cells += '<div class="cell na' + gc + '"></div>'; return; }
    var r = sec && sec.res[g];
    if (!r || r.length < rule.per) { cells += '<div class="cell' + gc + (final === g ? " here" : "") + '">' + (r && r.length ? "…" : "") + "</div>"; return; }
    var sc = r.filter(Boolean).length;
    cells += '<div class="cell ' + (sc >= rule.pass ? "pass" : "fail") + gc + (final === g ? " here" : "") + '">' + sc + "/" + rule.per + "</div>";
  });
  return "<div>" + esc(name) + "</div>" + cells;
}
function ladder(rows, passLabel) {
  return '<div class="scroll-x" tabindex="0" role="region" aria-label="Table, scrolls sideways"><div class="ladder' + (READING ? " g6" : "") + '"><div class="h first">' + (READING ? "Part" : "Area") + "</div>" + GRADES.map(function (g) { return '<div class="h">' + gShort(g) + "</div>"; }).join("") + rows + "</div></div>" +
    '<div class="legend"><span><i class="pass"></i>' + passLabel + '</span><span><i class="fail"></i>Not yet</span><span><i class="here"></i>Level reached</span>' +
    (READING ? "" : '<span><i class="grade"></i>' + gName(S.setup.grade) + " column</span>") + '<span><i class="na"></i>Not in this ' + (READING ? "part" : "area") + "</span></div>";
}

/* Math bands. High: secure above grade, or 3 of 3 at the highest level the check offers when that is at or
   above grade. Average: secure at grade or one grade below. Low: two or more below, or not yet secure. */
var BANDS = { high: { name: "High", sub: "Above grade level" }, avg: { name: "Average", sub: "At or near grade level" }, low: { name: "Low", sub: "Below grade level, start here" } };
function bandOf(st, M) {
  var Lv = levelOf(M, RULES.math), g = S.setup.grade, r;
  if (Lv == null) return "low";
  if (Lv > g) return "high";
  r = M.res[Lv];
  if (Lv === Math.min(st.max, g + 2) && st.max >= g && r.length === 3 && r.filter(Boolean).length === 3) return "high";
  if (Lv >= g - 1) return "avg";
  return "low";
}
function analyseMath() {
  var g = S.setup.grade;
  return MATH.filter(function (st) { return S.math[st.id] && Object.keys(S.math[st.id].res).length; }).map(function (st) {
    var M = S.math[st.id], Lv = levelOf(M, RULES.math), band = bandOf(st, M);
    var logs = S.log.filter(function (l) { return l.section === st.id; });
    var fast = logs.filter(function (l) { return l.secs < FAST && l.given !== "I don't know"; }).length;
    var idk = logs.filter(function (l) { return l.given === "I don't know"; }).length;
    var focus = Lv == null ? lowestTried(M) : (st.levels[Lv + 1] ? Lv + 1 : null);
    var tips = [];
    if (band === "low") {
      tips.push("<b>Start here:</b> " + esc(cap(st.levels[focus].skill)) + " (" + gName(focus) + " level). " + esc(st.levels[focus].tip));
      tips.push(Lv != null ? nick() + " is secure with " + esc(st.levels[Lv].skill) + " (" + gName(Lv) + " level), so lessons can build from there." : "This was the first level in this area. Hands-on practice with real objects is a good way in.");
      tips.push("Plan short, frequent practice in this area, and check again after a few weeks of lessons.");
    } else if (band === "avg") {
      if (focus != null) tips.push("<b>Next to learn:</b> " + esc(cap(st.levels[focus].skill)) + " (" + gName(focus) + " level). " + esc(st.levels[focus].tip));
      tips.push(Lv === g - 1 ? nick() + " is secure one level below grade. This is common earlier in the school year, while grade-level skills are still being taught." : nick() + " is secure at grade level here.");
    } else {
      tips.push(Lv > g ? nick() + " is working above grade level here, so lessons can move faster and go deeper." : nick() + " got every question right at the highest level this check offers, so lessons can move faster here.");
      if (focus != null) tips.push("<b>Ready for:</b> " + esc(cap(st.levels[focus].skill)) + " (" + gName(focus) + " level). " + esc(st.levels[focus].tip));
    }
    if (fast >= 2) tips.push(fast + " answers here were tapped in under " + FAST + " seconds, which can mean guessing. This area may not show " + nick() + "'s best effort. Try it again after a break.");
    if (idk >= 2) tips.push(nick() + ' chose "I don\'t know" ' + idk + " times here. That is useful: it shows where new teaching is needed.");
    return { st: st, M: M, L: Lv, band: band, missed: logs.filter(function (l) { return !l.correct; }), tips: tips };
  });
}

/* The results markup. Used on the page and inside the downloaded file, so it uses no page-only controls. */
function resultsBody() {
  var s = S.setup, total = S.log.reduce(function (a, l) { return a + l.secs; }, 0);
  var date = new Date(S.finishedAt || Date.now()).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  var head = '<div class="stack"><span class="eyebrow">' + TITLE + " results · " + VERSION + "</span><h1>" + nick() + "'s " + (READING ? "reading" : "math") + " starting point</h1>" +
    '<p class="muted">' + gName(s.grade) + " · attention " + s.attention.toLowerCase() + (s.needs.length ? " · " + esc(s.needs.join(", ")) : "") + " · " + S.log.length + " questions in " + fmtTime(total) + (S.endedEarly ? " · ended early" : "") + " · " + esc(date) + "</p></div>";
  var body = READING ? readingResults() : mathResults();
  var detail = S.log.map(function (l, i) {
    var area = READING ? l.section : findArea(l.section).name;
    var fast = l.secs < (l.section === "Stories" ? 3 : FAST) && l.given !== "I don't know";
    return "<tr><td>" + (i + 1) + "</td><td>" + esc(area) + " · " + gShort(l.level) + "</td><td>" + fracHTML(l.item) + "</td><td>" + fracHTML(l.given || "") + '</td><td class="' + (l.correct ? "ok" : "no") + '">' + (l.correct ? "Right" : "Not yet") + "</td><td>" + l.secs + "s" + (fast ? " ⚡" : "") + "</td></tr>";
  }).join("");
  return '<div class="stack-lg">' + head + body +
    '<div class="notice">Does this match what you see at home? These levels are a starting point for lessons, not a diagnosis and not a comparison with other students. In the full Just4Me app you would confirm or change each level before it is used, and nothing goes to your student until you approve it.</div>' +
    '<details class="rvsec" open><summary>Every answer ' + nick() + ' gave</summary><div><p class="small muted">⚡ marks a very fast answer, which can mean guessing.</p><div class="scroll-x" tabindex="0" role="region" aria-label="Table, scrolls sideways"><table class="t"><thead><tr><th>#</th><th>' + (READING ? "Part" : "Area") + " · level</th><th>Question</th><th>Answer given</th><th>Result</th><th>Time</th></tr></thead><tbody>" + detail + "</tbody></table></div></div></details></div>";
}
function readingResults() {
  var tips = [], cards = "";
  if (!S.words || !Object.keys(S.words.res).length) return '<div class="card">No answers yet.</div>';
  var wl = levelOf(S.words, RULES.words), triedStory = S.story && Object.keys(S.story.res).length;
  var sl = triedStory ? levelOf(S.story, RULES.story) : null;
  var readLevel = sl != null ? sl : triedStory ? lowestTried(S.story) - 1 : wl;
  var readSecs = S.story ? S.story.readSecs : {};
  var storyRows = triedStory ? Object.keys(S.story.res).map(Number).sort(function (a, b) { return a - b; }).map(function (l) {
    return "<span>" + gName(l) + " story: " + esc(PASSAGES[l].title) + "</span><span>" + S.story.res[l].filter(Boolean).length + " of " + S.story.res[l].length + " right" + (readSecs[l] ? " · read in " + fmtTime(readSecs[l]) : "") + "</span>";
  }).join("") : "";
  cards = '<div class="card stack"><span class="eyebrow-soft">Reading starting point</span>' +
    '<div class="lvl">' + (readLevel != null && readLevel >= 0 ? gName(readLevel) : "Pre-reading") + "</div>" +
    '<p class="small muted">' + (triedStory ? "Set by the hardest story " + nick() + " understood well (4 or 5 of 5 questions right)." : "Set by the word check, because no stories were finished.") + "</p>" +
    ladder(ladderRow("Word check", S.words, RULES.words, 0, 5, wl) + (triedStory ? ladderRow("Stories", S.story, RULES.story, 0, 5, sl) : ""), "Ready for this level") +
    (storyRows ? '<div class="kv">' + storyRows + "</div>" : "") + "</div>";
  var g = S.setup.grade;
  if (readLevel != null && readLevel > g) tips.push(nick() + " is reading above grade level. Lessons can use harder texts and go deeper.");
  if (readLevel == null || readLevel < g - 1) tips.push("Reading is the place to start. Read together every day at the " + (readLevel != null && readLevel >= 0 ? gName(readLevel) : "beginning") + " level, and let " + nick() + " choose books about favorite topics.");
  if (wl != null && sl != null && wl < sl - 1) tips.push("Word check (" + gName(wl) + ") is well below story understanding (" + gName(sl) + "). " + nick() + " may be using context to make up for decoding. Add phonics practice at the " + gName(wl) + " level.");
  if (wl != null && sl != null && sl < wl - 1) tips.push(nick() + " reads words well (" + gName(wl) + ") but understood less of the stories (" + gName(sl) + "). Build comprehension by talking about who, what, and why while reading together.");
  var typeOf = function (item) { for (var gg in PASSAGES) { var qs = PASSAGES[gg].qs; for (var i = 0; i < qs.length; i++) if (item.slice(-qs[i].q.length) === qs[i].q) return qs[i].type; } return ""; };
  var missedTypes = S.log.filter(function (l) { return l.section === "Stories" && !l.correct; }).map(function (l) { return typeOf(l.item); });
  if (missedTypes.indexOf("Inference") >= 0) tips.push('Practice "why do you think…" questions while reading together to build inference.');
  if (missedTypes.indexOf("Vocabulary") >= 0) tips.push("Stop on new words while reading together and talk about what they mean.");
  if (S.setup.needs.indexOf("Dyslexia") >= 0) tips.push("Dyslexia is noted. Keep audio support for science and social studies so learning there isn't held back by reading level.");
  var fast = S.log.filter(function (l) { return l.secs < (l.section === "Stories" ? 3 : FAST) && l.given !== "I don't know"; }).length;
  var idk = S.log.filter(function (l) { return l.given === "I don't know"; }).length;
  if (fast >= 4) tips.unshift(fast + " answers were tapped very quickly, which can mean guessing. If the results look low, try the check again after a break.");
  if (!tips.length) tips.push(nick() + " is right around grade level. Lessons can start with " + gName(g) + " material.");
  return cards + '<div class="card stack"><h3>Suggestions</h3><ul class="clean">' + tips.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ul>" +
    '<p class="small muted">' + fast + ' very fast answers (possible guessing) · ' + idk + ' "I don\'t know" answers</p></div>';
}
function mathResults() {
  var A = analyseMath(), g = S.setup.grade;
  if (!A.length) return '<div class="card">No answers yet.</div>';
  var by = function (b) { return A.filter(function (a) { return a.band === b; }); };
  var lower = function (list) { var n = list.map(function (a) { return a.st.name.toLowerCase(); }); return n.length < 3 ? n.join(" and ") : n.slice(0, -1).join("; ") + "; and " + n[n.length - 1]; };
  var parts = [];
  if (by("high").length) parts.push("strongest in " + lower(by("high")));
  if (by("avg").length) parts.push("at or near grade level in " + lower(by("avg")));
  if (by("low").length) parts.push("ready for more practice in " + lower(by("low")));
  var sumLine = parts.length ? nick() + " is " + parts.join(". " + nick() + " is ") + "." : "";
  var bandBox = function (b) {
    return '<div class="bbox ' + b + '"><span class="bname">' + BANDS[b].name + '</span><span class="small">' + BANDS[b].sub + "</span>" +
      (by(b).length ? "<ul>" + by(b).map(function (a) { return "<li>" + esc(a.st.name) + "</li>"; }).join("") + "</ul>" : '<span class="small muted">None this time</span>') + "</div>";
  };
  var order = { low: 0, avg: 1, high: 2 };
  var cards = A.slice().sort(function (x, y) { return order[x.band] - order[y.band]; }).map(function (a) {
    var lv = a.L != null ? "Secure at " + gName(a.L) + " level" : "Not yet secure at " + gName(lowestTried(a.M)) + " level";
    var miss = a.missed.map(function (l) { return "<li>" + fracHTML(l.item) + ' <span class="muted">(' + gName(l.level) + "; answered " + fracHTML(l.given) + ")</span></li>"; }).join("");
    return '<div class="card stack"><div class="area-head"><span class="pill2 ' + a.band + '">' + BANDS[a.band].name + "</span><h3>" + esc(a.st.name) + '</h3><span class="spacer"></span><span class="small muted">' + lv + "</span></div>" +
      '<div class="area-grid"><div class="stack-sm"><span class="eyebrow-soft">Did well with</span><p>' + (a.L != null ? esc(cap(a.st.levels[a.L].skill)) + "." : "Not yet. Every answer here still helps plan lessons.") + "</p></div>" +
      '<div class="stack-sm"><span class="eyebrow-soft">Suggestions</span><ul class="clean">' + a.tips.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ul></div></div>" +
      (a.missed.length ? '<details class="miss" open><summary>Questions to look at together (' + a.missed.length + ')</summary><ul class="clean">' + miss + "</ul></details>" : '<p class="small muted">Every question in this area was right.</p>') + "</div>";
  }).join("");
  var fastAll = S.log.filter(function (l) { return l.secs < FAST && l.given !== "I don't know"; }).length;
  return '<div class="stack"><p class="measure">' + sumLine + '</p><div class="bands">' + bandBox("high") + bandBox("avg") + bandBox("low") + "</div>" +
    '<p class="small muted">High means secure above ' + gName(g) + " level. Average means secure at " + gName(g) + ' level or one grade below. Low means two or more grades below, or not yet secure at the first level. "Secure" means 2 or 3 of 3 questions right at that level.</p></div>' +
    '<div class="card stack"><h3>Levels in each area</h3>' + ladder(A.map(function (a) { return ladderRow(a.st.name, a.M, RULES.math, a.st.min, a.st.max, a.L); }).join(""), "2 or 3 of 3 right") + "</div>" +
    '<div class="stack"><h2>Each area, with suggestions</h2>' + cards + "</div>" +
    (fastAll >= 4 ? '<div class="notice warn">' + fastAll + " answers were tapped very quickly, which can mean guessing. If any area looks lower than you expect, have " + nick() + " try the check again after a break.</div>" : "");
}
function feedbackBox() {
  return '<div class="card stack no-print"><h3>Tell us what you think</h3>' +
    "<p>We'd love your thoughts on the check: what worked, what was confusing, and anything you'd change. Please email them to <b>" + FEEDBACK_EMAIL + '</b> <button type="button" class="copy-email" data-email="' + FEEDBACK_EMAIL + '" aria-live="polite">Copy</button>.</p>' +
    '<p class="small muted">Please send only your thoughts and feedback. You don\'t need to send your results or anything about your student.</p></div>';
}
function vResults() {
  return '<div class="stack-lg">' +
    '<div class="card stack no-print"><h2>Save these results now</h2>' +
    "<p>These results are shown one time. They are not saved anywhere, and they are deleted when you close this page or press <b>Delete and finish</b>.</p>" +
    '<div class="save-bar"><button type="button" class="cbtn primary" data-act="download">Download results (HTML)</button>' +
    '<button type="button" class="cbtn" data-act="pdf">Save as PDF</button><span class="spacer"></span>' +
    '<button type="button" class="cbtn danger" data-act="deleteAsk">Delete and finish</button></div>' +
    '<p class="small muted" id="saveMsg" aria-live="polite">' + (S.downloaded ? "Downloaded. Check your Downloads folder." : "Save as PDF opens your browser's print window. Choose “Save as PDF” as the printer.") + "</p></div>" +
    resultsBody() + feedbackBox() + "</div>";
}

/* ---------- delete ---------- */
function vDeleteAsk() {
  return '<div class="stack-lg"><div class="card stack notice danger" role="alertdialog" aria-labelledby="delTitle" aria-describedby="delText">' +
    '<h2 id="delTitle">Delete everything?</h2>' +
    '<p id="delText">All information you entered (nickname, grade, learning needs) and ' + (S.finishedAt || S.log.length ? "all of " + nick() + "'s answers and results" : "any answers") + " will be deleted from this page. This can't be undone. Nothing was ever saved or sent anywhere else.</p>" +
    (S.finishedAt && !S.downloaded ? '<p><b>You haven\'t downloaded the results yet.</b> Go back to save them first if you want to keep them.</p>' : "") +
    '<div class="row"><button type="button" class="cbtn danger solid" data-act="deleteYes">Yes, delete everything</button><button type="button" class="cbtn" data-act="deleteNo">Go back</button></div></div></div>';
}
function vDeleted() {
  return '<div class="stack-lg"><div class="card stack"><span class="eyebrow">Deleted</span><h2>All entered information and results have been deleted.</h2>' +
    "<p>Nothing from this check is left on this page, and nothing was saved or sent anywhere.</p>" +
    '<div class="row"><a class="btn btn-sun" href="/level-setting/">Back to Level Setting</a><button type="button" class="cbtn" data-act="restart">Start a new ' + (READING ? "reading" : "math") + " check</button></div></div>" + feedbackBox() + "</div>";
}

/* ---------- download: one self-contained HTML file ---------- */
var FILE_CSS = [
  ":root{--paper:#fbfcf8;--paper-2:#eef1e8;--card:#fff;--line:#d9dfd0;--ink:#1c2b3a;--ink-soft:#4a5a68;--sky:#2c6fb7;--sky-soft:#e1ecf8;--sky-ink:#23619f;--sun:#f4b52c;--leaf:#2f7d5b;--leaf-soft:#dcefe4;--leaf-ink:#25694b;--miss:#b8432d;--miss-bg:#fbe7e3;--part:#996000;--part-bg:#fdf1d8}",
  "*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 'Atkinson Hyperlegible',Verdana,system-ui,sans-serif}",
  "main{max-width:880px;margin:0 auto;padding:28px 16px 48px}h1,h2,h3{font-family:'Bricolage Grotesque','Trebuchet MS',system-ui,sans-serif;line-height:1.15;margin:0}h1{font-size:32px}h2{font-size:24px}h3{font-size:19px}p{margin:0}",
  ".stack{display:flex;flex-direction:column;gap:16px}.stack-sm{display:flex;flex-direction:column;gap:8px}.stack-lg{display:flex;flex-direction:column;gap:24px}.spacer{flex:1}.muted{color:var(--ink-soft)}.small{font-size:.875rem}",
  ".eyebrow,.eyebrow-soft{font-size:.78rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft)}.eyebrow{color:var(--sky)}",
  ".card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px;break-inside:avoid}.notice{background:var(--paper-2);border-radius:10px;padding:12px 14px;font-size:.95rem}.notice.warn{background:var(--part-bg)}",
  "ul.clean{margin:0;padding-left:1.2em;display:flex;flex-direction:column;gap:6px}.measure{max-width:62ch}",
  ".bands{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.bbox{border-radius:14px;padding:14px;border:1px solid var(--line);display:flex;flex-direction:column;gap:6px}",
  ".bbox.high{background:var(--leaf-soft);border-color:var(--leaf)}.bbox.avg{background:var(--sky-soft);border-color:var(--sky)}.bbox.low{background:var(--part-bg);border-color:var(--part)}",
  ".bbox .bname{font-family:'Bricolage Grotesque',system-ui,sans-serif;font-weight:800;font-size:1.3rem}.bbox.high .bname{color:var(--leaf-ink)}.bbox.avg .bname{color:var(--sky-ink)}.bbox.low .bname{color:var(--part)}.bbox ul{margin:0;padding-left:1.1em;font-weight:700}",
  ".pill2{display:inline-block;font-size:.75rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase;padding:2px 10px;border-radius:999px;border:1px solid}.pill2.high{color:var(--leaf-ink);background:var(--leaf-soft)}.pill2.avg{color:var(--sky-ink);background:var(--sky-soft)}.pill2.low{color:var(--part);background:var(--part-bg)}",
  ".area-head{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}.area-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}",
  ".lvl{font-family:'Bricolage Grotesque',system-ui,sans-serif;font-size:2rem;font-weight:800}.kv{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 16px;font-size:.95rem}.kv>:nth-child(even){font-weight:700;text-align:right}",
  ".ladder{display:grid;grid-template-columns:minmax(150px,1.6fr) repeat(9,minmax(30px,1fr));gap:4px;align-items:center;font-size:.85rem}.ladder.g6{grid-template-columns:minmax(130px,1.4fr) repeat(6,minmax(36px,1fr))}",
  ".ladder .h{font-size:.72rem;font-weight:700;color:var(--ink-soft);text-align:center}.ladder .h.first{text-align:left}.ladder .cell{height:28px;border-radius:6px;border:1px solid var(--line);background:var(--paper);display:grid;place-items:center;font-size:.78rem;font-weight:700}",
  ".ladder .cell.pass,.legend i.pass{background:var(--leaf-soft);border-color:var(--leaf);color:var(--leaf-ink)}.ladder .cell.fail,.legend i.fail{background:var(--miss-bg);border-color:var(--miss);color:var(--miss)}",
  ".ladder .cell.na,.legend i.na{background:repeating-linear-gradient(135deg,var(--paper),var(--paper) 4px,var(--paper-2) 4px,var(--paper-2) 8px)}.ladder .cell.here,.legend i.here{outline:3px solid var(--sun);outline-offset:1px}.ladder .cell.grade,.legend i.grade{box-shadow:inset 0 -3px 0 var(--ink-soft)}",
  ".legend{display:flex;flex-wrap:wrap;gap:12px;font-size:.8rem;color:var(--ink-soft)}.legend i{display:inline-block;width:13px;height:13px;border-radius:4px;vertical-align:-2px;margin-right:5px;border:1px solid var(--line)}.scroll-x{overflow-x:auto}",
  "table.t{border-collapse:collapse;width:100%;font-size:.88rem}table.t th,table.t td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:top}table.t th{font-size:.72rem;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-soft)}td.ok{color:var(--leaf-ink);font-weight:700}td.no{color:var(--miss);font-weight:700}",
  "details.rvsec{border:1px solid var(--line);border-radius:12px;background:var(--card)}details.rvsec>summary{padding:12px 16px;font-weight:700}details.rvsec>div{padding:0 16px 16px;display:flex;flex-direction:column;gap:12px}details.miss summary{color:var(--sky);font-weight:700}details.miss ul{margin-top:8px}",
  ".frac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1;font-size:.9em;margin:0 .1em}.frac>span:first-child{border-bottom:.08em solid currentColor;padding:0 .12em .06em}",
  ".filehead{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:.85rem;color:var(--ink-soft);border-bottom:1px solid var(--line);padding-bottom:12px}",
  "@media (max-width:620px){.bands{grid-template-columns:1fr}}@media print{body{background:#fff}main{padding:0}.card{border-color:#ccc}}"
].join("\n");
function downloadFile() {
  var name = (S.setup.nick || "student").replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 20) || "student";
  var day = new Date(S.finishedAt || Date.now()), stamp = day.getFullYear() + "-" + String(day.getMonth() + 1).padStart(2, "0") + "-" + String(day.getDate()).padStart(2, "0");
  var doc = "<!doctype html>\n<html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" +
    "<title>" + esc(TITLE) + " results: " + nick() + "</title><style>" + FILE_CSS + "</style></head><body><main class=\"stack-lg\">" +
    '<div class="filehead"><span><b>Just4Me Education</b> · just4meed.com/level-setting</span><span>To save as a PDF, open this file in a browser and choose Print, then Save as PDF.</span></div>' +
    resultsBody() + "</main></body></html>";
  var blob = new Blob([doc], { type: "text/html" }), url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url; a.download = "just4me-" + (READING ? "reading" : "math") + "-results-" + name + "-" + stamp + ".html";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  S.downloaded = true;
  var m = $("#saveMsg"); if (m) m.textContent = "Downloaded. Check your Downloads folder.";
}

/* ---------- reviewer view ---------- */
function vReview() {
  var mc = function (o) { return "<b>" + fracHTML(o[0]) + "</b>" + (o.length > 1 ? '<br><span class="muted small">also shown: ' + o.slice(1).map(fracHTML).join(" · ") + "</span>" : ""); };
  var rules, sections;
  if (READING) {
    rules = ["The student answers on their own. Every answer is scored automatically, and nothing tells the student whether it was right.",
      "Both parts start one grade below the student's grade.",
      "<b>Word check</b> (6 per level): 5–6 right moves up a level, 4 stops, 0–3 moves down if the lower level hasn't been tried. Level = highest with 4 or more right.",
      "<b>Stories</b> (5 questions each, read silently): 5 right moves up, 4 stops, 0–3 moves down. The reading starting point is the highest story with 4 or 5 right. The student can look back at the story.",
      "\"I don't know\" counts as not right. Answers faster than 1.5 seconds (3 seconds for story questions) are counted as possible guesses.",
      "Nothing is read aloud, because that would measure listening instead of reading. Reading speed and reading aloud are not measured."];
    sections = '<details class="rvsec"><summary>Word check</summary><div>' + GRADES.map(function (g) {
      return "<h3>" + gName(g) + '</h3><div class="scroll-x" tabindex="0" role="region" aria-label="Table, scrolls sideways"><table class="t"><thead><tr><th>' + (g <= 1 ? "Picture" : "Sentence") + "</th><th>Correct answer and choices</th></tr></thead><tbody>" +
        WORDS[g].map(function (it) { return "<tr><td>" + (it.pic ? it.pic + " (" + esc(it.label) + ")" : esc(it.s)) + "</td><td>" + mc(it.o) + "</td></tr>"; }).join("") + "</tbody></table></div>";
    }).join("") + "</div></details>" +
      '<details class="rvsec"><summary>Stories and questions</summary><div>' + GRADES.map(function (g) {
        var P = PASSAGES[g];
        return '<div class="stack"><h3>' + gName(g) + ": " + esc(P.title) + ' <span class="small muted">(' + esc(P.kind) + ", " + P.paras.join(" ").split(/\s+/).length + " words)</span></h3>" + passageHTML(P, "small-type") +
          '<div class="scroll-x" tabindex="0" role="region" aria-label="Table, scrolls sideways"><table class="t"><thead><tr><th>#</th><th>Type</th><th>Question</th><th>Correct answer and choices</th></tr></thead><tbody>' +
          P.qs.map(function (q, i) { return "<tr><td>" + (i + 1) + "</td><td>" + esc(q.type) + "</td><td>" + esc(q.q) + "</td><td>" + mc(q.o) + "</td></tr>"; }).join("") + "</tbody></table></div></div>";
      }).join('<hr class="soft">') + "</div></details>";
  } else {
    rules = ["Six areas cover Kindergarten to Grade 8. A student sees the areas that fit their grade, and the parent can turn areas off.",
      "Each area starts one grade below the student's grade (or at the area's first or last level) and goes no higher than two grades above it.",
      "3 questions per level. 3 right moves up a level, 2 right stops, 0 or 1 right moves down if the lower level hasn't been tried. An area's level is the highest with 2 or 3 right.",
      "<b>High:</b> secure above grade level, or 3 of 3 at the highest level offered when it is at or above grade. <b>Average:</b> secure at grade level or one grade below. <b>Low:</b> two or more grades below, or not yet secure at the first level.",
      "Multiple-choice questions have 3 options, with wrong options based on common mistakes. Typed answers ignore commas and spaces.",
      "\"I don't know\" counts as not right. Answers under " + FAST + " seconds are flagged as possible guesses, and an area with 2 or more is marked as possibly not the student's best effort.",
      "Two practice questions come first and are never scored. No clock is shown and there is no time limit.",
      "Every question can be read aloud by the device's own voice if the parent turns it on. Nothing is recorded.",
      "Levels describe skills commonly taught at each U.S. grade. They are not tied to one state's standards."];
    sections = MATH.map(function (st) {
      return '<details class="rvsec"><summary>' + esc(st.name) + ' <span class="small muted">(' + gName(st.min) + " to " + gName(st.max) + ')</span></summary><div><div class="scroll-x" tabindex="0" role="region" aria-label="Table, scrolls sideways"><table class="t"><thead><tr><th>Level and skill</th><th>Question</th><th>Picture</th><th>Answer</th></tr></thead><tbody>' +
        Object.keys(st.levels).map(Number).map(function (l) {
          return st.levels[l].items.map(function (it, i) {
            return "<tr><td>" + (i === 0 ? "<b>" + gName(l) + '</b><br><span class="small muted">' + esc(cap(st.levels[l].skill)) + "</span>" : "") + "</td><td>" + fracHTML(it.q) + "</td><td>" + (it.fig ? '<div class="figmini">' + figure(it.fig) + "</div>" : "") + "</td><td>" +
              (it.t === "num" ? "<b>" + esc(String(it.ans).replace("-", "−")) + '</b> <span class="muted small">(typed)</span>' : mc(it.o)) + "</td></tr>";
          }).join("");
        }).join("") + "</tbody></table></div></div></details>";
    }).join("");
  }
  return '<div class="stack-lg"><div class="stack"><span class="eyebrow">For reviewers</span><h1>Every question and rule</h1>' +
    '<p class="muted measure">Everything the ' + (READING ? "reading" : "math") + " check can show, with the correct answers and scoring rules, so reviewers can check accuracy and grade level without taking the test. Please don't show this to a student before they take the check.</p></div>" +
    '<details class="rvsec" open><summary>How the check adapts and scores</summary><div><ul class="clean">' + rules.map(function (r) { return "<li>" + r + "</li>"; }).join("") + "</ul></div></details>" + sections + "</div>";
}

/* =========================================================================
   EVENTS
   ========================================================================= */
function go(fn) { fn(); render(); window.scrollTo(0, 0); }
document.addEventListener("change", function (e) {
  if (!e.target.closest("#setupForm")) return;
  readSetupForm();
  if (e.target.id === "gradeIn" && !READING) $("#areaChips").innerHTML = areaChips();
  $("#planPreview").innerHTML = planPreview(); $("#estLine").textContent = estLine();
  $("#setupErr").hidden = true;
  document.body.classList.toggle("dys", S.setup.needs.indexOf("Dyslexia") >= 0);
});
function setInput(v) {
  UI.input = v.replace(/-/g, "−").replace(/[^0-9.,−]/g, "").replace(/(?!^)−/g, "").slice(0, 12);
  var n = $("#numIn"); if (n && n.value !== UI.input) n.value = UI.input;
  var s = $('[data-act="submit"]'); if (s) s.disabled = UI.input.trim() === "" || UI.input === "−";
}
document.addEventListener("input", function (e) { if (e.target.id === "numIn") setInput(e.target.value); });
document.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && e.target.id === "numIn" && UI.input.trim() !== "" && UI.input !== "−") { e.preventDefault(); submit(false); }
  if (e.key === "Enter" && e.target.id === "nickIn") { e.preventDefault(); }
});
document.addEventListener("click", function (e) {
  var b = e.target.closest("[data-act]"); if (!b) return;
  var a = b.getAttribute("data-act");
  if (a === "next") return nextStep();
  if (a === "pick") {
    UI.sel = +b.getAttribute("data-i");
    document.querySelectorAll(".opt").forEach(function (o) { var on = +o.getAttribute("data-i") === UI.sel; o.classList.toggle("sel", on); o.setAttribute("aria-checked", on); });
    var sb = $('[data-act="submit"]'); if (sb) sb.disabled = false; return;
  }
  if (a === "key") {
    var k = b.getAttribute("data-k");
    if (k === "⌫") setInput(UI.input.slice(0, -1));
    else if (k === "−") setInput(UI.input.charAt(0) === "−" ? UI.input.slice(1) : "−" + UI.input);
    else setInput(UI.input + k);
    return;
  }
  if (a === "submit") return submit(false);
  if (a === "idk") return submit(true);
  if (a === "prNext") { UI.prOk = false; if (S.pr < PRACTICE.length - 1) { S.pr++; render(); } else nextStep(); return; }
  if (a === "doneReading") return go(function () { var T = storySec(); T.readSecs[T.level] = Math.max(1, Math.round((Date.now() - (T.readStart || UI.t0)) / 1000)); T.phase = "q"; T.idx = 0; });
  if (a === "pause") return go(function () { S.paused = true; });
  if (a === "unpause") return go(function () { S.paused = false; });
  if (a === "say") {
    try { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(speakable(b.getAttribute("data-text"))); u.rate = 0.9; speechSynthesis.speak(u); } catch (err) { /* no voice on this device */ }
    return;
  }
  if (a === "toHandoff") {
    readSetupForm();
    if (!READING && !chosen().length) { $("#setupErr").hidden = false; return; }
    return go(function () { S.pview = "handoff"; });
  }
  if (a === "handOver") return go(function () {
    S.plan = buildPlan(); S.step = 0; S.pr = 0; S.room = "student"; S.startedAt = Date.now(); S.finishedAt = null;
    S.words = null; S.story = null; S.math = {}; S.log = []; S.endedEarly = false; S.paused = false; S.gate = false; S.downloaded = false;
  });
  if (a === "resumeStudent") return go(function () { S.room = "student"; S.gate = false; });
  if (a === "toSetup") return go(function () { S.pview = "setup"; });
  if (a === "showResults") return go(function () { S.pview = "results"; });
  if (a === "closeGate") return go(function () { S.gate = false; });
  if (a === "endEarly") return go(function () { S.endedEarly = true; S.finishedAt = Date.now(); S.gate = false; S.room = "parent"; S.pview = "results"; });
  if (a === "download") return downloadFile();
  if (a === "pdf") { document.querySelectorAll("#app details").forEach(function (d) { d.open = true; }); window.print(); return; }
  if (a === "deleteAsk") return go(function () { S.pview = "deleteAsk"; });
  if (a === "deleteNo") return go(function () { S.pview = S.finishedAt ? "results" : "setup"; });
  if (a === "deleteYes") return go(function () { S = freshState(); S.pview = "deleted"; });
  if (a === "restart") return go(function () { S = freshState(); });
  if (a === "openReview") { location.hash = "review"; return; }
  if (a === "closeReview") { history.replaceState(null, "", location.pathname + location.search); render(); window.scrollTo(0, 0); return; }
});

/* Copy buttons that this script draws (site.js only wires the ones in the page when it loads). */
document.addEventListener("click", function (e) {
  var btn = e.target.closest("#app .copy-email"); if (!btn) return;
  var email = btn.getAttribute("data-email");
  function done() { btn.textContent = "Copied!"; setTimeout(function () { btn.textContent = "Copy"; }, 2000); }
  function fallback() { btn.textContent = email; }
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(email).then(done, fallback); else fallback();
});

/* Parent gate: press and hold for 2.5 seconds, so a student can't open the results by tapping. */
var holdTimer = null;
function holdStart(btn) { btn.classList.add("on"); clearTimeout(holdTimer); holdTimer = setTimeout(function () { btn.classList.remove("on"); openGate(); }, 2500); }
function holdEnd() { clearTimeout(holdTimer); document.querySelectorAll(".hold.on").forEach(function (h) { h.classList.remove("on"); }); }
document.addEventListener("pointerdown", function (e) { var h = e.target.closest("[data-hold]"); if (h) { e.preventDefault(); holdStart(h); } });
["pointerup", "pointercancel"].forEach(function (t) { document.addEventListener(t, holdEnd); });
document.addEventListener("pointerout", function (e) { var h = e.target.closest && e.target.closest("[data-hold]"); if (h && !h.contains(e.relatedTarget)) holdEnd(); });
document.addEventListener("contextmenu", function (e) { if (e.target.closest("[data-hold]")) e.preventDefault(); });
document.addEventListener("keydown", function (e) { var h = e.target.closest && e.target.closest("[data-hold]"); if (h && (e.key === " " || e.key === "Enter")) { e.preventDefault(); if (!e.repeat) holdStart(h); } });
document.addEventListener("keyup", function (e) { if (e.target.closest && e.target.closest("[data-hold]")) holdEnd(); });
function openGate() {
  if (S.plan[S.step] === "done") return go(function () { S.room = "parent"; S.pview = "results"; });
  go(function () { S.gate = true; });
}
window.addEventListener("beforeprint", function () { document.querySelectorAll("#app details").forEach(function (d) { d.open = true; }); });
/* Warn before leaving while answers or results would be lost. */
window.addEventListener("beforeunload", function (e) { if (S.plan.length && S.pview !== "deleted") { e.preventDefault(); e.returnValue = ""; } });
window.addEventListener("hashchange", function () { render(); window.scrollTo(0, 0); });
/* Testing hook for the site's browser tests (read-only view of state). */
window.__levelCheck = { state: function () { return S; }, openGate: openGate };

render();
})();
