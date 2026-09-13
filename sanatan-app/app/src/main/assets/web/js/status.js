/* Bhakti Daily — Status / DP Maker (Gen-Z viral engine).
 * Aesthetic status (9:16) aur DP (1:1) cards — naam ke saath — canvas se bante,
 * WhatsApp/Insta par share ke liye. Sirf gradient + sacred symbol + typography
 * (koi copyrighted deity photo nahi — safe + modern aesthetic).
 * ES5 syntax. */
(function () {
  "use strict";

  // Template specs. bg = diagonal gradient stops; motif = bada faded symbol;
  // head = badi line(s) (\n se todo); sub = chhoti line; accent = chip/uchcha rang.
  var T = [
    { id:"morning1", cat:"morning", label:"सुप्रभात", bg:["#FF8A00","#E52E71"], motif:"🌅", head:"शुभ\nप्रभात", sub:"आपका दिन मंगलमय हो 🙏", accent:"#FFD54F", tcolor:"#ffffff" },
    { id:"morning2", cat:"morning", label:"राधे राधे", bg:["#F857A6","#FF5858"], motif:"🌸", head:"राधे\nराधे", sub:"जय श्री राधे कृष्ण", accent:"#FFF176", tcolor:"#ffffff" },
    { id:"mahadev1", cat:"mahadev", label:"महादेव", bg:["#232526","#414345"], motif:"🔱", head:"हर हर\nमहादेव", sub:"ॐ नमः शिवाय", accent:"#9575CD", tcolor:"#ffffff" },
    { id:"mahadev2", cat:"mahadev", label:"शिव", bg:["#0F2027","#2C5364"], motif:"🕉️", head:"ॐ नमः\nशिवाय", sub:"भोलेनाथ की जय", accent:"#4FC3F7", tcolor:"#ffffff" },
    { id:"krishna1", cat:"krishna", label:"कृष्ण", bg:["#11998E","#1A2980"], motif:"🦚", head:"जय श्री\nकृष्ण", sub:"राधे राधे", accent:"#80DEEA", tcolor:"#ffffff" },
    { id:"krishna2", cat:"krishna", label:"राधा-कृष्ण", bg:["#7B1FA2","#C2185B"], motif:"🪈", head:"राधे\nकृष्ण", sub:"प्रेम ही भक्ति है", accent:"#F48FB1", tcolor:"#ffffff" },
    { id:"ram1", cat:"ram", label:"श्री राम", bg:["#F12711","#F5AF19"], motif:"🏹", head:"जय श्री\nराम", sub:"🚩 सियावर रामचंद्र की जय", accent:"#FFE082", tcolor:"#ffffff" },
    { id:"ram2", cat:"ram", label:"राम", bg:["#8E2DE2","#4A00E0"], motif:"🚩", head:"जय श्री\nराम", sub:"राम नाम सत्य है", accent:"#FFD54F", tcolor:"#ffffff" },
    { id:"durga1", cat:"durga", label:"माँ दुर्गा", bg:["#B24592","#F15F79"], motif:"🌺", head:"जय\nमाता दी", sub:"या देवी सर्वभूतेषु 🙏", accent:"#FFF176", tcolor:"#ffffff" },
    { id:"durga2", cat:"durga", label:"शक्ति", bg:["#870000","#190A05"], motif:"🦁", head:"जय\nअम्बे", sub:"माँ शेरावाली की जय", accent:"#FF8A65", tcolor:"#ffffff" },
    { id:"hanuman1", cat:"hanuman", label:"हनुमान जी", bg:["#F00000","#DC281E"], motif:"🚩", head:"जय\nबजरंगबली", sub:"संकटमोचन हनुमान 🙏", accent:"#FFD54F", tcolor:"#ffffff" },
    { id:"ganesh1", cat:"ganesh", label:"गणेश जी", bg:["#FFB75E","#ED8F03"], motif:"🐘", head:"गणपति बाप्पा\nमोरया", sub:"🕉️ मंगलमूर्ति", accent:"#FFF3E0", tcolor:"#4E2600" },
    { id:"gita1", cat:"motivation", label:"गीता ज्ञान", bg:["#0F0C29","#302B63"], motif:"🕉️", head:"कर्म करो,\nफल की चिंता\nमत करो", sub:"— श्रीमद्भगवद्गीता", accent:"#FFD700", tcolor:"#ffffff" },
    { id:"gita2", cat:"motivation", label:"प्रेरणा", bg:["#141E30","#243B55"], motif:"🚩", head:"मन को जीता,\nतो जग जीता", sub:"श्रद्धा · धैर्य · भक्ति", accent:"#FFD700", tcolor:"#ffffff" }
  ];

  var CATS = [
    { key:"morning", label:"सुप्रभात" }, { key:"mahadev", label:"महादेव" },
    { key:"krishna", label:"कृष्ण" }, { key:"ram", label:"राम" },
    { key:"durga", label:"दुर्गा" }, { key:"hanuman", label:"हनुमान" },
    { key:"ganesh", label:"गणेश" }, { key:"motivation", label:"प्रेरणा" }
  ];

  function byId(id) { for (var i = 0; i < T.length; i++) if (T[i].id === id) return T[i]; return T[0]; }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function wrap(ctx, text, maxW) {
    var words = text.split(" "), lines = [], line = "";
    for (var i = 0; i < words.length; i++) {
      var t = line ? line + " " + words[i] : words[i];
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = words[i]; }
      else line = t;
    }
    if (line) lines.push(line);
    return lines;
  }

  // build(id, {name, size:"story"|"dp", thumb:bool}) -> dataURL
  function build(id, opts) {
    opts = opts || {};
    var t = byId(id);
    var story = opts.size !== "dp";
    var scale = opts.thumb ? (story ? 0.28 : 0.33) : 1;
    var W = Math.round(1080 * scale), H = Math.round((story ? 1920 : 1080) * scale);
    var c = document.createElement("canvas");
    c.width = W; c.height = H;
    var ctx = c.getContext("2d");
    if (!ctx) return "";
    var cx = W / 2;

    // bg gradient
    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, t.bg[0]); g.addColorStop(1, t.bg[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // vignette
    var rg = ctx.createRadialGradient(cx, H * 0.42, W * 0.15, cx, H * 0.5, H * 0.75);
    rg.addColorStop(0, "rgba(255,255,255,0.10)"); rg.addColorStop(1, "rgba(0,0,0,0.34)");
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);

    // big faded motif (behind)
    ctx.save();
    ctx.globalAlpha = 0.14; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = (story ? Math.round(H * 0.42) : Math.round(H * 0.5)) + "px serif";
    ctx.fillText(t.motif, cx, H * (story ? 0.60 : 0.58));
    ctx.restore();

    // frame
    ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = Math.max(2, 5 * scale);
    var m = Math.round(36 * scale); roundRect(ctx, m, m, W - 2 * m, H - 2 * m, Math.round(40 * scale)); ctx.stroke();

    ctx.textAlign = "center"; ctx.textBaseline = "middle";

    // top label chip
    ctx.font = "700 " + Math.round(34 * scale) + "px 'Noto Sans Devanagari', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText("🚩 " + t.label, cx, H * 0.12);

    // headline (supports \n + wrap)
    ctx.fillStyle = t.tcolor;
    var hf = Math.round((story ? 118 : 96) * scale);
    ctx.font = "800 " + hf + "px 'Noto Sans Devanagari', sans-serif";
    var raw = t.head.split("\n"), lines = [];
    for (var i = 0; i < raw.length; i++) wrap(ctx, raw[i], W - Math.round(180 * scale)).forEach(function (l) { lines.push(l); });
    var lh = hf * 1.12, startY = H * (story ? 0.46 : 0.44) - (lines.length - 1) * lh / 2;
    ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 10 * scale; ctx.shadowOffsetY = 3 * scale;
    for (var j = 0; j < lines.length; j++) ctx.fillText(lines[j], cx, startY + j * lh);
    ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    // sub line
    if (t.sub) {
      ctx.font = "600 " + Math.round(40 * scale) + "px 'Noto Sans Devanagari', sans-serif";
      ctx.fillStyle = t.accent;
      ctx.fillText(t.sub, cx, startY + lines.length * lh + Math.round(24 * scale));
    }

    // name chip (drives sharing)
    var nm = (opts.name || "").toString().slice(0, 20).trim();
    if (nm) {
      ctx.font = "700 " + Math.round(42 * scale) + "px 'Noto Sans Devanagari', sans-serif";
      var label = "— " + nm + " 🙏";
      var tw = ctx.measureText(label).width, pad = Math.round(30 * scale);
      var chipY = H * (story ? 0.82 : 0.80);
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      roundRect(ctx, cx - tw / 2 - pad, chipY - Math.round(34 * scale), tw + 2 * pad, Math.round(68 * scale), Math.round(34 * scale));
      ctx.fill();
      ctx.fillStyle = "#fff"; ctx.fillText(label, cx, chipY);
    }

    // footer branding
    ctx.font = "700 " + Math.round(34 * scale) + "px 'Noto Sans Devanagari', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillText("🚩 Bhakti Daily", cx, H - Math.round(70 * scale));

    return c.toDataURL("image/png");
  }

  window.StatusMaker = {
    templates: T,
    cats: CATS,
    byId: byId,
    build: build,
    caption: function (id) {
      var t = byId(id);
      return t.head.replace(/\n/g, " ") + (t.sub ? "\n" + t.sub : "") +
        "\n\n🚩 Bhakti Daily se banaya — aap bhi banao:\nhttps://play.google.com/store/apps/details?id=com.sanatanhindu.app";
    }
  };
})();
