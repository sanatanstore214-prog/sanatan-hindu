/* Bhakti Daily — daily blessing image (WhatsApp share loop, 100% app-drawn).
 * "शुभ प्रभात + भगवान + पंचांग + नाम" card. Festival din par festival greeting.
 * No copyrighted art; general shubhkamna text only (no fabricated scripture). */
(function () {
  "use strict";
  var D = window.BHAKTI_DATA || { weekday: {}, deities: {}, festivals: [], thoughts: [] };
  var DAYS = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
  var MON = ["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितम्बर", "अक्टूबर", "नवम्बर", "दिसम्बर"];

  var SYMBOL = { hanuman: "🚩", shiv: "🔱", ganesh: "🕉️", krishna: "🦚", ram: "🏹", durga: "🌺", lakshmi: "🪔", vishnu: "🌸", saraswati: "📖", surya: "🌅", devi: "🌺" };
  var MORNING = ["आपका दिन मंगलमय हो 🙏", "आज का दिन शुभ व सफल हो", "ईश्वर आपको सुख-समृद्धि दें", "हर सुबह नई ऊर्जा, नई भक्ति", "प्रभु आपकी हर मनोकामना पूर्ण करें"];
  var EVENING = ["आपकी संध्या शुभ हो 🪔", "प्रभु के नाम में मन को शांति मिले", "आज का दिन कृतज्ञता के साथ पूर्ण हो", "ईश्वर आपके परिवार की रक्षा करें"];

  function darken(hex, f) { hex = hex.replace("#", ""); var r = parseInt(hex.substr(0, 2), 16), g = parseInt(hex.substr(2, 2), 16), b = parseInt(hex.substr(4, 2), 16); return "rgb(" + Math.round(r * f) + "," + Math.round(g * f) + "," + Math.round(b * f) + ")"; }
  function twoStr(d) { var m = d.getMonth() + 1, day = d.getDate(); return d.getFullYear() + "-" + (m < 10 ? "0" + m : m) + "-" + (day < 10 ? "0" + day : day); }
  function wrap(ctx, text, maxW) { var w = text.split(/\s+/), lines = [], line = ""; for (var i = 0; i < w.length; i++) { var t = line ? line + " " + w[i] : w[i]; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w[i]; } else line = t; } if (line) lines.push(line); return lines; }

  function todayFestival(now) {
    var ts = twoStr(now);
    for (var i = 0; i < D.festivals.length; i++) if (D.festivals[i].date === ts) return D.festivals[i];
    return null;
  }

  // context: what today's card should say
  function context(now) {
    now = now || new Date();
    var fest = todayFestival(now);
    var w = D.weekday[String(now.getDay())] || {};
    var deity = fest ? fest.deity : w.deity || "surya";
    var accent = (fest && fest.accent) || (D.deities[deity] || {}).accent || "#E8590C";
    var h = now.getHours();
    var greet = h < 12 ? "शुभ प्रभात" : (h < 17 ? "शुभ दिन" : "शुभ संध्या");
    var pool = h < 15 ? MORNING : EVENING;
    var blessing = fest ? (fest.greeting || (fest.name + " की शुभकामनाएँ!")) : pool[now.getDate() % pool.length];
    var quote = fest ? "" : (D.thoughts.length ? D.thoughts[now.getDate() % D.thoughts.length] : "");
    var title = fest ? fest.name : ((D.deities[deity] || {}).name || "");
    return { fest: fest, deity: deity, accent: accent, greet: greet, blessing: blessing, quote: quote, title: title, symbol: SYMBOL[deity] || "🕉️" };
  }

  function build(opts) {
    opts = opts || {};
    var now = opts.date || new Date();
    var ctx0 = context(now);
    var name = (opts.name || "").trim();
    var W = 1080, H = 1350, A = ctx0.accent;
    var c = document.createElement("canvas"); c.width = W; c.height = H;
    var ctx = c.getContext("2d");

    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, darken(A, 0.62)); g.addColorStop(0.55, A); g.addColorStop(1, darken(A, 0.42));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // top sun glow + rays
    var rg = ctx.createRadialGradient(W / 2, 250, 40, W / 2, 250, 520);
    rg.addColorStop(0, "rgba(255,255,255,0.35)"); rg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, 700);
    ctx.save(); ctx.translate(W / 2, 250);
    for (var i = 0; i < 24; i++) { ctx.rotate(Math.PI / 12); ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(14, 0); ctx.lineTo(0, 520); ctx.closePath(); ctx.fill(); }
    ctx.restore();

    // border
    ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 5; ctx.strokeRect(40, 40, W - 80, H - 80);

    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    // greeting
    ctx.fillStyle = "#fff"; ctx.shadowColor = "rgba(0,0,0,.3)"; ctx.shadowBlur = 14;
    ctx.font = "800 96px 'Noto Sans Devanagari', sans-serif";
    ctx.fillText(ctx0.greet, W / 2, 175);
    ctx.shadowBlur = 0;

    // deity circle + symbol
    ctx.beginPath(); ctx.arc(W / 2, 400, 130, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.16)"; ctx.fill();
    ctx.font = "160px 'Noto Sans Devanagari', serif"; ctx.fillStyle = "#fff";
    ctx.fillText(ctx0.symbol, W / 2, 405);
    // deity/festival name
    ctx.font = "700 52px 'Noto Sans Devanagari', sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fillText(ctx0.title, W / 2, 585);

    // blessing (wrapped)
    ctx.font = "700 60px 'Noto Sans Devanagari', serif"; ctx.fillStyle = "#fff";
    var bl = wrap(ctx, ctx0.blessing, W - 220);
    var by = 730; for (var k = 0; k < bl.length && k < 3; k++) { ctx.fillText(bl[k], W / 2, by + k * 82); }

    // quote (small)
    if (ctx0.quote) {
      ctx.font = "400 38px 'Noto Sans Devanagari', sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.82)";
      var ql = wrap(ctx, "“" + ctx0.quote + "”", W - 260);
      var qy = by + Math.min(bl.length, 3) * 82 + 40;
      for (var q = 0; q < ql.length && q < 2; q++) ctx.fillText(ql[q], W / 2, qy + q * 50);
    }

    // date + tithi strip
    var dateStr = DAYS[now.getDay()] + " · " + now.getDate() + " " + MON[now.getMonth()] + " " + now.getFullYear();
    var tithiStr = "";
    try { if (window.Panchang) { var t = window.Panchang.tithi(now); tithiStr = "  ·  " + t.paksha + " " + t.name; } } catch (e) {}
    ctx.font = "500 40px 'Noto Sans Devanagari', sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillText(dateStr + tithiStr, W / 2, H - 250);

    // name
    if (name) {
      ctx.font = "700 50px 'Noto Sans Devanagari', sans-serif"; ctx.fillStyle = "#fff";
      ctx.fillText("— " + name + " जी", W / 2, H - 175);
    }

    // branding
    ctx.font = "800 46px 'Noto Sans Devanagari', sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fillText("🚩 Bhakti Daily", W / 2, H - 100);
    ctx.font = "400 30px 'Noto Sans Devanagari', sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.fillText("रोज़ भक्ति • Chalisa · Aarti · Mantra · पंचांग", W / 2, H - 58);

    return c.toDataURL("image/png");
  }

  function caption(name) {
    var ctx0 = context(new Date());
    return (name ? (ctx0.greet + " 🙏 — " + name + " ji\n") : (ctx0.greet + " 🙏\n")) +
      ctx0.blessing + "\n\n🚩 Bhakti Daily se — aap bhi roz aisa bhejein.\nPlay Store: Bhakti Daily";
  }

  window.Blessing = { build: build, context: context, caption: caption };
})();
