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
    { id:"gita2", cat:"motivation", label:"प्रेरणा", bg:["#141E30","#243B55"], motif:"🚩", head:"मन को जीता,\nतो जग जीता", sub:"श्रद्धा · धैर्य · भक्ति", accent:"#FFD700", tcolor:"#ffffff" },

    // ---- ✨ PREMIUM (1 rewarded ad = 24 ghante unlock). style: gold = shahi sona, glow = neon aabha ----
    { id:"p_mahadev_gold", premium:true, style:"gold", cat:"mahadev", label:"महादेव", bg:["#0B0B0F","#1C1A2E"], motif:"🔱", head:"हर हर\nमहादेव", sub:"ॐ नमः शिवाय", accent:"#F3D67E", tcolor:"#ffffff" },
    { id:"p_mahadev_glow", premium:true, style:"glow", glow:"#4FC3F7", cat:"mahadev", label:"भोलेनाथ", bg:["#06141B","#12303D"], motif:"🌙", head:"जय\nभोलेनाथ", sub:"महाकाल की जय", accent:"#B3E5FC", tcolor:"#ffffff" },
    { id:"p_krishna_gold", premium:true, style:"gold", cat:"krishna", label:"श्री कृष्ण", bg:["#04161A","#0A2A33"], motif:"🦚", head:"जय श्री\nकृष्ण", sub:"राधे राधे", accent:"#F3D67E", tcolor:"#ffffff" },
    { id:"p_ram_gold", premium:true, style:"gold", cat:"ram", label:"श्री राम", bg:["#1E0703","#3E1006"], motif:"🏹", head:"जय श्री\nराम", sub:"🚩 सियावर रामचंद्र की जय", accent:"#F3D67E", tcolor:"#ffffff" },
    { id:"p_durga_glow", premium:true, style:"glow", glow:"#FF4F9A", cat:"durga", label:"माँ दुर्गा", bg:["#1E0716","#3C0B2A"], motif:"🌺", head:"जय माँ\nदुर्गा", sub:"शक्ति स्वरूपा", accent:"#FFC1DD", tcolor:"#ffffff" },
    { id:"p_hanuman_gold", premium:true, style:"gold", cat:"hanuman", label:"हनुमान जी", bg:["#1F0800","#461600"], motif:"🚩", head:"जय\nहनुमान", sub:"संकटमोचन की जय", accent:"#F3D67E", tcolor:"#ffffff" },
    { id:"p_ganesh_gold", premium:true, style:"gold", cat:"ganesh", label:"श्री गणेश", bg:["#1A1000","#3A2300"], motif:"🐘", head:"श्री गणेशाय\nनमः", sub:"विघ्नहर्ता मंगलमूर्ति", accent:"#F3D67E", tcolor:"#ffffff" },
    { id:"p_morning_glow", premium:true, style:"glow", glow:"#FFE082", cat:"morning", label:"सुप्रभात", bg:["#FF6A00","#C2185B"], motif:"☀️", head:"शुभ\nप्रभात", sub:"सूर्य देव का आशीर्वाद 🙏", accent:"#FFF8E1", tcolor:"#ffffff" },
    { id:"p_gita_gold", premium:true, style:"gold", cat:"motivation", label:"गीता", bg:["#050505","#1B1B1B"], motif:"🕉️", head:"योगः कर्मसु\nकौशलम्", sub:"— श्रीमद्भगवद्गीता 2.50", accent:"#F3D67E", tcolor:"#ffffff" },
    { id:"p_motivation_glow", premium:true, style:"glow", glow:"#FFD700", cat:"motivation", label:"श्रद्धा", bg:["#0E1726","#2D4A6E"], motif:"✨", head:"श्रद्धा रखो,\nसब होगा", sub:"ईश्वर सब देखता है 🙏", accent:"#FFF3C4", tcolor:"#ffffff" }
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

  function drawCircleImage(ctx, img, cx, cy, r) {
    var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    var s = Math.max((2 * r) / iw, (2 * r) / ih), dw = iw * s, dh = ih * s;   // cover-fit
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
    ctx.restore();
  }
  function goldGrad(ctx, y0, y1) {
    var g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, "#FFF6CF"); g.addColorStop(0.45, "#F0C75E"); g.addColorStop(1, "#B7862A");
    return g;
  }

  // build(id, {name, size:"story"|"dp", thumb:bool, photo:HTMLImageElement}) -> dataURL
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
    var cx = W / 2, S = function (n) { return Math.round(n * scale); };
    var gold = t.style === "gold", glow = t.style === "glow";
    var photo = opts.photo && (opts.photo.naturalWidth || opts.photo.width) ? opts.photo : null;
    var dpPhoto = photo && !story;

    // layout (fractions of H) — photo mode moves text below the photo; no overlaps
    var L = !photo ? { label: 0.12, head: story ? 0.46 : 0.44, hf: story ? 118 : 96, chip: story ? 0.82 : 0.80, sub: true }
          : story ? { label: 0.10, pcy: 0.34, pr: 0.27, head: 0.60, hf: 104, chip: 0.82, sub: true }
                  : { label: 0.085, pcy: 0.36, pr: 0.21, head: 0.71, hf: 68, chip: 0.86, sub: false };

    // bg gradient + vignette
    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, t.bg[0]); g.addColorStop(1, t.bg[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var rg = ctx.createRadialGradient(cx, H * 0.42, W * 0.15, cx, H * 0.5, H * 0.75);
    rg.addColorStop(0, gold ? "rgba(243,214,126,0.10)" : "rgba(255,255,255,0.10)"); rg.addColorStop(1, "rgba(0,0,0,0.34)");
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);

    // big faded motif (behind)
    ctx.save();
    ctx.globalAlpha = gold ? 0.10 : 0.14; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = (story ? Math.round(H * 0.42) : Math.round(H * 0.5)) + "px serif";
    ctx.fillText(t.motif, cx, H * (story ? 0.60 : 0.58));
    ctx.restore();

    // frame: gold = double shahi frame + corner ornaments; glow = neon; default = white
    var m = S(36);
    if (gold) {
      ctx.strokeStyle = goldGrad(ctx, 0, H); ctx.lineWidth = Math.max(2, S(5));
      roundRect(ctx, m, m, W - 2 * m, H - 2 * m, S(40)); ctx.stroke();
      ctx.lineWidth = Math.max(1, S(2)); var m2 = S(54);
      roundRect(ctx, m2, m2, W - 2 * m2, H - 2 * m2, S(28)); ctx.stroke();
      ctx.fillStyle = "#F0C75E"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = S(34) + "px serif";
      var o = S(76);
      ctx.fillText("✦", o, o); ctx.fillText("✦", W - o, o); ctx.fillText("✦", o, H - o); ctx.fillText("✦", W - o, H - o);
    } else if (glow) {
      ctx.save(); ctx.shadowColor = t.glow; ctx.shadowBlur = S(26);
      ctx.strokeStyle = t.glow; ctx.lineWidth = Math.max(2, S(4));
      roundRect(ctx, m, m, W - 2 * m, H - 2 * m, S(40)); ctx.stroke(); ctx.restore();
    } else {
      ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = Math.max(2, S(5));
      roundRect(ctx, m, m, W - 2 * m, H - 2 * m, S(40)); ctx.stroke();
    }

    ctx.textAlign = "center"; ctx.textBaseline = "middle";

    // top label
    ctx.font = "700 " + S(34) + "px 'Noto Sans Devanagari', sans-serif";
    ctx.fillStyle = gold ? "#F3D67E" : "rgba(255,255,255,0.9)";
    ctx.fillText("🚩 " + t.label, cx, H * L.label);

    // user photo (circle + divine ring)
    if (photo) {
      var pcy = H * L.pcy, pr = W * L.pr;
      ctx.save();
      ctx.shadowColor = glow ? t.glow : "rgba(243,214,126,0.85)"; ctx.shadowBlur = S(40);
      ctx.beginPath(); ctx.arc(cx, pcy, pr + S(10), 0, Math.PI * 2);
      ctx.fillStyle = gold ? "#B7862A" : (glow ? t.glow : "#F3D67E"); ctx.fill();
      ctx.restore();
      drawCircleImage(ctx, photo, cx, pcy, pr);
      ctx.beginPath(); ctx.arc(cx, pcy, pr + S(5), 0, Math.PI * 2);
      ctx.lineWidth = S(10); ctx.strokeStyle = gold ? goldGrad(ctx, pcy - pr, pcy + pr) : (glow ? t.glow : "#F3D67E"); ctx.stroke();
    }

    // headline (supports \n + wrap)
    var hf = S(L.hf);
    ctx.font = "800 " + hf + "px 'Noto Sans Devanagari', sans-serif";
    var raw = t.head.split("\n"), lines = [];
    for (var i = 0; i < raw.length; i++) wrap(ctx, raw[i], W - S(180)).forEach(function (l) { lines.push(l); });
    var lh = hf * 1.12, startY = H * L.head - (lines.length - 1) * lh / 2;
    if (gold) ctx.fillStyle = goldGrad(ctx, startY - hf / 2, startY + (lines.length - 1) * lh + hf / 2);
    else ctx.fillStyle = t.tcolor;
    var passes = glow ? 2 : 1;
    for (var p = 0; p < passes; p++) {
      if (glow) { ctx.shadowColor = t.glow; ctx.shadowBlur = S(p ? 14 : 38); ctx.shadowOffsetY = 0; }
      else { ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = S(10); ctx.shadowOffsetY = S(3); }
      for (var j = 0; j < lines.length; j++) ctx.fillText(lines[j], cx, startY + j * lh);
    }
    ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    // sub line
    if (t.sub && L.sub) {
      ctx.font = "600 " + S(40) + "px 'Noto Sans Devanagari', sans-serif";
      ctx.fillStyle = t.accent;
      ctx.fillText(t.sub, cx, startY + lines.length * lh + S(24));
    }

    // name chip (drives sharing)
    var nm = (opts.name || "").toString().slice(0, 20).trim();
    if (nm) {
      ctx.font = "700 " + S(dpPhoto ? 38 : 42) + "px 'Noto Sans Devanagari', sans-serif";
      var label = "— " + nm + " 🙏";
      var tw = ctx.measureText(label).width, pad = S(30), chipY = H * L.chip;
      ctx.fillStyle = gold ? "rgba(183,134,42,0.30)" : "rgba(0,0,0,0.28)";
      roundRect(ctx, cx - tw / 2 - pad, chipY - S(34), tw + 2 * pad, S(68), S(34));
      ctx.fill();
      if (gold) { ctx.strokeStyle = "rgba(243,214,126,0.7)"; ctx.lineWidth = Math.max(1, S(2)); ctx.stroke(); }
      ctx.fillStyle = gold ? "#FFF6CF" : "#fff"; ctx.fillText(label, cx, chipY);
    }

    // footer branding
    ctx.font = "700 " + S(34) + "px 'Noto Sans Devanagari', sans-serif";
    ctx.fillStyle = gold ? "#F3D67E" : "rgba(255,255,255,0.92)";
    ctx.fillText("🚩 Bhakti Daily", cx, H - S(gold ? 92 : 70));   // gold: inner frame line se upar

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
