/* Bhakti Daily — app shell & router (offline-first, old-WebView safe: ES5). */
(function () {
  "use strict";

  var DATA = window.BHAKTI_DATA || { items: [], festivals: [], thoughts: [], weekday: {}, deities: {} };
  var Store = window.Store, Analytics = window.Analytics, Bridge = window.Bridge, ShareCard = window.ShareCard;

  var HIN_MONTHS = ["जन", "फर", "मार्च", "अप्रैल", "मई", "जून", "जुल", "अग", "सित", "अक्तू", "नव", "दिस"];
  var HIN_MONTHS_F = ["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितम्बर", "अक्टूबर", "नवम्बर", "दिसम्बर"];
  var HIN_DAYS = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
  var TYPE_LABEL = { chalisa: "चालीसा", aarti: "आरती", mantra: "मंत्र" };

  // ---------- helpers ----------
  var byId = {};
  for (var i = 0; i < DATA.items.length; i++) byId[DATA.items[i].id] = DATA.items[i];
  function item(id) { return byId[id] || null; }
  function readyItems(type) {
    var out = [];
    for (var i = 0; i < DATA.items.length; i++) {
      var it = DATA.items[i];
      if ((!type || it.type === type)) out.push(it);
    }
    return out;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function each(list, fn) { if (list) for (var i = 0; i < list.length; i++) fn(list[i], i); }
  function $(sel, root) { return (root || document).querySelector(sel); }

  var content = $("#content"), headerEl = $("#appHeader"), navEl = $("#bottomNav");

  // ---------- theme / font ----------
  function applyAppearance() {
    var s = Store.getSettings();
    var root = document.documentElement;
    root.setAttribute("data-theme", s.theme === "system" ? "" : s.theme);
    root.style.setProperty("--font-scale", s.fontScale);
    document.body.classList.toggle("focus-mode", !!window._focus);
  }

  // ---------- greeting ----------
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
  function nextFestival() {
    var t = startToday(), best = null;
    each(DATA.festivals, function (f) {
      var d = parseDate(f.date);
      if (d >= t && (!best || d < best._d)) best = { name: f.name, note: f.note, _d: d };
    });
    if (best) best._days = Math.round((best._d - t) / 86400000);
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
    if (p[0] === "today") return { name: "read", id: todaysItem().id, today: true };
    return { name: p[0] };
  }
  function todaysItem() {
    var w = DATA.weekday[String(new Date().getDay())];
    return (w && item(w.item)) || item("hanuman-chalisa") || DATA.items[0];
  }

  // ---------- render dispatch ----------
  function render() {
    var r = parseRoute();
    window._focus = false;
    document.body.classList.remove("focus-mode", "reading");
    if (r.name === "read") return viewReader(r.id, r.today);
    navEl.hidden = false; headerEl.hidden = false;
    setHeader(null);
    if (r.name === "lib") return viewLibrary(r.type);
    if (r.name === "search") return viewSearch();
    if (r.name === "favs") return viewFavorites();
    if (r.name === "settings") return viewSettings();
    if (r.name === "reminders") return viewReminders();
    if (r.name === "streak") return viewStreak();
    return viewHome();
  }

  function setHeader(cfg) {
    // cfg = null -> app title; else {title, back:true, actions:html}
    var backBtn = '<button class="icon-btn" data-go="home" aria-label="होम">‹</button>';
    if (!cfg) {
      headerEl.innerHTML = '<div class="brand"><span class="brand-flag">🚩</span> Bhakti Daily</div>' +
        '<button class="icon-btn ghost" data-go="settings" aria-label="सेटिंग">⚙</button>';
    } else {
      headerEl.innerHTML = (cfg.back ? backBtn : "") +
        '<div class="hdr-title">' + esc(cfg.title) + '</div>' +
        '<div class="hdr-actions">' + (cfg.actions || "") + '</div>';
    }
  }
  function setNavActive(tab) {
    each(navEl.querySelectorAll(".nav-btn"), function (b) {
      b.className = "nav-btn" + (b.getAttribute("data-tab") === tab ? " active" : "");
    });
  }

  // ================= HOME =================
  function viewHome() {
    setNavActive("home");
    var g = greeting(), st = Store.getStreak(), t = todaysItem();
    var w = DATA.weekday[String(new Date().getDay())] || {};
    var now = new Date();
    var dateStr = HIN_DAYS[now.getDay()] + ", " + now.getDate() + " " + HIN_MONTHS_F[now.getMonth()];
    var thought = DATA.thoughts.length ? DATA.thoughts[now.getDate() % DATA.thoughts.length] : "";
    var last = Store.getLastRead(), lastIt = last && item(last.id);
    var favs = Store.getFavs(), recents = Store.getRecents();
    var nf = nextFestival();

    var h = '<div class="screen">';

    // greeting hero
    h += '<section class="hero">' +
      '<div class="hero-top"><span class="hero-ico">' + g.ico + '</span>' +
      '<div><div class="hero-greet">' + esc(g.t) + '</div>' +
      '<div class="hero-date">' + esc(dateStr) + '</div></div>' +
      '<button class="streak-chip" data-go="streak" title="भक्ति स्ट्रीक">🔥 ' + (st.count || 0) + '</button></div>' +
      '<div class="hero-thought">“' + esc(thought) + '”</div>' +
      '</section>';

    // Today's bhakti (primary CTA)
    h += '<div class="sec-label">आज की भक्ति</div>';
    h += '<button class="today-card" data-open="' + esc(t.id) + '" style="--accent:' + t.accent + '">' +
      '<div class="today-ico">' + t.icon + '</div>' +
      '<div class="today-body"><div class="today-tag">' + esc(w.label || "आज का पाठ") + '</div>' +
      '<div class="today-title">' + esc(t.title) + '</div>' +
      '<div class="today-cta">' + (st.todayDone ? "✓ आज पूरा — फिर पढ़ें" : "अभी शुरू करें ›") + '</div></div>' +
      '</button>';

    // continue reading
    if (lastIt && lastIt.id !== t.id) {
      h += '<button class="row-card" data-open="' + esc(lastIt.id) + '">' +
        '<span class="row-ico" style="background:' + lastIt.accent + '22;color:' + lastIt.accent + '">↺</span>' +
        '<span class="row-body"><b>जहाँ छोड़ा था</b><small>' + esc(lastIt.title) + '</small></span><span class="chev">›</span></button>';
    }

    // quick tiles
    h += '<div class="sec-label">पुस्तकालय</div><div class="tiles">' +
      tile("📿", "चालीसा", "lib/chalisa", "#E8590C") +
      tile("🪔", "आरती", "lib/aarti", "#C2185B") +
      tile("🕉️", "मंत्र", "lib/mantra", "#5C6BC0") +
      tile("★", "पसंदीदा", "favs", "#C9A227") +
      '</div>';

    // favorites row
    if (favs.length) {
      h += '<div class="sec-label">आपके पसंदीदा</div><div class="hscroll">';
      each(favs.slice(0, 8), function (id) { var it = item(id); if (it) h += miniCard(it); });
      h += '</div>';
    }
    // recents row
    if (recents.length) {
      h += '<div class="sec-label">हाल ही में</div><div class="hscroll">';
      each(recents.slice(0, 8), function (id) { var it = item(id); if (it) h += miniCard(it); });
      h += '</div>';
    }

    // festival + reminder nudge
    if (nf) {
      h += '<div class="sec-label">आगामी त्योहार</div>' +
        '<button class="row-card" data-go="home" style="cursor:default">' +
        '<span class="row-ico" style="background:#F57C0022;color:#F57C00">📅</span>' +
        '<span class="row-body"><b>' + esc(nf.name) + '</b><small>' + nf._days + ' दिन बाद · ' + esc(fmtDate(nf._d)) + '</small></span></button>';
    }
    var rem = Store.getReminders();
    if (!rem) {
      h += '<button class="nudge" data-go="reminders">🔔 रोज़ का भक्ति रिमाइंडर लगाएँ — बिना याद रखे भक्ति</button>';
    }

    h += '</div>';
    content.innerHTML = h;
    content.scrollTop = 0;
  }
  function tile(ico, label, route, color) {
    return '<button class="tile" data-go="' + route + '" style="--c:' + color + '">' +
      '<span class="tile-ico">' + ico + '</span><span>' + esc(label) + '</span></button>';
  }
  function miniCard(it) {
    return '<button class="mini" data-open="' + esc(it.id) + '" style="--accent:' + it.accent + '">' +
      '<span class="mini-ico">' + it.icon + '</span><span class="mini-title">' + esc(it.title) + '</span>' +
      '<span class="mini-type">' + esc(TYPE_LABEL[it.type] || "") + '</span></button>';
  }
  function fmtDate(d) { return d.getDate() + " " + HIN_MONTHS_F[d.getMonth()]; }

  // ================= LIBRARY =================
  function viewLibrary(type) {
    setNavActive("lib");
    setHeader({ title: "पुस्तकालय", back: false });
    var types = ["chalisa", "aarti", "mantra"];
    var h = '<div class="screen"><div class="segbar">';
    each(types, function (tp) {
      h += '<button class="seg' + (tp === type ? " on" : "") + '" data-go="lib/' + tp + '">' + esc(TYPE_LABEL[tp]) + '</button>';
    });
    h += '</div>';
    var list = readyItems(type);
    h += '<div class="list">';
    each(list, function (it) {
      var soon = it.status !== "ready";
      h += '<button class="list-card' + (soon ? " soon" : "") + '" ' + (soon ? 'data-soon="1"' : 'data-open="' + esc(it.id) + '"') +
        ' style="--accent:' + it.accent + '">' +
        '<span class="lc-ico">' + it.icon + '</span>' +
        '<span class="lc-body"><b>' + esc(it.title) + '</b><small>' + esc(DATA.deities[it.deity] ? DATA.deities[it.deity].name : (it.subtitle || "")) + '</small></span>' +
        (soon ? '<span class="badge">जल्द</span>' : (Store.isFav(it.id) ? '<span class="chev fav">★</span>' : '<span class="chev">›</span>')) +
        '</button>';
    });
    h += '</div></div>';
    content.innerHTML = h;
    content.scrollTop = 0;
    Analytics.track("library_open", { type: type });
  }

  // ================= READER =================
  var _scrollHandler = null;
  function viewReader(id, isToday) {
    var it = item(id);
    if (!it) { go("home"); return; }
    navEl.hidden = true;
    if (it.status !== "ready") return viewComingSoon(it);

    Store.pushRecent(it.id);
    Store.setLastRead(it.id, 0);
    var fav = Store.isFav(it.id);
    var s = Store.getSettings();

    setHeader({
      title: it.title, back: true,
      actions:
        '<button class="icon-btn" data-act="fontdec" aria-label="छोटा">A−</button>' +
        '<button class="icon-btn" data-act="fontinc" aria-label="बड़ा">A+</button>' +
        '<button class="icon-btn" data-act="focus" aria-label="फोकस">⤢</button>'
    });
    document.body.classList.add("reading");

    var h = '<div class="screen reader" id="readerScreen">' +
      '<div class="read-progress"><i id="readBar"></i></div>' +
      '<h1 class="read-title" style="color:' + it.accent + '">' + esc(it.title) + '</h1>' +
      (it.subtitle ? '<div class="read-sub">' + esc(it.subtitle) + '</div>' : '') +
      '<div class="read-text">' + esc(it.text) + '</div>' +
      (it.meaning ? '<div class="read-meaning"><b>अर्थ:</b> ' + esc(it.meaning) + '</div>' : '') +
      '<div class="read-actions">' +
        '<button class="pill ' + (fav ? "on" : "") + '" data-act="fav" data-id="' + esc(it.id) + '">' + (fav ? "★ पसंदीदा" : "☆ पसंद करें") + '</button>' +
        '<button class="pill" data-act="share" data-id="' + esc(it.id) + '">↗ शेयर</button>' +
        '<button class="pill" data-act="sharecard" data-id="' + esc(it.id) + '">🖼️ कार्ड</button>' +
      '</div>' +
      '<div class="read-done" id="readDone"></div>' +
      '</div>';
    content.innerHTML = h;
    content.scrollTop = 0;
    updateDoneBtn();

    // progress + last-read + streak-on-scroll
    var bar = $("#readBar");
    if (_scrollHandler) content.removeEventListener("scroll", _scrollHandler);
    _scrollHandler = function () {
      var max = content.scrollHeight - content.clientHeight;
      var frac = max > 0 ? content.scrollTop / max : 0;
      if (bar) bar.style.width = Math.round(frac * 100) + "%";
      Store.setLastRead(it.id, frac);
      if (frac > 0.6) doMarkDone(it, true);
    };
    content.addEventListener("scroll", _scrollHandler);

    Analytics.track("devotional_open", { id: it.id, type: it.type });
    Analytics.track(it.type + "_open", { id: it.id });
    window._curItem = it;
  }

  function updateDoneBtn() {
    var el = $("#readDone"); if (!el) return;
    var st = Store.getStreak();
    if (st.todayDone) {
      el.innerHTML = '<div class="done-badge">🙏 आज की भक्ति पूरी हुई · 🔥 ' + st.count + ' दिन</div>';
    } else {
      el.innerHTML = '<button class="done-btn" data-act="markdone">✓ आज की भक्ति पूरी करें</button>';
    }
  }
  function doMarkDone(it, silent) {
    var st = Store.getStreak();
    if (st.todayDone) { updateDoneBtn(); return; }
    var r = Store.markToday();
    Analytics.track("reminder_completed", { id: it ? it.id : null, streak: r.count });
    updateDoneBtn();
    if (r.milestone) showMilestone(r.milestone);
    else if (!silent) toast("🙏 आज की भक्ति पूरी — 🔥 " + r.count + " दिन");
  }

  function viewComingSoon(it) {
    setHeader({ title: it.title, back: true });
    content.innerHTML = '<div class="screen"><div class="empty">' +
      '<div class="empty-ico" style="color:' + it.accent + '">' + it.icon + '</div>' +
      '<h2>' + esc(it.title) + '</h2>' +
      '<p>इसका सत्यापित (verified) पाठ जल्द जोड़ा जाएगा।<br>हम केवल शुद्ध व प्रामाणिक पाठ ही देते हैं।</p>' +
      '<button class="pill" data-go="lib/' + it.type + '">‹ वापस ' + esc(TYPE_LABEL[it.type]) + '</button>' +
      '</div></div>';
    content.scrollTop = 0;
  }

  // ================= SEARCH =================
  function viewSearch() {
    setNavActive("search");
    setHeader({ title: "खोज", back: false });
    content.innerHTML = '<div class="screen">' +
      '<div class="searchbar"><input id="searchInput" type="text" placeholder="चालीसा, आरती, मंत्र खोजें…" autocomplete="off"></div>' +
      '<div id="searchResults"></div></div>';
    var inp = $("#searchInput");
    inp.addEventListener("input", function () { runSearch(inp.value); });
    runSearch("");
    setTimeout(function () { try { inp.focus(); } catch (e) {} }, 100);
  }
  function runSearch(q) {
    q = (q || "").toLowerCase().trim();
    var res = [];
    each(DATA.items, function (it) {
      var hay = (it.title + " " + (it.subtitle || "") + " " + (it.keywords || []).join(" ")).toLowerCase();
      if (!q || hay.indexOf(q) !== -1) res.push(it);
    });
    var box = $("#searchResults");
    if (!res.length) { box.innerHTML = '<div class="empty small"><div class="empty-ico">🔍</div><p>कुछ नहीं मिला।</p></div>'; return; }
    var h = '<div class="list">';
    each(res, function (it) {
      var soon = it.status !== "ready";
      h += '<button class="list-card' + (soon ? " soon" : "") + '" ' + (soon ? 'data-soon="1"' : 'data-open="' + esc(it.id) + '"') + ' style="--accent:' + it.accent + '">' +
        '<span class="lc-ico">' + it.icon + '</span>' +
        '<span class="lc-body"><b>' + esc(it.title) + '</b><small>' + esc(TYPE_LABEL[it.type]) + (soon ? ' · जल्द' : '') + '</small></span>' +
        '<span class="chev">' + (soon ? '' : '›') + '</span></button>';
    });
    h += '</div>';
    box.innerHTML = h;
  }

  // ================= FAVORITES =================
  function viewFavorites() {
    setNavActive("home");
    setHeader({ title: "पसंदीदा", back: true });
    var favs = Store.getFavs();
    if (!favs.length) {
      content.innerHTML = '<div class="screen"><div class="empty"><div class="empty-ico">☆</div>' +
        '<h2>अभी कोई पसंदीदा नहीं</h2><p>कोई पाठ खोलकर ☆ दबाएँ — यहाँ जुड़ जाएगा।</p>' +
        '<button class="pill" data-go="lib/chalisa">पुस्तकालय खोलें</button></div></div>';
      return;
    }
    var h = '<div class="screen"><div class="list">';
    each(favs, function (id) {
      var it = item(id); if (!it) return;
      h += '<button class="list-card" data-open="' + esc(it.id) + '" style="--accent:' + it.accent + '">' +
        '<span class="lc-ico">' + it.icon + '</span>' +
        '<span class="lc-body"><b>' + esc(it.title) + '</b><small>' + esc(TYPE_LABEL[it.type]) + '</small></span>' +
        '<span class="chev fav">★</span></button>';
    });
    h += '</div></div>';
    content.innerHTML = h;
  }

  // ================= STREAK =================
  function viewStreak() {
    setNavActive("home");
    setHeader({ title: "भक्ति स्ट्रीक", back: true });
    var st = Store.getStreak(), next = Store.nextMilestone(st.count || 0);
    var h = '<div class="screen"><div class="streak-hero">' +
      '<div class="streak-flame">🔥</div>' +
      '<div class="streak-num">' + (st.count || 0) + '</div>' +
      '<div class="streak-cap">दिन लगातार भक्ति</div>' +
      '<div class="streak-sub">' + (st.todayDone ? "🙏 आज पूरा हुआ" : "आज बाकी है — कोई पाठ पढ़ें") + '</div>' +
      '<div class="streak-best">सर्वश्रेष्ठ: ' + (st.best || 0) + ' दिन</div></div>';
    h += '<div class="sec-label">मील के पत्थर</div><div class="miles">';
    each(Store.milestones, function (m) {
      var done = (st.best || 0) >= m;
      h += '<div class="mile' + (done ? " done" : "") + '"><span>' + (done ? "✓" : m) + '</span><small>' + m + ' दिन</small></div>';
    });
    h += '</div>';
    if (next) h += '<p class="muted center">अगला लक्ष्य: <b>' + next + ' दिन</b> — बस ' + (next - (st.count || 0)) + ' दिन और 🙏</p>';
    h += '<button class="cta-btn" data-open="' + esc(todaysItem().id) + '">आज की भक्ति करें</button>';
    h += '</div>';
    content.innerHTML = h;
  }

  // ================= REMINDERS =================
  var DEFAULT_REMINDERS = [
    { id: "morning", enabled: true, hour: 7, minute: 0, title: "🙏 शुभ प्रभात — आज की भक्ति शुरू करें", target: "today" },
    { id: "hanuman", enabled: false, hour: 8, minute: 0, title: "🚩 जय श्री राम — Hanuman Chalisa का समय", target: "read/hanuman-chalisa" },
    { id: "evening", enabled: false, hour: 18, minute: 30, title: "🪔 संध्या भक्ति — आज की आरती पढ़ें", target: "lib/aarti" }
  ];
  var REM_LABEL = { morning: "प्रातः भक्ति", hanuman: "हनुमान चालीसा", evening: "संध्या भक्ति", custom: "कस्टम रिमाइंडर" };
  function loadReminders() {
    var r = Bridge.getReminders() || Store.getReminders();
    if (!r || !r.length) r = DEFAULT_REMINDERS.slice();
    return r;
  }
  function saveReminders(r) { Store.setReminders(r); Bridge.setReminders(r); }
  function viewReminders() {
    setNavActive("home");
    setHeader({ title: "रिमाइंडर", back: true });
    var r = loadReminders();
    var perm = Bridge.hasNotificationPermission();
    var h = '<div class="screen">';
    if (!perm) h += '<div class="warn">🔔 नोटिफिकेशन की अनुमति चाहिए। <button class="link" data-act="reqperm">अनुमति दें</button></div>';
    h += '<p class="muted">रोज़ इसी समय भक्ति का स्मरण — बिना याद रखे। ज़रूरत हो उतने ही चालू रखें।</p><div class="list">';
    each(r, function (rem) {
      h += '<div class="rem-card">' +
        '<div class="rem-top"><b>' + esc(REM_LABEL[rem.id] || "रिमाइंडर") + '</b>' +
        '<label class="switch"><input type="checkbox" data-act="rem-toggle" data-rid="' + rem.id + '"' + (rem.enabled ? " checked" : "") + '><span></span></label></div>' +
        '<div class="rem-time"><input type="time" data-act="rem-time" data-rid="' + rem.id + '" value="' + pad(rem.hour) + ':' + pad(rem.minute) + '"></div>' +
        '<div class="rem-msg">' + esc(rem.title) + '</div>' +
        '</div>';
    });
    h += '</div><p class="muted small">⚠️ कुछ फोन (Xiaomi/Oppo/Vivo) बैटरी सेविंग में नोटिफिकेशन रोक देते हैं — तो app को "Autostart / बैटरी: No restriction" दें।</p></div>';
    content.innerHTML = h;
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  // ================= SETTINGS =================
  function viewSettings() {
    setNavActive("settings");
    setHeader({ title: "सेटिंग", back: false });
    var s = Store.getSettings(), prem = Store.isPremium();
    var h = '<div class="screen"><div class="settings">';
    h += group("दिखावट",
      rowSelect("थीम", "theme", s.theme, [["system", "फोन जैसा"], ["light", "उजाला"], ["dark", "अँधेरा"]]) +
      '<div class="set-row"><span>अक्षर आकार</span><div class="fontctl">' +
        '<button class="icon-btn" data-act="fontdec">A−</button><b>' + Math.round(s.fontScale * 100) + '%</b>' +
        '<button class="icon-btn" data-act="fontinc">A+</button></div></div>'
    );
    h += group("भक्ति",
      link("🔔 रिमाइंडर सेट करें", "reminders") +
      link("🔥 भक्ति स्ट्रीक", "streak") +
      link("★ पसंदीदा", "favs")
    );
    h += group("मोनेटाइज़ेशन",
      '<div class="set-row"><span>विज्ञापन हटाएँ (Premium)</span>' +
      (prem ? '<span class="badge on">सक्रिय</span>' : '<button class="pill sm" data-act="premium">देखें</button>') + '</div>'
    );
    h += group("प्राइवेसी",
      '<div class="set-row"><span>गुमनाम एनालिटिक्स</span>' +
      '<label class="switch"><input type="checkbox" data-act="analytics"' + (s.analytics !== false ? " checked" : "") + '><span></span></label></div>' +
      '<p class="muted small">कोई व्यक्तिगत जानकारी एकत्र नहीं होती।</p>'
    );
    h += group("ऐप", link("↗ ऐप शेयर करें", null, "shareapp") + '<div class="set-row muted"><span>Bhakti Daily</span><span>v2.0</span></div>');
    h += '</div></div>';
    content.innerHTML = h;
  }
  function group(title, inner) { return '<div class="sec-label">' + esc(title) + '</div><div class="card-group">' + inner + '</div>'; }
  function link(label, route, act) {
    return '<button class="set-row link-row" ' + (route ? 'data-go="' + route + '"' : 'data-act="' + act + '"') + '><span>' + esc(label) + '</span><span class="chev">›</span></button>';
  }
  function rowSelect(label, key, val, opts) {
    var h = '<div class="set-row"><span>' + esc(label) + '</span><div class="chips">';
    each(opts, function (o) { h += '<button class="chip' + (o[0] === val ? " on" : "") + '" data-act="theme" data-val="' + o[0] + '">' + esc(o[1]) + '</button>'; });
    return h + '</div></div>';
  }

  // ================= premium =================
  function showPremium() {
    modal('<div class="modal-card"><div class="m-ico">🚫📢</div><h2>विज्ञापन हटाएँ</h2>' +
      '<p>Premium se saare ads hat jaate hain aur aap bhakti bina rukavat karte hain.</p>' +
      '<p class="muted small">Note: In-app purchase (Google Play Billing) tab chalu hoga jab app Play Store par publish + billing set up hoga. Abhi ye architecture ready hai — nakli purchase nahi kiya jaata.</p>' +
      '<button class="cta-btn" data-act="close-modal">ठीक है</button></div>');
    Analytics.track("premium_clicked", {});
  }

  // ================= events (delegation) =================
  document.addEventListener("click", function (e) {
    var t = e.target;
    while (t && t !== document) {
      if (t.getAttribute) {
        var go_ = t.getAttribute("data-go");
        var open = t.getAttribute("data-open");
        var act = t.getAttribute("data-act");
        if (t.getAttribute("data-soon")) { toast("यह पाठ जल्द जोड़ा जाएगा 🙏"); return; }
        if (go_ != null) { go(go_); return; }
        if (open != null) { openReader(open); return; }
        if (act) { handleAct(act, t); return; }
      }
      t = t.parentNode;
    }
  });
  navEl && navEl.addEventListener("click", function () {}); // nav uses data-go

  var _readCount = 0;
  function openReader(id) {
    var it = item(id);
    if (it && it.status === "ready") { _readCount++; }
    go("read/" + id);
  }

  function handleAct(act, el) {
    var s;
    if (act === "fontinc" || act === "fontdec") {
      s = Store.getSettings();
      var f = s.fontScale + (act === "fontinc" ? 0.1 : -0.1);
      f = Math.max(0.8, Math.min(1.8, Math.round(f * 10) / 10));
      Store.setSettings({ fontScale: f }); applyAppearance();
      if (parseRoute().name === "settings") viewSettings();
      return;
    }
    if (act === "focus") { window._focus = !window._focus; document.body.classList.toggle("focus-mode", window._focus); Bridge.setAdsEnabled(!window._focus && !Store.isPremium()); return; }
    if (act === "fav") { var added = Store.toggleFav(el.getAttribute("data-id")); el.className = "pill" + (added ? " on" : ""); el.innerHTML = added ? "★ पसंदीदा" : "☆ पसंद करें"; Analytics.track("favorite_added", { id: el.getAttribute("data-id"), added: added }); if (added) toast("★ पसंदीदा में जोड़ा"); return; }
    if (act === "share") { var it = item(el.getAttribute("data-id")); shareItemText(it); return; }
    if (act === "sharecard") { var it2 = item(el.getAttribute("data-id")); try { ShareCard.shareItem(it2); Analytics.track("share_clicked", { id: it2.id, kind: "card" }); toast("कार्ड बन रहा है…"); } catch (e) { toast("कार्ड नहीं बन पाया"); } return; }
    if (act === "markdone") { doMarkDone(window._curItem, false); return; }
    if (act === "theme") { Store.setSettings({ theme: el.getAttribute("data-val") }); applyAppearance(); viewSettings(); return; }
    if (act === "analytics") { Store.setSettings({ analytics: el.checked }); return; }
    if (act === "premium") { showPremium(); return; }
    if (act === "close-modal") { closeModal(); return; }
    if (act === "shareapp") { Bridge.shareText("🚩 Bhakti Daily — रोज़ की भक्ति: Hanuman Chalisa, Aarti, Mantra, रिमाइंडर व स्ट्रीक। ज़रूर आज़माएँ 🙏"); Analytics.track("share_clicked", { kind: "app" }); return; }
    if (act === "reqperm") { Bridge.requestNotificationPermission(); toast("अनुमति माँगी जा रही है…"); return; }
    if (act === "rem-toggle") {
      var r = loadReminders(), rid = el.getAttribute("data-rid");
      each(r, function (rem) { if (rem.id === rid) rem.enabled = el.checked; });
      if (el.checked && !Bridge.hasNotificationPermission()) Bridge.requestNotificationPermission();
      saveReminders(r); Analytics.track("reminder_enabled", { id: rid, on: el.checked });
      toast(el.checked ? "रिमाइंडर चालू ✓" : "रिमाइंडर बंद");
      return;
    }
    if (act === "rem-time") {
      var r2 = loadReminders(), rid2 = el.getAttribute("data-rid"), parts = el.value.split(":");
      each(r2, function (rem) { if (rem.id === rid2) { rem.hour = +parts[0]; rem.minute = +parts[1]; } });
      saveReminders(r2); toast("समय सेट ✓");
      return;
    }
  }

  function shareItemText(it) {
    if (!it) return;
    var snippet = (it.text || "").split("\n").slice(0, 4).join("\n");
    Bridge.shareText(it.title + "\n\n" + snippet + "\n\n🚩 Bhakti Daily se");
    Analytics.track("share_clicked", { id: it.id, kind: "text" });
  }

  // ================= toast / modal =================
  var _toastT;
  function toast(msg) {
    var el = $("#toast");
    if (!el) { el = document.createElement("div"); el.id = "toast"; document.body.appendChild(el); }
    el.textContent = msg; el.className = "show";
    clearTimeout(_toastT); _toastT = setTimeout(function () { el.className = ""; }, 2200);
  }
  function modal(html) {
    var m = document.createElement("div"); m.className = "modal-bg"; m.id = "modalBg";
    m.innerHTML = html;
    m.addEventListener("click", function (e) { if (e.target === m) closeModal(); });
    document.body.appendChild(m);
  }
  function closeModal() { var m = $("#modalBg"); if (m) m.parentNode.removeChild(m); }
  function showMilestone(m) {
    modal('<div class="modal-card celebrate"><div class="m-ico">🎉</div>' +
      '<h2>' + m + ' दिन की भक्ति!</h2>' +
      '<p>आपने लगातार ' + m + ' दिन भक्ति की 🙏<br>ईश्वर आपका कल्याण करें।</p>' +
      '<button class="cta-btn" data-act="close-modal">जय हो 🚩</button></div>');
    Analytics.track("milestone_reached", { days: m });
  }

  // ================= boot =================
  function boot() {
    applyAppearance();
    // ads off if premium; on otherwise (never shown on launch by native)
    Bridge.setAdsEnabled(!Store.isPremium());
    // sync default reminders into native on first run
    if (!Store.getReminders() && Bridge.isNative() && !Bridge.getReminders()) {
      // don't auto-enable; just leave defaults for user to turn on
    }
    // deep link from notification (native) overrides hash
    var initial = Bridge.getInitialRoute();
    if (initial) location.hash = "#/" + initial.replace(/^#?\/?/, "");
    Analytics.track("app_open", { native: Bridge.isNative() });
    window.addEventListener("hashchange", render);
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
