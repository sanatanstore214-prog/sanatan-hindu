/* Bhakti Daily — safe wrapper around the native Android bridge (window.Android).
 * Browser me (bina Android ke) sab methods no-op / sensible default return karte hain. */
(function () {
  "use strict";
  function A() { return window.Android || null; }
  function call(fn, args, def) {
    try {
      var a = A();
      if (a && typeof a[fn] === "function") return a[fn].apply(a, args || []);
    } catch (e) {}
    return def;
  }

  var Bridge = {
    isNative: function () { return !!A(); },

    // Ads (native paces everything: count + time-gap + session grace — see AdConfig.java)
    maybeInterstitial: function () { call("onNavigate"); },      // chhota natural break
    showInterstitial: function () { call("showInterstitial"); },  // bada natural break (paath/mala poora)
    setAdsEnabled: function (on) { call("setAdsEnabled", [!!on]); },

    // Rewarded — SIRF user ke tap par. Promise -> { ok, reason }.
    // reason: ok | closed (poora nahi dekha) | not_ready | fail | web (browser: ads nahi, inaam de do)
    isRewardedReady: function () { return call("isRewardedReady", [], false) === true; },
    preloadRewarded: function () { call("preloadRewarded"); },
    showRewarded: function (tag) {
      tag = String(tag || "reward");
      var a = A();
      if (!a || typeof a.showRewarded !== "function") return Promise.resolve({ ok: true, reason: "web" });
      return new Promise(function (resolve) {
        Bridge._rw[tag] = resolve;
        try { a.showRewarded(tag); } catch (e) { delete Bridge._rw[tag]; resolve({ ok: false, reason: "fail" }); }
        // safety: agar native kabhi callback na de
        setTimeout(function () { if (Bridge._rw[tag] === resolve) { delete Bridge._rw[tag]; resolve({ ok: false, reason: "timeout" }); } }, 120000);
      });
    },
    _rw: {},

    // Privacy options (UMP) — EEA/UK users
    isPrivacyOptionsRequired: function () { return call("isPrivacyOptionsRequired", [], false) === true; },
    showPrivacyOptions: function () { call("showPrivacyOptions"); },

    // Sharing
    shareText: function (text) {
      if (call("shareText", [String(text)], "__none__") === "__none__") {
        // Web fallback
        if (navigator.share) { try { navigator.share({ text: String(text) }); } catch (e) {} }
      }
    },
    shareImage: function (dataUrl, caption) {
      var b64 = String(dataUrl).replace(/^data:image\/\w+;base64,/, "");
      call("shareImage", [b64, String(caption || "")]);
    },
    shareWhatsApp: function (dataUrl, caption) {
      var b64 = String(dataUrl).replace(/^data:image\/\w+;base64,/, "");
      // native tries WhatsApp first, falls back to chooser; "__none__" = no native
      if (call("shareWhatsApp", [b64, String(caption || "")], "__none__") === "__none__") {
        this.shareImage(dataUrl, caption);
      }
    },

    // Reminders
    setReminders: function (arr) { call("setReminders", [JSON.stringify(arr)]); },
    getReminders: function () {
      var s = call("getReminders", [], null);
      if (!s) return null;
      try { return JSON.parse(s); } catch (e) { return null; }
    },
    requestNotificationPermission: function () { call("requestNotificationPermission"); },
    hasNotificationPermission: function () { return call("hasNotificationPermission", [], true) === true; },

    // Analytics
    logEvent: function (name, params) { call("logEvent", [String(name), JSON.stringify(params || {})]); },

    // Routing / misc
    getInitialRoute: function () { return call("getInitialRoute", [], "") || ""; },
    vibrate: function (ms) { call("vibrate", [ms | 0]); },
    openPlayStore: function () { call("openPlayStore"); },

    // Wallpaper / save / clipboard
    setWallpaper: function (dataUrl) {
      var b64 = String(dataUrl).replace(/^data:image\/\w+;base64,/, "");
      return call("setWallpaper", [b64], "__none__") !== "__none__";
    },
    saveImage: function (dataUrl, name) {
      var b64 = String(dataUrl).replace(/^data:image\/\w+;base64,/, "");
      return call("saveImage", [b64, String(name || "bhakti")], "__none__") !== "__none__";
    },
    copyText: function (text) {
      if (call("copyText", [String(text)], "__none__") === "__none__") {
        try { if (navigator.clipboard) navigator.clipboard.writeText(String(text)); } catch (e) {}
      }
    },
    // Text-to-speech (device Hindi voice) — no audio files needed
    speak: function (text) {
      if (call("speak", [String(text)], "__none__") === "__none__") {
        try { if (window.speechSynthesis) { var u = new SpeechSynthesisUtterance(String(text)); u.lang = "hi-IN"; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } } catch (e) {}
      }
    },
    stopSpeak: function () {
      if (call("stopSpeak", [], "__none__") === "__none__") {
        try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
      }
    },
    // Background audio (native MediaService)
    audioPlay: function (src, title) { call("audioPlay", [String(src || ""), String(title || "")]); },
    audioPause: function () { call("audioPause"); },
    audioResume: function () { call("audioResume"); },
    audioSeek: function (ms) { call("audioSeek", [ms | 0]); },
    audioStop: function () { call("audioStop"); },
    openUrl: function (url) { if (this.isNative()) call("openUrl", [String(url)]); else { try { window.open(String(url), "_blank"); } catch (e) {} } },

    // HTTP (for Group Jaap / Firestore REST). Native path avoids WebView CORS.
    // Returns a Promise resolving to { status, text }. Falls back to fetch in browser.
    http: function (method, url, body) {
      var a = A();
      if (a && typeof a.httpRequest === "function") {
        return new Promise(function (resolve) {
          var id = "h" + (Bridge._hid = (Bridge._hid || 0) + 1) + "_" + Date.now();
          Bridge._http[id] = resolve;
          try { a.httpRequest(id, String(method || "GET"), String(url), body == null ? "" : String(body)); }
          catch (e) { delete Bridge._http[id]; resolve({ status: -1, text: "" }); }
        });
      }
      // Browser fallback (works when CORS allows, e.g. local testing)
      return fetch(String(url), {
        method: String(method || "GET"),
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body || undefined
      }).then(function (r) {
        return r.text().then(function (t) { return { status: r.status, text: t }; });
      }).catch(function () { return { status: -1, text: "" }; });
    },
    _http: {}
  };

  // Native callback target for Bridge.showRewarded
  window.__reward = function (tag, ok, reason) {
    var cb = Bridge._rw[tag];
    if (cb) { delete Bridge._rw[tag]; try { cb({ ok: !!ok, reason: String(reason || "") }); } catch (e) {} }
  };

  // Native callback target for Bridge.http
  window.__http = function (reqId, status, text) {
    var cb = Bridge._http[reqId];
    if (cb) { delete Bridge._http[reqId]; try { cb({ status: status, text: text }); } catch (e) {} }
  };

  window.Bridge = Bridge;
})();
