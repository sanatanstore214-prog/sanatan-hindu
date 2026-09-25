/* Bhakti Daily — emoji fallback for older phones (ES5).
 * Naye emoji (🪷 🪔 🦚 …) purane Android (7–12) ke system font me nahi hote aur khali dabba (tofu)
 * dikhte hain. Yahan har aise emoji ko canvas par draw karke jaancha jata hai; agar phone use rang
 * me nahi bana pata to page ke text aur share/status canvas dono me uski jagah purana emoji lagta hai.
 * Naye phones par (sab supported) kuch bhi nahi badalta — observer/patch lagte hi nahi. */
(function () {
  "use strict";
  // naya emoji (Emoji version / Android) -> purana, har Android 7+ par milne wala
  var MAP = {
    "🪷": "🌸",         // 🪷 lotus (14.0 / A13)  -> 🌸
    "🪙": "💰",         // 🪙 coin (13.0 / A11)   -> 💰
    "🪈": "🎶",         // 🪈 flute (15.0 / A14)  -> 🎶
    "🪔": "🕯️",   // 🪔 diya (12.0 / A10)   -> 🕯️
    "🪁": "☀️",         // 🪁 kite (12.0 / A10)   -> ☀️ (Sankranti = Surya)
    "🧵": "🎀",         // 🧵 thread (11.0 / A9)  -> 🎀
    "🦚": "🎶",         // 🦚 peacock (11.0 / A9) -> 🎶
    "🧘": "🙏"          // 🧘 lotus pos. (5.0 / A8) -> 🙏
  };
  var bad = {}, badList = [], re = null;

  /** Rang me bana to supported (tofu dabba hamesha kala/grey hota hai). */
  function colorful(ch) {
    try {
      var c = document.createElement("canvas");
      c.width = 28; c.height = 28;
      var x = c.getContext && c.getContext("2d");
      if (!x || !x.getImageData) return true;             // jaanch nahi ho sakti -> maan lo theek hai
      x.textBaseline = "top";
      x.font = "22px sans-serif";
      x.fillStyle = "#000";
      x.fillText(ch, 2, 2);
      var d = x.getImageData(0, 0, 28, 28).data, inked = 0;
      for (var i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 40) continue;
        inked++;
        var r = d[i], g = d[i + 1], b = d[i + 2];
        if (Math.abs(r - g) > 24 || Math.abs(g - b) > 24 || Math.abs(r - b) > 24) return true;
      }
      return false;                                       // kuch nahi bana / sirf kala-grey = tofu
    } catch (e) { return true; }
  }

  function detect() {
    var force = window.__EMOJI_FORCE_FALLBACK === true;  // tests
    for (var k in MAP) {
      if (!MAP.hasOwnProperty(k)) continue;
      if (force || !colorful(k)) { bad[k] = MAP[k]; badList.push(k); }
    }
    if (badList.length) re = new RegExp(badList.join("|"), "g");
  }

  function fix(s) {
    if (!re || s == null) return s;
    s = String(s);
    return s.replace(re, function (m) { return bad[m] || m; });
  }

  function fixTree(root) {
    if (!re || !root) return;
    if (root.nodeType === 3) { var v = root.nodeValue, f = fix(v); if (f !== v) root.nodeValue = f; return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    var walker = document.createTreeWalker(root, 4 /* SHOW_TEXT */, null, false), n, list = [];
    while ((n = walker.nextNode())) list.push(n);
    for (var i = 0; i < list.length; i++) {
      var t = list[i].nodeValue, ft = fix(t);
      if (ft !== t) list[i].nodeValue = ft;
    }
  }

  function start() {
    detect();
    window.Emoji = { fix: fix, fixTree: fixTree, unsupported: badList.slice(), map: MAP };
    if (!re) return;                                      // sab supported: kuch mat karo
    // 1) Page text: abhi ka DOM + aage jo bhi render ho
    fixTree(document.body || document.documentElement);
    if (window.MutationObserver) {
      new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var m = muts[i];
          if (m.type === "characterData") fixTree(m.target);
          else for (var j = 0; j < m.addedNodes.length; j++) fixTree(m.addedNodes[j]);
        }
      }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    }
    // 2) Canvas (share card / Status / wallpaper images)
    try {
      var P = window.CanvasRenderingContext2D && window.CanvasRenderingContext2D.prototype;
      if (P) {
        ["fillText", "strokeText", "measureText"].forEach(function (name) {
          var orig = P[name];
          if (typeof orig !== "function") return;
          P[name] = function (text) {
            var a = Array.prototype.slice.call(arguments);
            a[0] = fix(text);
            return orig.apply(this, a);
          };
        });
      }
    } catch (e) {}
  }

  start();
})();
