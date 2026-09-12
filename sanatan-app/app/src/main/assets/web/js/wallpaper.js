/* Bhakti Daily — devotional wallpaper generator (100% app-drawn, no copyrighted art).
 * Gradient + mandala rings + symbol + Devanagari + subtle branding. 1080x1920. */
(function () {
  "use strict";

  var THEMES = [
    { key: "om", title: "ॐ", symbol: "ॐ", accent: "#E8590C", sub: "श्री गणेशाय नमः" },
    { key: "hanuman", title: "हनुमान जी", symbol: "🚩", accent: "#E8590C", sub: "जय बजरंगबली" },
    { key: "shiv", title: "शिव जी", symbol: "🔱", accent: "#5C6BC0", sub: "ॐ नमः शिवाय" },
    { key: "ganesh", title: "गणेश जी", symbol: "🕉️", accent: "#F57C00", sub: "गणपति बप्पा मोरया" },
    { key: "krishna", title: "श्री कृष्ण", symbol: "🦚", accent: "#1565C0", sub: "हरे कृष्ण" },
    { key: "ram", title: "श्री राम", symbol: "🏹", accent: "#2E7D32", sub: "जय श्री राम" },
    { key: "durga", title: "दुर्गा माँ", symbol: "🌺", accent: "#C2185B", sub: "जय माता दी" },
    { key: "lakshmi", title: "लक्ष्मी माँ", symbol: "🪔", accent: "#C9A227", sub: "शुभ लाभ" }
  ];

  function darken(hex, f) {
    hex = hex.replace("#", "");
    var r = parseInt(hex.substr(0, 2), 16), g = parseInt(hex.substr(2, 2), 16), b = parseInt(hex.substr(4, 2), 16);
    return "rgb(" + Math.round(r * f) + "," + Math.round(g * f) + "," + Math.round(b * f) + ")";
  }

  function build(theme) {
    var W = 1080, H = 1920;
    var c = document.createElement("canvas"); c.width = W; c.height = H;
    var ctx = c.getContext("2d");
    var A = theme.accent;

    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, darken(A, 0.5)); g.addColorStop(0.5, A); g.addColorStop(1, darken(A, 0.4));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // mandala rings
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    var cx = W / 2, cy = H * 0.42;
    for (var r = 120; r < 620; r += 70) { ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); }
    // petals
    ctx.save(); ctx.translate(cx, cy);
    for (var p = 0; p < 16; p++) {
      ctx.rotate(Math.PI / 8);
      ctx.beginPath(); ctx.ellipse(0, 300, 40, 130, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.fill();
    }
    ctx.restore();

    // symbol
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 30;
    ctx.font = "300px 'Noto Sans Devanagari', serif";
    ctx.fillText(theme.symbol, cx, cy);
    ctx.shadowBlur = 0;

    // title + sub
    ctx.font = "700 78px 'Noto Sans Devanagari', sans-serif";
    ctx.fillText(theme.title, cx, H * 0.72);
    ctx.font = "400 46px 'Noto Sans Devanagari', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(theme.sub, cx, H * 0.77);

    // date strip
    var now = new Date();
    var days = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
    ctx.font = "400 38px 'Noto Sans Devanagari', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(days[now.getDay()] + " · " + now.getDate() + "/" + (now.getMonth() + 1), cx, H * 0.09);

    // branding
    ctx.font = "700 40px 'Noto Sans Devanagari', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText("🚩 Bhakti Daily", cx, H * 0.95);

    return c.toDataURL("image/png");
  }

  function todayTheme() {
    var w = window.BHAKTI_DATA && window.BHAKTI_DATA.weekday[String(new Date().getDay())];
    var key = w ? w.deity : "om";
    for (var i = 0; i < THEMES.length; i++) if (THEMES[i].key === key) return THEMES[i];
    return THEMES[0];
  }

  window.Wallpaper = { themes: THEMES, build: build, todayTheme: todayTheme };
})();
