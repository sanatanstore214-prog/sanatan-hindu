(function () {
  "use strict";

  // Purane WebView me NodeList.forEach nahi hota — isliye apna loop helper.
  function each(list, fn) {
    if (!list) return;
    for (var i = 0; i < list.length; i++) fn(list[i], i);
  }

  try {
    start();
  } catch (e) {
    // White screen ki jagah error dikhao (debug me kaam aata hai)
    var c = document.getElementById("content");
    if (c) {
      c.innerHTML = '<div style="padding:30px;text-align:center;color:#7B241C">' +
        '<h2>🚩 सनातन हिन्दू</h2><p>Kuch gadbad ho gayi.</p>' +
        '<p style="font-size:12px;color:#999">' + String(e && e.message) + '</p></div>';
    }
  }

  function start() {
    var DATA = window.SANATAN_DATA || { thoughts: [], paath: [], mantra: [], festivals: [] };

    var HIN_MONTHS = ["जन", "फर", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अग", "सित", "अक्तू", "नव", "दिस"];
    var HIN_MONTHS_FULL = ["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितम्बर", "अक्टूबर", "नवम्बर", "दिसम्बर"];
    var HIN_DAYS = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];

    var content = document.getElementById("content");
    var headerTitle = document.getElementById("headerTitle");
    var backBtn = document.getElementById("backBtn");
    var navBtns = document.querySelectorAll(".nav-btn");

    var currentTab = "home";
    var supportsPush = typeof history !== "undefined" && typeof history.pushState === "function";

    function notifyNavigate() {
      try {
        if (window.Android && typeof window.Android.onNavigate === "function") {
          window.Android.onNavigate();
        }
      } catch (e) {}
    }

    function el(html) {
      var d = document.createElement("div");
      d.innerHTML = html.replace(/^\s+|\s+$/g, "");
      return d.firstChild;
    }

    function esc(s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
      });
    }

    // ---------------- HOME ----------------
    function renderHome() {
      var now = new Date();
      var dateStr = HIN_DAYS[now.getDay()] + ", " + now.getDate() + " " + HIN_MONTHS_FULL[now.getMonth()] + " " + now.getFullYear();
      var thought = DATA.thoughts.length ? DATA.thoughts[now.getDate() % DATA.thoughts.length] : "";
      var next = nextFestival();

      var html = '<div class="fade">';
      html += '<div class="hero">' +
        '<div class="om">ॐ</div>' +
        '<div style="font-size:18px;font-weight:700">श्री गणेशाय नमः</div>' +
        '<div class="date">' + esc(dateStr) + '</div>' +
        '<div class="thought">“' + esc(thought) + '”</div>' +
        '</div>';

      if (next) {
        html += '<div class="section-title">अगला त्योहार</div>';
        html += '<div class="card tap" data-go="calendar">' +
          '<span class="card-ico">📅</span>' +
          '<div class="card-body"><h3>' + esc(next.name) + '</h3>' +
          '<p>' + esc(formatFull(next._d)) + (next._days === 0 ? " · आज" : " · " + next._days + " दिन बाद") + '</p></div>' +
          '<span class="chev">›</span></div>';
      }

      html += '<div class="section-title">रोज़ का पाठ</div>';
      html += quickCard("📿", "आरती व चालीसा", "हनुमान चालीसा, गणेश-शिव आरती…", "paath");
      html += quickCard("🕉️", "मंत्र संग्रह", "गायत्री, महामृत्युंजय व अन्य", "mantra");
      html += quickCard("📅", "व्रत व त्योहार 2026", "पूरे साल का कैलेंडर", "calendar");
      html += "</div>";

      content.innerHTML = "";
      content.appendChild(el(html));
      bindGoCards();
    }

    function quickCard(ico, title, sub, go) {
      return '<div class="card tap" data-go="' + go + '">' +
        '<span class="card-ico">' + ico + '</span>' +
        '<div class="card-body"><h3>' + esc(title) + '</h3><p>' + esc(sub) + '</p></div>' +
        '<span class="chev">›</span></div>';
    }

    function bindGoCards() {
      each(content.querySelectorAll("[data-go]"), function (c) {
        c.addEventListener("click", function () { switchTab(c.getAttribute("data-go")); });
      });
    }

    // ---------------- LIST (paath / mantra) ----------------
    function renderList(type) {
      var items = DATA[type] || [];
      var html = '<div class="fade">';
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        html += '<div class="card tap" data-type="' + type + '" data-idx="' + i + '">' +
          '<span class="card-ico">' + (it.icon || (type === "mantra" ? "🕉️" : "📖")) + '</span>' +
          '<div class="card-body"><h3>' + esc(it.title) + '</h3>' +
          (it.subtitle ? '<p>' + esc(it.subtitle) + '</p>' : '') + '</div>' +
          '<span class="chev">›</span></div>';
      }
      html += "</div>";
      content.innerHTML = "";
      content.appendChild(el(html));
      each(content.querySelectorAll("[data-idx]"), function (c) {
        c.addEventListener("click", function () {
          openDetail(c.getAttribute("data-type"), parseInt(c.getAttribute("data-idx"), 10));
        });
      });
    }

    // ---------------- DETAIL ----------------
    function openDetail(type, idx) {
      var it = (DATA[type] || [])[idx];
      if (!it) return;
      notifyNavigate();

      var html = '<div class="fade">' +
        '<h2 class="reader-title">' + esc(it.title) + '</h2>' +
        (it.subtitle ? '<div class="reader-sub">' + esc(it.subtitle) + '</div>' : '') +
        '<div class="reader-text">' + esc(it.text) + '</div>';
      if (it.meaning) {
        html += '<div class="reader-meaning"><b>अर्थ:</b> ' + esc(it.meaning) + '</div>';
      }
      html += '</div>';

      content.innerHTML = "";
      content.appendChild(el(html));
      content.scrollTop = 0;
      document.body.className = "detail";
      headerTitle.textContent = it.title;
      if (supportsPush) {
        try { history.pushState({ detail: true, tab: currentTab }, ""); } catch (e) {}
      }
    }

    function closeDetail() {
      document.body.className = "";
      showTab(currentTab, false);
    }

    // ---------------- CALENDAR ----------------
    function parseDate(s) {
      var p = s.split("-");
      return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    }
    function startOfToday() {
      var n = new Date();
      return new Date(n.getFullYear(), n.getMonth(), n.getDate());
    }
    function formatFull(d) {
      return d.getDate() + " " + HIN_MONTHS_FULL[d.getMonth()] + " " + d.getFullYear();
    }
    function nextFestival() {
      var today = startOfToday();
      var best = null;
      var fests = DATA.festivals || [];
      for (var i = 0; i < fests.length; i++) {
        var d = parseDate(fests[i].date);
        if (d >= today && (!best || d < best._d)) {
          best = { name: fests[i].name, note: fests[i].note, _d: d };
        }
      }
      if (best) best._days = Math.round((best._d - today) / 86400000);
      return best;
    }

    function renderCalendar() {
      var today = startOfToday();
      var next = nextFestival();
      var nextTime = next ? next._d.getTime() : -1;
      var fests = DATA.festivals || [];

      var html = '<div class="fade">';
      html += '<div class="section-title">व्रत व त्योहार 2026</div>';
      for (var i = 0; i < fests.length; i++) {
        var f = fests[i];
        var d = parseDate(f.date);
        var past = d < today;
        var isNext = d.getTime() === nextTime;
        html += '<div class="fest-row ' + (past ? "past" : "") + (isNext ? " next" : "") + '">' +
          '<div class="fest-date"><div class="d">' + d.getDate() + '</div>' +
          '<div class="m">' + HIN_MONTHS[d.getMonth()] + '</div></div>' +
          '<div class="fest-info"><h3>' + esc(f.name) + '</h3>' +
          '<p>' + esc(HIN_DAYS[d.getDay()]) + (f.note ? " · " + esc(f.note) : "") + '</p></div>' +
          (isNext ? '<span class="badge-next">अगला</span>' : '') +
          '</div>';
      }
      html += '<p class="disclaimer">⚠️ तिथि के अनुसार तारीख़ 1-2 दिन आगे-पीछे हो सकती है। अपने स्थानीय पंचांग से पुष्टि करें।</p>';
      html += "</div>";
      content.innerHTML = "";
      content.appendChild(el(html));
    }

    // ---------------- TAB SWITCH ----------------
    function showTab(tab, notify) {
      currentTab = tab;
      each(navBtns, function (b) {
        if (b.getAttribute("data-view") === tab) b.className = "nav-btn active";
        else b.className = "nav-btn";
      });
      headerTitle.textContent =
        tab === "home" ? "🚩 सनातन हिन्दू" :
        tab === "paath" ? "📿 आरती व चालीसा" :
        tab === "mantra" ? "🕉️ मंत्र संग्रह" : "📅 व्रत व त्योहार";

      if (tab === "home") renderHome();
      else if (tab === "paath") renderList("paath");
      else if (tab === "mantra") renderList("mantra");
      else if (tab === "calendar") renderCalendar();

      content.scrollTop = 0;
      if (notify) notifyNavigate();
    }

    function switchTab(tab) {
      if (document.body.className.indexOf("detail") !== -1) {
        document.body.className = "";
        if (supportsPush) { try { history.back(); } catch (e) {} }
      }
      showTab(tab, true);
    }

    // ---------------- EVENTS ----------------
    each(navBtns, function (b) {
      b.addEventListener("click", function () { switchTab(b.getAttribute("data-view")); });
    });
    backBtn.addEventListener("click", function () {
      if (supportsPush) { try { history.back(); } catch (e) {} }
      closeDetail();
    });

    window.addEventListener("popstate", function () {
      if (document.body.className.indexOf("detail") !== -1) closeDetail();
    });

    // Start
    showTab("home", false);
  }
})();
