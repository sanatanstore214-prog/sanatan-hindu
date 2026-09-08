/* Bhakti Daily — local persistence layer (localStorage, offline-first).
 * Har read/write try/catch me hai — private mode / blocked storage me app na toote. */
(function () {
  "use strict";
  var PREFIX = "bhakti:";

  function read(key, def) {
    try {
      var v = localStorage.getItem(PREFIX + key);
      return v == null ? def : JSON.parse(v);
    } catch (e) { return def; }
  }
  function write(key, val) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); return true; }
    catch (e) { return false; }
  }

  function todayStr(d) {
    d = d || new Date();
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" + m : m) + "-" + (day < 10 ? "0" + day : day);
  }
  function daysBetween(a, b) {
    // a, b = "YYYY-MM-DD"; returns b-a in whole days
    var pa = a.split("-"), pb = b.split("-");
    var da = Date.UTC(+pa[0], +pa[1] - 1, +pa[2]);
    var db = Date.UTC(+pb[0], +pb[1] - 1, +pb[2]);
    return Math.round((db - da) / 86400000);
  }

  var MILESTONES = [3, 7, 21, 40, 108];

  var Store = {
    // ---- generic ----
    get: read, set: write, todayStr: todayStr,

    // ---- settings ----
    defaultsSettings: { theme: "system", fontScale: 1, focus: false, analytics: true },
    getSettings: function () {
      var s = read("settings", {});
      var d = this.defaultsSettings, out = {};
      for (var k in d) out[k] = (s && s[k] != null) ? s[k] : d[k];
      return out;
    },
    setSettings: function (patch) {
      var s = this.getSettings();
      for (var k in patch) s[k] = patch[k];
      write("settings", s);
      return s;
    },

    // ---- favorites ----
    getFavs: function () { return read("favs", []); },
    isFav: function (id) { return this.getFavs().indexOf(id) !== -1; },
    toggleFav: function (id) {
      var f = this.getFavs(), i = f.indexOf(id);
      if (i === -1) f.unshift(id); else f.splice(i, 1);
      write("favs", f);
      return i === -1; // true = added
    },

    // ---- recents ----
    getRecents: function () { return read("recents", []); },
    pushRecent: function (id) {
      var r = this.getRecents(), i = r.indexOf(id);
      if (i !== -1) r.splice(i, 1);
      r.unshift(id);
      if (r.length > 15) r = r.slice(0, 15);
      write("recents", r);
    },

    // ---- last read position ----
    setLastRead: function (id, frac) { write("lastread", { id: id, frac: frac || 0, ts: Date.now() }); },
    getLastRead: function () { return read("lastread", null); },

    // ---- streak ----
    getStreak: function () {
      var s = read("streak", { last: null, count: 0, best: 0 });
      s.todayDone = s.last === todayStr();
      return s;
    },
    markToday: function () {
      var s = read("streak", { last: null, count: 0, best: 0 });
      var t = todayStr();
      var result = { changed: false, milestone: 0 };
      if (s.last === t) { s.todayDone = true; return { changed: false, milestone: 0, count: s.count, best: s.best, todayDone: true }; }
      if (s.last && daysBetween(s.last, t) === 1) s.count = (s.count || 0) + 1;
      else s.count = 1;
      s.last = t;
      s.best = Math.max(s.best || 0, s.count);
      write("streak", s);
      result.changed = true;
      result.count = s.count; result.best = s.best; result.todayDone = true;
      if (MILESTONES.indexOf(s.count) !== -1) result.milestone = s.count;
      return result;
    },
    milestones: MILESTONES,
    nextMilestone: function (count) {
      for (var i = 0; i < MILESTONES.length; i++) if (MILESTONES[i] > count) return MILESTONES[i];
      return null;
    },

    // ---- premium entitlement (architecture; real IAP set up later) ----
    isPremium: function () { return read("premium", false) === true; },
    setPremium: function (v) { write("premium", !!v); },

    // ---- reminders (cache; native is source of truth on device) ----
    getReminders: function () { return read("reminders", null); },
    setReminders: function (arr) { write("reminders", arr); },
  };

  window.Store = Store;
})();
