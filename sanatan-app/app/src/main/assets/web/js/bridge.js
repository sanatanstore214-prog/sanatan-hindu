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

    // Ads
    maybeInterstitial: function () { call("onNavigate"); },
    showInterstitial: function () { call("showInterstitial"); },
    setAdsEnabled: function (on) { call("setAdsEnabled", [!!on]); },

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
    }
  };

  window.Bridge = Bridge;
})();
