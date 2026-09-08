/* Bhakti Daily — privacy-conscious event logging.
 * Koi personal info collect nahi hoti. User settings se off bhi kiya ja sakta hai.
 * Native bridge (logEvent) ko forward karta hai (aage Firebase se jod sakte hain). */
(function () {
  "use strict";
  var BUF = "analytics_events";

  function enabled() {
    try { return !window.Store || window.Store.getSettings().analytics !== false; }
    catch (e) { return true; }
  }

  var Analytics = {
    track: function (name, params) {
      if (!enabled()) return;
      params = params || {};
      // local ring buffer (debug / future export) — no PII
      try {
        var arr = window.Store ? window.Store.get(BUF, []) : [];
        arr.push({ e: name, p: params, t: Date.now() });
        if (arr.length > 100) arr = arr.slice(arr.length - 100);
        if (window.Store) window.Store.set(BUF, arr);
      } catch (e) {}
      if (window.Bridge) window.Bridge.logEvent(name, params);
    },
    recent: function () { try { return window.Store ? window.Store.get(BUF, []) : []; } catch (e) { return []; } },
    clear: function () { try { if (window.Store) window.Store.set(BUF, []); } catch (e) {} },
  };

  window.Analytics = Analytics;
})();
