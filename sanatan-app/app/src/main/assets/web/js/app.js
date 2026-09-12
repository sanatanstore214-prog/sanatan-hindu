/* Bhakti Daily 3.0 — app shell & router (offline-first, ES5, old-WebView safe). */
(function () {
  "use strict";
  var DATA = window.BHAKTI_DATA || { items: [], festivals: [], thoughts: [], weekday: {}, deities: {} };
  var Store = window.Store, Analytics = window.Analytics || { track: function () {} },
      Bridge = window.Bridge, ShareCard = window.ShareCard, Panchang = window.Panchang,
      Recommend = window.Recommend, Wallpaper = window.Wallpaper;

  var HIN_MONTHS_F = ["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितम्बर", "अक्टूबर", "नवम्बर", "दिसम्बर"];
  var HIN_DAYS = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
  var TYPE_LABEL = { chalisa: "चालीसा", aarti: "आरती", mantra: "मंत्र" };
  var JAAP_TARGETS = [11, 21, 51, 108, 1008];

  var byId = {};
  for (var i = 0; i < DATA.items.length; i++) byId[DATA.items[i].id] = DATA.items[i];
  function item(id) { return byId[id] || null; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function each(list, fn) { if (list) for (var i = 0; i < list.length; i++) fn(list[i], i); }
  function $(s, r) { return (r || document).querySelector(s); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  var content = $("#content"), headerEl = $("#appHeader"), navEl = $("#bottomNav");
  var _autoScroll = null, _focus = false, _curItem = null, _audio = null;

  // ---------- appearance ----------
  function applyAppearance() {
    var s = Store.getSettings(), root = document.documentElement;
    root.setAttribute("data-theme", s.theme === "system" ? "" : s.theme);
    root.style.setProperty("--font-scale", s.fontScale);
  }
  function greeting() {
    var h = new Date().getHours();
    if (h < 4) return { t: "शुभ रात्रि", ico: "🌙" };
    if (h < 12) return { t: "सुप्रभात", ico: "🌅" };
    if (h < 17) return { t: "नमस्ते", ico: "🙏" };
    if (h < 21) return { t: "शुभ संध्या", ico: "🪔" };
    return { t: "शुभ रात्रि", ico: "🌙" };
  }

  // ---------- festivals ----------
  function parseDate(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function startToday() { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
  function fmtDate(d) { return d.getDate() + " " + HIN_MONTHS_F[d.getMonth()]; }
  function festWithDays() {
    var t = startToday(), out = [];
    each(DATA.festivals, function (f, idx) {
      var d = parseDate(f.date);
      out.push({ f: f, idx: idx, d: d, days: Math.round((d - t) / 86400000) });
    });
    return out;
  }
  function nextFestival() {
    var list = festWithDays(), best = null;
    each(list, function (e) { if (e.days >= 0 && (!best || e.days < best.days)) best = e; });
    return best;
  }

  // ---------- routing ----------
  function go(route) { location.hash = "#/" + route; }
  function parseRoute() {
    var h = (location.hash || "").replace(/^#\/?/, "");
    if (!h) return { name: "home" };
    var p = h.split("/");
    if (p[0] === "read") return { name: "read", id: p[1] };
    if (p[0] === "lib") return { name: "lib", type: p[1] || "chalisa" };
    if (p[0] === "festd") return { name: "festd", idx: parseInt(p[1], 10) };
    if (p[0] === "today") { var t = Recommend.today(); return { name: "read", id: t.item.id }; }
    return { name: p[0] };
  }

  function render() {
    stopAutoScroll(); _focus = false;
    document.body.classList.remove("focus-mode", "reading");
    var r = parseRoute();
    if (r.name === "read") return viewReader(r.id);
    navEl.hidden = false; headerEl.hidden = false;
    if (r.name === "jaap") return viewJaap();
    if (r.name === "lib") return viewLibrary(r.type);
    if (r.name === "fest") return viewFestivals();
    if (r.name === "festd") return viewFestivalDetail(r.idx);
    if (r.name === "search") return viewSearch();
    if (r.name === "favs") return viewFavorites();
    if (r.name === "meri") return viewMeri();
    if (r.name === "streak") return viewStreak();
    if (r.name === "reminders") return viewReminders();
    if (r.name === "settings") return viewSettings();
    if (r.name === "wall") return viewWallpapers();
    return viewHome();
  }

  function setHeader(cfg) {
    if (!cfg) {
      headerEl.innerHTML = '<div class="brand"><span class="brand-flag">🚩</span> Bhakti Daily</div>' +
        '<div class="hdr-actions"><button class="icon-btn" data-go="search" aria-label="खोज">🔍</button>' +
        '<button class="icon-btn" data-go="settings" aria-label="सेटिंग">⚙</button></div>';
    } else {
      headerEl.innerHTML = (cfg.back ? '<button class="icon-btn" data-act="back" aria-label="वापस">‹</button>' : "") +
        '<div class="hdr-title">' + esc(cfg.title) + '</div><div class="hdr-actions">' + (cfg.actions || "") + '</div>';
    }
  }
  function setNav(tab) {
    each(navEl.querySelectorAll(".nav-btn"), function (b) { b.className = "nav-btn" + (b.getAttribute("data-tab") === tab ? " active" : ""); });
  }

  // ================= HOME: AAJ KA SANATAN =================
  function viewHome() {
    setNav("home"); setHeader(null);
    var g = greeting(), now = new Date(), st = Store.getStreak();
    var rec = Recommend.today(), t = rec.item;
    var thought = DATA.thoughts.length ? DATA.thoughts[now.getDate() % DATA.thoughts.length] : "";
    var last = Store.getLastRead(), lastIt = last && item(last.id);
    var favs = Store.getFavs(), recents = Store.getRecents();
    var nf = nextFestival();

    var pan = "", tt = null;
    try {
      tt = Panchang.tithi(now);
      var sun = Panchang.sunTimes(now, Store.getCity());
      pan = '<div class="panchang">' +
        '<div class="pan-row"><span class="pan-day">' + HIN_DAYS[now.getDay()] + '</span>' +
        '<span class="pan-date">' + now.getDate() + ' ' + HIN_MONTHS_F[now.getMonth()] + ' ' + now.getFullYear() + '</span>' +
        '<span class="pan-moon">' + Panchang.moonEmoji(tt.phase) + '</span></div>' +
        '<div class="pan-grid">' +
        '<div><b>तिथि</b><span>' + tt.paksha + ' ' + tt.name + '</span></div>' +
        '<div><b>वि.सं.</b><span>~' + Panchang.vikramSamvat(now) + '</span></div>' +
        '<button data-act="city"><b>🌅 ' + esc(sun.city) + '</b><span>' + (sun.sunrise || "—") + ' · ' + (sun.sunset || "—") + '</span></button>' +
        '</div><div class="pan-note">तिथि/समय ganitiy (approx) — sthaniya panchang se confirm karein</div></div>';
    } catch (e) { pan = ""; }

    var h = '<div class="screen">';
    h += '<section class="hero compact"><div class="hero-top"><span class="hero-ico">' + g.ico + '</span>' +
      '<div><div class="hero-greet">' + esc(g.t) + '</div><div class="hero-date">आज का सनातन</div></div>' +
      '<button class="streak-chip" data-go="streak">🔥 ' + (st.count || 0) + '</button></div></section>';
    h += pan;

    h += '<div class="sec-label">आज की भक्ति</div>';
    h += '<button class="today-card" data-open="' + esc(t.id) + '" style="--accent:' + t.accent + '">' +
      '<div class="today-ico">' + t.icon + '</div><div class="today-body">' +
      '<div class="today-tag">' + esc(rec.reason) + '</div>' +
      '<div class="today-title">' + esc(t.title) + '</div>' +
      '<div class="today-cta">' + (st.todayDone ? "✓ आज पूरा — फिर पढ़ें" : "अभी शुरू करें ›") + '</div></div></button>';

    h += '<div class="tiles">' +
      tile("📿", "जाप", "jaap", "#E8590C") +
      tile("📚", "पुस्तकालय", "lib/chalisa", "#5C6BC0") +
      tile("📅", "त्योहार", "fest", "#C2185B") +
      tile("🖼️", "वॉलपेपर", "wall", "#C9A227") + '</div>';

    // quote
    h += '<div class="quote-card"><div class="quote-mark">❝</div><p>' + esc(thought) + '</p>' +
      '<button class="pill sm" data-act="share-quote" data-q="' + esc(thought) + '">↗ शेयर</button></div>';

    if (lastIt && lastIt.id !== t.id) {
      h += '<button class="row-card" data-open="' + esc(lastIt.id) + '"><span class="row-ico" style="background:' + lastIt.accent + '22;color:' + lastIt.accent + '">↺</span>' +
        '<span class="row-body"><b>जहाँ छोड़ा था</b><small>' + esc(lastIt.title) + '</small></span><span class="chev">›</span></button>';
    }
    if (nf) {
      h += '<div class="sec-label">आगामी त्योहार</div>' +
        '<button class="fest-hi" data-go="festd/' + nf.idx + '" style="--accent:' + (nf.f.accent || '#E8590C') + '">' +
        '<div class="fest-hi-days"><b>' + nf.days + '</b><small>दिन</small></div>' +
        '<div class="fest-hi-body"><b>' + esc(nf.f.name) + '</b><small>' + esc(fmtDate(nf.d)) + '</small></div><span class="chev">›</span></button>';
    }
    if (favs.length) { h += '<div class="sec-label">पसंदीदा</div><div class="hscroll">'; each(favs.slice(0, 8), function (id) { var it = item(id); if (it) h += miniCard(it); }); h += '</div>'; }
    if (recents.length) { h += '<div class="sec-label">हाल ही में</div><div class="hscroll">'; each(recents.slice(0, 8), function (id) { var it = item(id); if (it) h += miniCard(it); }); h += '</div>'; }
    if (!Store.getReminders()) h += '<button class="nudge" data-go="reminders">🔔 रोज़ का भक्ति रिमाइंडर लगाएँ — बिना याद रखे भक्ति</button>';
    h += '</div>';
    content.innerHTML = h; content.scrollTop = 0;
    Analytics.track("app_open", {});
  }
  function tile(ico, label, route, color) { return '<button class="tile" data-go="' + route + '" style="--c:' + color + '"><span class="tile-ico">' + ico + '</span><span>' + esc(label) + '</span></button>'; }
  function miniCard(it) { return '<button class="mini" data-open="' + esc(it.id) + '" style="--accent:' + it.accent + '"><span class="mini-ico">' + it.icon + '</span><span class="mini-title">' + esc(it.title) + '</span><span class="mini-type">' + esc(TYPE_LABEL[it.type] || "") + '</span></button>'; }

  // ================= JAAP =================
  function viewJaap() {
    setNav("jaap"); setHeader({ title: "जाप काउंटर", back: false });
    var j = Store.getJaap(), target = Store.getJaapTarget(), s = Store.getSettings();
    var w = DATA.weekday[String(new Date().getDay())] || {};
    var deityName = (DATA.deities[w.deity] || {}).name || "";
    var pct = Math.min(100, Math.round((j.count / target) * 100));
    var h = '<div class="screen jaap">';
    h += '<div class="jaap-targets">';
    each(JAAP_TARGETS, function (n) { h += '<button class="chip' + (n === target ? ' on' : '') + '" data-act="jtarget" data-n="' + n + '">' + n + '</button>'; });
    h += '</div>';
    h += '<div class="jaap-deity">' + esc(deityName ? (deityName + " · आज") : "जाप") + '</div>';
    h += '<button class="jaap-ring" data-act="jtap" id="jaapRing" style="--pct:' + pct + '">' +
      '<div class="jaap-count" id="jaapCount">' + j.count + '</div>' +
      '<div class="jaap-of">/ ' + target + '</div>' +
      '<div class="jaap-tap">टैप करें 🙏</div></button>';
    h += '<div class="jaap-stats"><div><b>' + (j.rounds || 0) + '</b><small>आज माला</small></div>' +
      '<div><b>' + j.count + '</b><small>अभी</small></div>' +
      '<div><b>' + (j.total || 0) + '</b><small>कुल जाप</small></div></div>';
    h += '<div class="jaap-ctrls">' +
      '<button class="pill" data-act="jvib">' + (s.jaapVib === false ? "📳 वाइब्रेशन: बंद" : "📳 वाइब्रेशन: चालू") + '</button>' +
      '<button class="pill" data-act="jsound">' + (s.jaapSound ? "🔊 ध्वनि: चालू" : "🔇 ध्वनि: बंद") + '</button>' +
      '<button class="pill" data-act="jreset">↺ रीसेट</button></div>';
    h += '</div>';
    content.innerHTML = h; content.scrollTop = 0;
    Analytics.track("jaap_started", { target: target });
  }
  function jaapTap() {
    var target = Store.getJaapTarget(), s = Store.getSettings();
    var j = Store.jaapInc();
    var cEl = $("#jaapCount"), ring = $("#jaapRing");
    if (cEl) cEl.textContent = j.count;
    if (ring) ring.style.setProperty("--pct", Math.min(100, Math.round((j.count / target) * 100)));
    if (s.jaapVib !== false) Bridge.vibrate(18);
    if (s.jaapSound) beep();
    if (j.count >= target) {
      Store.jaapCompleteRound(target);
      var res = Store.markToday();
      Analytics.track("jaap_completed", { target: target, rounds: j.rounds });
      var w = DATA.weekday[String(new Date().getDay())] || {};
      modal('<div class="modal-card celebrate"><div class="m-ico">🙏</div><h2>' + target + ' जाप पूर्ण!</h2>' +
        '<p>आपने आज ' + target + ' बार जाप किया।<br>🔥 ' + res.count + ' दिन की भक्ति।</p>' +
        '<div class="modal-btns"><button class="pill" data-act="share-jaap" data-t="' + target + '">↗ शेयर</button>' +
        '<button class="cta-btn" data-act="close-modal">जय हो 🚩</button></div></div>');
      if (res.milestone) { /* streak milestone bhi */ }
    }
  }
  var _ac = null;
  function beep() {
    try {
      if (!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)();
      var o = _ac.createOscillator(), gg = _ac.createGain();
      o.frequency.value = 660; o.type = "sine"; o.connect(gg); gg.connect(_ac.destination);
      gg.gain.setValueAtTime(0.14, _ac.currentTime); gg.gain.exponentialRampToValueAtTime(0.001, _ac.currentTime + 0.18);
      o.start(); o.stop(_ac.currentTime + 0.19);
    } catch (e) {}
  }

  // ================= LIBRARY =================
  function viewLibrary(type) {
    setNav("lib"); setHeader({ title: "पुस्तकालय", back: false });
    var types = ["chalisa", "aarti", "mantra"];
    var h = '<div class="screen"><div class="segbar">';
    each(types, function (tp) { h += '<button class="seg' + (tp === type ? " on" : "") + '" data-go="lib/' + tp + '">' + esc(TYPE_LABEL[tp]) + '</button>'; });
    h += '</div><div class="list">';
    each(DATA.items, function (it) {
      if (it.type !== type) return;
      var soon = it.status !== "ready";
      h += '<button class="list-card' + (soon ? " soon" : "") + '" ' + (soon ? 'data-soon="1"' : 'data-open="' + esc(it.id) + '"') + ' style="--accent:' + it.accent + '">' +
        '<span class="lc-ico">' + it.icon + '</span><span class="lc-body"><b>' + esc(it.title) + '</b><small>' + esc((DATA.deities[it.deity] || {}).name || it.subtitle || "") + '</small></span>' +
        (soon ? '<span class="badge">जल्द</span>' : (Store.isFav(it.id) ? '<span class="chev fav">★</span>' : '<span class="chev">›</span>')) + '</button>';
    });
    h += '</div></div>';
    content.innerHTML = h; content.scrollTop = 0;
    Analytics.track("content_open", { section: "library", type: type });
  }

  // ================= FESTIVALS =================
  function viewFestivals() {
    setNav("fest"); setHeader({ title: "त्योहार व व्रत", back: false });
    var list = festWithDays(), t = startToday();
    var h = '<div class="screen"><div class="list">';
    each(list, function (e) {
      var past = e.days < 0, isNext = false;
      var nf = nextFestival(); isNext = nf && nf.idx === e.idx;
      h += '<button class="list-card' + (past ? ' soon' : '') + (isNext ? ' next' : '') + '" data-go="festd/' + e.idx + '" style="--accent:' + (e.f.accent || '#E8590C') + '">' +
        '<span class="fest-date"><b>' + e.d.getDate() + '</b><small>' + HIN_MONTHS_F[e.d.getMonth()].substr(0, 3) + '</small></span>' +
        '<span class="lc-body"><b>' + esc(e.f.name) + '</b><small>' + (past ? 'बीत गया' : (e.days === 0 ? 'आज' : e.days + ' दिन बाद')) + '</small></span>' +
        (isNext ? '<span class="badge on">अगला</span>' : '<span class="chev">›</span>') + '</button>';
    });
    h += '</div><p class="disclaimer">⚠️ तिथि 1-2 दिन आगे-पीछे हो सकती है। स्थानीय पंचांग से पुष्टि करें।</p></div>';
    content.innerHTML = h; content.scrollTop = 0;
  }
  function viewFestivalDetail(idx) {
    var f = DATA.festivals[idx];
    if (!f) { go("fest"); return; }
    setNav("fest"); setHeader({ title: f.name, back: true });
    var d = parseDate(f.date), days = Math.round((d - startToday()) / 86400000);
    var A = f.accent || "#E8590C";
    var h = '<div class="screen"><div class="fest-hero" style="--accent:' + A + '">' +
      '<div class="fest-hero-cd">' + (days < 0 ? 'बीत गया' : (days === 0 ? '🎉 आज' : days + ' दिन बाद')) + '</div>' +
      '<h1>' + esc(f.name) + '</h1><div class="fest-hero-date">' + HIN_DAYS[d.getDay()] + ', ' + fmtDate(d) + ' ' + d.getFullYear() + '</div></div>';
    if (f.info) h += '<div class="info-card">' + esc(f.info) + '</div>';
    if (f.greeting) h += '<div class="greet-card"><p>' + esc(f.greeting) + '</p>' +
      '<button class="cta-btn" data-act="share-fest" data-i="' + idx + '">🖼️ शुभकामना कार्ड शेयर करें</button></div>';
    var rel = [];
    each(f.related || [], function (id) { var it = item(id); if (it && it.status === "ready") rel.push(it); });
    if (rel.length) {
      h += '<div class="sec-label">सम्बंधित भक्ति</div><div class="list">';
      each(rel, function (it) {
        h += '<button class="list-card" data-open="' + esc(it.id) + '" style="--accent:' + it.accent + '"><span class="lc-ico">' + it.icon + '</span>' +
          '<span class="lc-body"><b>' + esc(it.title) + '</b><small>' + esc(TYPE_LABEL[it.type]) + '</small></span><span class="chev">›</span></button>';
      });
      h += '</div>';
    }
    h += '</div>';
    content.innerHTML = h; content.scrollTop = 0;
    Analytics.track("festival_opened", { name: f.name });
  }

  // ================= WALLPAPERS =================
  function viewWallpapers() {
    setNav("meri"); setHeader({ title: "वॉलपेपर", back: true });
    var h = '<div class="screen"><p class="muted">रोज़ का देवोत्सव वॉलपेपर — डाउनलोड, शेयर या सेट करें।</p><div class="wall-grid">';
    each(Wallpaper.themes, function (th) {
      h += '<button class="wall-card" data-act="wall-open" data-k="' + th.key + '" style="background:linear-gradient(160deg,' + th.accent + ',' + shade(th.accent) + ')">' +
        '<span class="wall-sym">' + th.symbol + '</span><span class="wall-title">' + esc(th.title) + '</span></button>';
    });
    h += '</div></div>';
    content.innerHTML = h; content.scrollTop = 0;
    Analytics.track("wallpaper_opened", {});
  }
  function shade(hex) { hex = hex.replace("#", ""); var r = parseInt(hex.substr(0, 2), 16), g = parseInt(hex.substr(2, 2), 16), b = parseInt(hex.substr(4, 2), 16); return "rgb(" + Math.round(r * .45) + "," + Math.round(g * .45) + "," + Math.round(b * .45) + ")"; }
  function openWallpaper(key) {
    var th = null; each(Wallpaper.themes, function (t) { if (t.key === key) th = t; });
    if (!th) return;
    var url;
    try { url = Wallpaper.build(th); } catch (e) { toast("वॉलपेपर नहीं बना"); return; }
    modal('<div class="modal-card wall-preview"><img src="' + url + '" alt=""/>' +
      '<div class="modal-btns">' +
      (Bridge.isNative() ? '<button class="pill" data-act="wall-set" data-k="' + key + '">📱 सेट</button>' +
        '<button class="pill" data-act="wall-save" data-k="' + key + '">⬇ सेव</button>' : '') +
      '<button class="pill" data-act="wall-share" data-k="' + key + '">↗ शेयर</button>' +
      '<button class="pill sm" data-act="close-modal">✕</button></div></div>');
  }

  // ================= READER =================
  function viewReader(id) {
    var it = item(id);
    if (!it) { go("home"); return; }
    navEl.hidden = true;
    if (it.status !== "ready") return viewComingSoon(it);
    _curItem = it;
    Store.pushRecent(it.id); Store.setLastRead(it.id, 0);
    var fav = Store.isFav(it.id);
    setHeader({ title: it.title, back: true, actions:
      '<button class="icon-btn" data-act="fontdec">A−</button><button class="icon-btn" data-act="fontinc">A+</button><button class="icon-btn" data-act="focus">⤢</button>' });
    document.body.classList.add("reading");
    var audioBlock = it.audio
      ? '<div class="audio-bar" id="audioBar"><button class="au-btn" data-act="audio-toggle">▶</button><div class="au-track"><i id="auProg"></i></div><span id="auTime">0:00</span></div>'
      : '<div class="audio-bar disabled">🔊 ऑडियो जल्द आ रहा है</div>';
    var h = '<div class="screen reader"><div class="read-progress"><i id="readBar"></i></div>' +
      '<h1 class="read-title" style="color:' + it.accent + '">' + esc(it.title) + '</h1>' +
      (it.subtitle ? '<div class="read-sub">' + esc(it.subtitle) + '</div>' : '') +
      audioBlock +
      '<div class="read-text" id="readText">' + esc(it.text) + '</div>' +
      (it.meaning ? '<div class="read-meaning"><b>अर्थ:</b> ' + esc(it.meaning) + '</div>' : '') +
      '<div class="read-actions">' +
        '<button class="pill ' + (fav ? "on" : "") + '" data-act="fav" data-id="' + esc(it.id) + '">' + (fav ? "★" : "☆") + ' पसंद</button>' +
        '<button class="pill" data-act="autoscroll">↓ स्क्रॉल</button>' +
        '<button class="pill" data-act="copy" data-id="' + esc(it.id) + '">⧉ कॉपी</button>' +
        '<button class="pill" data-act="share" data-id="' + esc(it.id) + '">↗ शेयर</button>' +
        '<button class="pill" data-act="sharecard" data-id="' + esc(it.id) + '">🖼️ कार्ड</button>' +
      '</div><div class="read-done" id="readDone"></div></div>';
    content.innerHTML = h; content.scrollTop = 0;
    updateDoneBtn();
    if (it.audio) setupAudio(it.audio);
    var bar = $("#readBar");
    content.onscroll = function () {
      var max = content.scrollHeight - content.clientHeight;
      var frac = max > 0 ? content.scrollTop / max : 0;
      if (bar) bar.style.width = Math.round(frac * 100) + "%";
      Store.setLastRead(it.id, frac);
      if (frac > 0.6) doMarkDone(it, true);
    };
    Analytics.track("daily_bhakti_open", { id: it.id });
    Analytics.track("content_open", { id: it.id, type: it.type });
    Analytics.track(it.type + "_open", { id: it.id });
  }
  function updateDoneBtn() {
    var el = $("#readDone"); if (!el) return;
    var st = Store.getStreak();
    el.innerHTML = st.todayDone
      ? '<div class="done-badge">🙏 आज की भक्ति पूरी हुई · 🔥 ' + st.count + ' दिन</div>'
      : '<button class="done-btn" data-act="markdone">✓ आज की भक्ति पूरी करें</button>';
  }
  function doMarkDone(it, silent) {
    var st = Store.getStreak(); if (st.todayDone) { updateDoneBtn(); return; }
    var r = Store.markToday();
    Analytics.track("streak_completed", { streak: r.count });
    updateDoneBtn();
    if (r.milestone) showMilestone(r.milestone); else if (!silent) toast("🙏 आज की भक्ति पूरी — 🔥 " + r.count + " दिन");
  }
  function viewComingSoon(it) {
    setHeader({ title: it.title, back: true });
    content.innerHTML = '<div class="screen"><div class="empty"><div class="empty-ico" style="color:' + it.accent + '">' + it.icon + '</div>' +
      '<h2>' + esc(it.title) + '</h2><p>इसका सत्यापित पाठ जल्द जोड़ा जाएगा।<br>हम केवल शुद्ध व प्रामाणिक पाठ देते हैं।</p>' +
      '<button class="pill" data-go="lib/' + it.type + '">‹ वापस</button></div></div>';
    content.scrollTop = 0;
  }
  // audio player
  function setupAudio(url) {
    try {
      _audio = new Audio(url);
      _audio.addEventListener("timeupdate", function () {
        var p = $("#auProg"), tm = $("#auTime");
        if (_audio.duration) { if (p) p.style.width = (_audio.currentTime / _audio.duration * 100) + "%"; }
        if (tm) tm.textContent = fmtTime(_audio.currentTime);
      });
    } catch (e) { _audio = null; }
  }
  function fmtTime(s) { s = Math.floor(s || 0); return Math.floor(s / 60) + ":" + pad(s % 60); }
  function toggleAudio() {
    if (!_audio) return;
    var b = $("[data-act=audio-toggle]");
    if (_audio.paused) { _audio.play(); if (b) b.textContent = "⏸"; } else { _audio.pause(); if (b) b.textContent = "▶"; }
  }
  function stopAudio() { if (_audio) { try { _audio.pause(); } catch (e) {} _audio = null; } }

  // auto-scroll
  function toggleAutoScroll() {
    if (_autoScroll) { stopAutoScroll(); toast("ऑटो-स्क्रॉल बंद"); return; }
    _autoScroll = setInterval(function () {
      content.scrollTop += 1;
      if (content.scrollTop + content.clientHeight >= content.scrollHeight - 2) stopAutoScroll();
    }, 55);
    toast("ऑटो-स्क्रॉल चालू");
  }
  function stopAutoScroll() { if (_autoScroll) { clearInterval(_autoScroll); _autoScroll = null; } }

  // ================= SEARCH =================
  function viewSearch() {
    setNav("home"); setHeader({ title: "खोज", back: true });
    content.innerHTML = '<div class="screen"><div class="searchbar"><input id="searchInput" type="text" placeholder="चालीसा, आरती, मंत्र, देवता…" autocomplete="off"></div><div id="searchResults"></div></div>';
    var inp = $("#searchInput");
    inp.addEventListener("input", function () { runSearch(inp.value); });
    runSearch("");
    setTimeout(function () { try { inp.focus(); } catch (e) {} }, 100);
  }
  function runSearch(q) {
    q = (q || "").toLowerCase().trim();
    var res = [];
    each(DATA.items, function (it) {
      var deityName = (DATA.deities[it.deity] || {}).name || "";
      var hay = (it.title + " " + (it.subtitle || "") + " " + deityName + " " + it.type + " " + (it.keywords || []).join(" ")).toLowerCase();
      if (!q || hay.indexOf(q) !== -1) res.push(it);
    });
    var box = $("#searchResults");
    if (!q) { // suggestions
      box.innerHTML = '<div class="sec-label">सुझाव</div><div class="chips wrap">' +
        chip("हनुमान") + chip("शिव") + chip("गायत्री") + chip("आरती") + chip("दुर्गा") + chip("कृष्ण") + '</div>' + listHtml(res);
      each(box.querySelectorAll("[data-sq]"), function (c) { c.addEventListener("click", function () { var inp = $("#searchInput"); inp.value = c.getAttribute("data-sq"); runSearch(inp.value); }); });
      return;
    }
    box.innerHTML = res.length ? listHtml(res) : '<div class="empty small"><div class="empty-ico">🔍</div><p>कुछ नहीं मिला। दूसरा शब्द आज़माएँ।</p></div>';
  }
  function chip(w) { return '<button class="chip" data-sq="' + esc(w) + '">' + esc(w) + '</button>'; }
  function listHtml(res) {
    var h = '<div class="list">';
    each(res, function (it) {
      var soon = it.status !== "ready";
      h += '<button class="list-card' + (soon ? " soon" : "") + '" ' + (soon ? 'data-soon="1"' : 'data-open="' + esc(it.id) + '"') + ' style="--accent:' + it.accent + '">' +
        '<span class="lc-ico">' + it.icon + '</span><span class="lc-body"><b>' + esc(it.title) + '</b><small>' + esc(TYPE_LABEL[it.type]) + (soon ? ' · जल्द' : '') + '</small></span><span class="chev">' + (soon ? '' : '›') + '</span></button>';
    });
    return h + '</div>';
  }

  // ================= FAVORITES =================
  function viewFavorites() {
    setNav("meri"); setHeader({ title: "पसंदीदा", back: true });
    var favs = Store.getFavs();
    if (!favs.length) { content.innerHTML = '<div class="screen"><div class="empty"><div class="empty-ico">☆</div><h2>अभी कोई पसंदीदा नहीं</h2><p>कोई पाठ खोलकर ☆ दबाएँ।</p><button class="pill" data-go="lib/chalisa">पुस्तकालय</button></div></div>'; return; }
    var arr = []; each(favs, function (id) { var it = item(id); if (it) arr.push(it); });
    content.innerHTML = '<div class="screen">' + listHtml(arr) + '</div>';
  }

  // ================= STREAK =================
  function viewStreak() {
    setNav("meri"); setHeader({ title: "भक्ति स्ट्रीक", back: true });
    var st = Store.getStreak(), next = Store.nextMilestone(st.count || 0);
    var h = '<div class="screen"><div class="streak-hero"><div class="streak-flame">🔥</div><div class="streak-num">' + (st.count || 0) + '</div>' +
      '<div class="streak-cap">दिन लगातार भक्ति</div><div class="streak-sub">' + (st.todayDone ? "🙏 आज पूरा हुआ" : "आज बाकी है") + '</div>' +
      '<div class="streak-best">सर्वश्रेष्ठ: ' + (st.best || 0) + ' दिन</div></div><div class="sec-label">मील के पत्थर</div><div class="miles">';
    each(Store.milestones, function (m) { var done = (st.best || 0) >= m; h += '<div class="mile' + (done ? " done" : "") + '"><span>' + (done ? "✓" : m) + '</span><small>' + m + '</small></div>'; });
    h += '</div>';
    if (next) h += '<p class="muted center">अगला लक्ष्य: <b>' + next + ' दिन</b> — ' + (next - (st.count || 0)) + ' दिन और 🙏</p>';
    h += '<button class="cta-btn" data-go="today">आज की भक्ति करें</button></div>';
    content.innerHTML = h; content.scrollTop = 0;
  }

  // ================= MERI BHAKTI =================
  function viewMeri() {
    setNav("meri"); setHeader({ title: "मेरी भक्ति", back: false });
    var st = Store.getStreak(), j = Store.getJaap(), favs = Store.getFavs(), rec = Store.getRecents();
    var rem = Store.getReminders(); var remOn = rem ? rem.filter(function (r) { return r.enabled; }).length : 0;
    var h = '<div class="screen">';
    h += '<div class="stat-row"><button class="stat" data-go="streak"><b>🔥 ' + (st.count || 0) + '</b><small>स्ट्रीक</small></button>' +
      '<button class="stat" data-go="jaap"><b>📿 ' + (j.total || 0) + '</b><small>कुल जाप</small></button>' +
      '<button class="stat" data-go="favs"><b>★ ' + favs.length + '</b><small>पसंदीदा</small></button></div>';
    h += '<div class="card-group">' +
      linkRow("★ पसंदीदा", "favs") + linkRow("🔥 भक्ति स्ट्रीक", "streak") +
      linkRow("📿 जाप काउंटर", "jaap") + linkRow("🖼️ वॉलपेपर", "wall") +
      linkRow("🔔 रिमाइंडर (" + remOn + " चालू)", "reminders") + linkRow("⚙ सेटिंग", "settings") + '</div>';
    if (rec.length) { h += '<div class="sec-label">हाल ही में</div><div class="hscroll">'; each(rec.slice(0, 10), function (id) { var it = item(id); if (it) h += miniCard(it); }); h += '</div>'; }
    h += '<button class="nudge" data-act="share-app">🙏 दोस्तों को Bhakti Daily भेजें</button></div>';
    content.innerHTML = h; content.scrollTop = 0;
  }
  function linkRow(label, route) { return '<button class="set-row link-row" data-go="' + route + '"><span>' + esc(label) + '</span><span class="chev">›</span></button>'; }

  // ================= REMINDERS =================
  var DEFAULT_REMINDERS = [
    { id: "morning", enabled: true, hour: 7, minute: 0, title: "🙏 शुभ प्रभात — आज की भक्ति शुरू करें", target: "today" },
    { id: "chalisa", enabled: false, hour: 8, minute: 0, title: "🚩 चालीसा का समय — आज का पाठ पढ़ें", target: "today" },
    { id: "evening", enabled: false, hour: 18, minute: 30, title: "🪔 संध्या भक्ति — आज की आरती पढ़ें", target: "lib/aarti" },
    { id: "festival", enabled: false, hour: 8, minute: 0, title: "📅 आज विशेष त्योहार — दर्शन करें", target: "fest" }
  ];
  var REM_LABEL = { morning: "प्रातः भक्ति", chalisa: "दैनिक चालीसा", evening: "संध्या आरती", festival: "त्योहार रिमाइंडर" };
  function loadReminders() { var r = Bridge.getReminders() || Store.getReminders(); if (!r || !r.length) r = DEFAULT_REMINDERS.slice(); return r; }
  function saveReminders(r) { Store.setReminders(r); Bridge.setReminders(r); }
  function viewReminders() {
    setNav("meri"); setHeader({ title: "रिमाइंडर", back: true });
    var r = loadReminders(), perm = Bridge.hasNotificationPermission();
    var h = '<div class="screen">';
    if (!perm) h += '<div class="warn">🔔 नोटिफिकेशन की अनुमति चाहिए। <button class="link" data-act="reqperm">अनुमति दें</button></div>';
    h += '<p class="muted">रोज़ इसी समय भक्ति का स्मरण। ज़रूरत हो उतने ही चालू रखें।</p><div class="list">';
    each(r, function (rem) {
      h += '<div class="rem-card"><div class="rem-top"><b>' + esc(REM_LABEL[rem.id] || "रिमाइंडर") + '</b>' +
        '<label class="switch"><input type="checkbox" data-act="rem-toggle" data-rid="' + rem.id + '"' + (rem.enabled ? " checked" : "") + '><span></span></label></div>' +
        '<div class="rem-time"><input type="time" data-act="rem-time" data-rid="' + rem.id + '" value="' + pad(rem.hour) + ':' + pad(rem.minute) + '"></div>' +
        '<div class="rem-msg">' + esc(rem.title) + '</div></div>';
    });
    h += '</div><p class="muted small">⚠️ कुछ फोन (Xiaomi/Oppo/Vivo) बैटरी सेविंग में रोक देते हैं — app को Autostart / बैटरी: No restriction दें।</p></div>';
    content.innerHTML = h; content.scrollTop = 0;
  }

  // ================= SETTINGS =================
  function viewSettings() {
    setNav("meri"); setHeader({ title: "सेटिंग", back: true });
    var s = Store.getSettings(), prem = Store.isPremium(), city = Store.getCity();
    var cityName = (Panchang.cities[city] || {}).name || city;
    var h = '<div class="screen"><div class="sec-label">दिखावट</div><div class="card-group">' +
      rowChips("थीम", [["system", "फोन जैसा"], ["light", "उजाला"], ["dark", "अँधेरा"]], s.theme, "theme") +
      '<div class="set-row"><span>अक्षर आकार</span><div class="fontctl"><button class="icon-btn" data-act="fontdec">A−</button><b>' + Math.round(s.fontScale * 100) + '%</b><button class="icon-btn" data-act="fontinc">A+</button></div></div>' +
      '<button class="set-row link-row" data-act="city"><span>पंचांग शहर</span><span class="chev">' + esc(cityName) + ' ›</span></button></div>';
    h += '<div class="sec-label">भक्ति</div><div class="card-group">' + linkRow("🔔 रिमाइंडर", "reminders") + linkRow("🔥 स्ट्रीक", "streak") + linkRow("📿 जाप", "jaap") + '</div>';
    h += '<div class="sec-label">मोनेटाइज़ेशन</div><div class="card-group"><div class="set-row"><span>विज्ञापन हटाएँ (Premium)</span>' + (prem ? '<span class="badge on">सक्रिय</span>' : '<button class="pill sm" data-act="premium">देखें</button>') + '</div></div>';
    h += '<div class="sec-label">प्राइवेसी</div><div class="card-group"><div class="set-row"><span>गुमनाम एनालिटिक्स</span><label class="switch"><input type="checkbox" data-act="analytics"' + (s.analytics !== false ? " checked" : "") + '><span></span></label></div></div>';
    h += '<div class="sec-label">ऐप</div><div class="card-group"><button class="set-row link-row" data-act="share-app"><span>↗ ऐप शेयर करें</span><span class="chev">›</span></button><div class="set-row muted"><span>Bhakti Daily</span><span>v3.0</span></div></div>';
    h += '</div>';
    content.innerHTML = h; content.scrollTop = 0;
  }
  function rowChips(label, opts, val, act) {
    var h = '<div class="set-row"><span>' + esc(label) + '</span><div class="chips">';
    each(opts, function (o) { h += '<button class="chip' + (o[0] === val ? " on" : "") + '" data-act="' + act + '" data-val="' + o[0] + '">' + esc(o[1]) + '</button>'; });
    return h + '</div></div>';
  }
  function showCityPicker() {
    var h = '<div class="modal-card"><h2>पंचांग शहर</h2><div class="city-list">';
    for (var k in Panchang.cities) h += '<button class="city-opt" data-act="setcity" data-c="' + k + '">' + esc(Panchang.cities[k].name) + '</button>';
    h += '</div><button class="pill sm" data-act="close-modal">✕</button></div>';
    modal(h);
  }
  function showPremium() {
    modal('<div class="modal-card"><div class="m-ico">🚫📢</div><h2>विज्ञापन हटाएँ</h2><p>Premium se saare ads hat jaate hain.</p><p class="muted small">Note: In-app purchase (Google Play Billing) tab chalu hoga jab app publish + billing setup hoga. Architecture ready hai; nakli purchase nahi.</p><button class="cta-btn" data-act="close-modal">ठीक है</button></div>');
    Analytics.track("premium_clicked", {});
  }

  // ================= events =================
  document.addEventListener("click", function (e) {
    var t = e.target;
    while (t && t !== document) {
      if (t.getAttribute) {
        if (t.getAttribute("data-soon")) { toast("यह पाठ जल्द जोड़ा जाएगा 🙏"); return; }
        var go_ = t.getAttribute("data-go"); if (go_ != null) { go(go_); return; }
        var open = t.getAttribute("data-open"); if (open != null) { go("read/" + open); return; }
        var act = t.getAttribute("data-act"); if (act) { handleAct(act, t); return; }
      }
      t = t.parentNode;
    }
  });

  function handleAct(act, el) {
    var s;
    if (act === "back") { history.length > 1 ? history.back() : go("home"); return; }
    if (act === "jtap") { jaapTap(); return; }
    if (act === "jtarget") { Store.setJaapTarget(parseInt(el.getAttribute("data-n"), 10)); viewJaap(); return; }
    if (act === "jvib") { s = Store.getSettings(); Store.setSettings({ jaapVib: s.jaapVib === false }); viewJaap(); return; }
    if (act === "jsound") { s = Store.getSettings(); Store.setSettings({ jaapSound: !s.jaapSound }); viewJaap(); return; }
    if (act === "jreset") { Store.jaapReset(); viewJaap(); return; }
    if (act === "fontinc" || act === "fontdec") {
      s = Store.getSettings(); var f = s.fontScale + (act === "fontinc" ? 0.1 : -0.1);
      f = Math.max(0.8, Math.min(1.8, Math.round(f * 10) / 10)); Store.setSettings({ fontScale: f }); applyAppearance();
      if (parseRoute().name === "settings") viewSettings(); return;
    }
    if (act === "focus") { _focus = !_focus; document.body.classList.toggle("focus-mode", _focus); Bridge.setAdsEnabled(!_focus && !Store.isPremium()); return; }
    if (act === "autoscroll") { toggleAutoScroll(); return; }
    if (act === "audio-toggle") { toggleAudio(); return; }
    if (act === "fav") { var added = Store.toggleFav(el.getAttribute("data-id")); el.className = "pill" + (added ? " on" : ""); el.innerHTML = (added ? "★" : "☆") + " पसंद"; Analytics.track("favorite_added", { added: added }); toast(added ? "★ पसंदीदा में जोड़ा" : "हटाया"); return; }
    if (act === "copy") { var ci = item(el.getAttribute("data-id")); Bridge.copyText(ci.title + "\n\n" + ci.text); toast("कॉपी हो गया ⧉"); return; }
    if (act === "share") { shareItemText(item(el.getAttribute("data-id"))); return; }
    if (act === "sharecard") { try { ShareCard.shareItem(item(el.getAttribute("data-id"))); Analytics.track("share_clicked", { kind: "card" }); toast("कार्ड बन रहा है…"); } catch (e) { toast("कार्ड नहीं बना"); } return; }
    if (act === "share-quote") { try { ShareCard.shareQuote(el.getAttribute("data-q")); Analytics.track("share_clicked", { kind: "quote" }); } catch (e) {} return; }
    if (act === "share-fest") { var f = DATA.festivals[parseInt(el.getAttribute("data-i"), 10)]; try { ShareCard.shareFestival(f); Analytics.track("share_clicked", { kind: "festival" }); } catch (e) {} return; }
    if (act === "share-jaap") { var w = DATA.weekday[String(new Date().getDay())] || {}; try { ShareCard.shareJaap(el.getAttribute("data-t"), (DATA.deities[w.deity] || {}).name, w ? (DATA.deities[w.deity] || {}).accent : null); Analytics.track("share_clicked", { kind: "jaap" }); } catch (e) {} return; }
    if (act === "share-app") { Bridge.shareText("🚩 Bhakti Daily — रोज़ की भक्ति: Chalisa, Aarti, Mantra, जाप काउंटर, त्योहार, रिमाइंडर व स्ट्रीक। ज़रूर आज़माएँ 🙏"); Analytics.track("share_clicked", { kind: "app" }); return; }
    if (act === "markdone") { doMarkDone(_curItem, false); return; }
    if (act === "theme") { Store.setSettings({ theme: el.getAttribute("data-val") }); applyAppearance(); viewSettings(); return; }
    if (act === "analytics") { Store.setSettings({ analytics: el.checked }); return; }
    if (act === "premium") { showPremium(); return; }
    if (act === "city") { showCityPicker(); return; }
    if (act === "setcity") { Store.setCity(el.getAttribute("data-c")); closeModal(); render(); return; }
    if (act === "close-modal") { closeModal(); return; }
    if (act === "reqperm") { Bridge.requestNotificationPermission(); toast("अनुमति माँगी जा रही है…"); return; }
    if (act === "wall-open") { openWallpaper(el.getAttribute("data-k")); return; }
    if (act === "wall-set") { var th1 = wtheme(el.getAttribute("data-k")); try { var ok = Bridge.setWallpaper(Wallpaper.build(th1)); toast(ok ? "वॉलपेपर सेट हो गया 📱" : "सेट नहीं हो पाया"); } catch (e) {} return; }
    if (act === "wall-save") { var th2 = wtheme(el.getAttribute("data-k")); try { var ok2 = Bridge.saveImage(Wallpaper.build(th2), "bhakti-" + el.getAttribute("data-k")); toast(ok2 ? "गैलरी में सेव ⬇" : "सेव नहीं हुआ"); } catch (e) {} return; }
    if (act === "wall-share") { var th3 = wtheme(el.getAttribute("data-k")); try { Bridge.shareImage(Wallpaper.build(th3), "🚩 Bhakti Daily"); Analytics.track("share_clicked", { kind: "wallpaper" }); } catch (e) {} return; }
    if (act === "rem-toggle") {
      var r = loadReminders(), rid = el.getAttribute("data-rid");
      each(r, function (rem) { if (rem.id === rid) rem.enabled = el.checked; });
      if (el.checked && !Bridge.hasNotificationPermission()) Bridge.requestNotificationPermission();
      saveReminders(r); Analytics.track("reminder_enabled", { id: rid, on: el.checked }); toast(el.checked ? "रिमाइंडर चालू ✓" : "बंद"); return;
    }
    if (act === "rem-time") { var r2 = loadReminders(), rid2 = el.getAttribute("data-rid"), p = el.value.split(":"); each(r2, function (rem) { if (rem.id === rid2) { rem.hour = +p[0]; rem.minute = +p[1]; } }); saveReminders(r2); toast("समय सेट ✓"); return; }
  }
  function wtheme(k) { var th = null; each(Wallpaper.themes, function (t) { if (t.key === k) th = t; }); return th; }
  function shareItemText(it) { if (!it) return; Bridge.shareText(it.title + "\n\n" + (it.text || "").split("\n").slice(0, 4).join("\n") + "\n\n🚩 Bhakti Daily se"); Analytics.track("share_clicked", { kind: "text" }); }

  // ================= toast / modal =================
  var _toastT;
  function toast(msg) { var el = $("#toast"); if (!el) { el = document.createElement("div"); el.id = "toast"; document.body.appendChild(el); } el.textContent = msg; el.className = "show"; clearTimeout(_toastT); _toastT = setTimeout(function () { el.className = ""; }, 2200); }
  function modal(html) { var m = document.createElement("div"); m.className = "modal-bg"; m.id = "modalBg"; m.innerHTML = html; m.addEventListener("click", function (e) { if (e.target === m) closeModal(); }); document.body.appendChild(m); }
  function closeModal() { var m = $("#modalBg"); if (m) m.parentNode.removeChild(m); }
  function showMilestone(m) { modal('<div class="modal-card celebrate"><div class="m-ico">🎉</div><h2>' + m + ' दिन की भक्ति!</h2><p>आपने लगातार ' + m + ' दिन भक्ति की 🙏</p><div class="modal-btns"><button class="pill" data-act="share-milestone" data-d="' + m + '">↗ शेयर</button><button class="cta-btn" data-act="close-modal">जय हो 🚩</button></div></div>'); }

  // extra milestone share handler
  document.addEventListener("click", function (e) {
    var t = e.target; if (t && t.getAttribute && t.getAttribute("data-act") === "share-milestone") { try { ShareCard.shareMilestone(t.getAttribute("data-d")); } catch (x) {} } });

  // ================= boot =================
  function boot() {
    applyAppearance();
    Bridge.setAdsEnabled(!Store.isPremium());
    var initial = Bridge.getInitialRoute();
    if (initial) location.hash = "#/" + initial.replace(/^#?\/?/, "");
    window.addEventListener("hashchange", render);
    render();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
