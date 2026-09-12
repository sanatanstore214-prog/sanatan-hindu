/* Bhakti Daily — deterministic daily recommendation engine (data-driven).
 * Priority: aaj/ kal ka tyohar (agar related content ready) -> vaar-devta ->
 * time-of-day (subah paath/mantra, shaam aarti). Favorites/recents secondary. */
(function () {
  "use strict";
  var D = window.BHAKTI_DATA || { items: [], festivals: [], weekday: {} };
  var byId = {};
  for (var i = 0; i < D.items.length; i++) byId[D.items[i].id] = D.items[i];
  function ready(id) { var it = byId[id]; return (it && it.status === "ready") ? it : null; }
  function parseDate(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function startToday() { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }

  function upcomingFestival() {
    var t = startToday(), best = null;
    for (var i = 0; i < D.festivals.length; i++) {
      var f = D.festivals[i], d = parseDate(f.date);
      if (d >= t && (!best || d < best._d)) { best = f; best._d = d; }
    }
    if (best) best._days = Math.round((best._d - t) / 86400000);
    return best;
  }

  function firstReady(ids) {
    if (!ids) return null;
    for (var i = 0; i < ids.length; i++) { var it = ready(ids[i]); if (it) return it; }
    return null;
  }

  function weekdayItem() {
    var w = D.weekday[String(new Date().getDay())];
    return (w && ready(w.item)) || ready("hanuman-chalisa") || D.items[0];
  }

  // Primary recommendation for "aaj ki bhakti"
  function today() {
    var uf = upcomingFestival();
    // festival aaj ya kal, aur related ready content ho
    if (uf && uf._days <= 1 && uf.related && uf.related.length) {
      var fi = firstReady(uf.related);
      if (fi) return { item: fi, reason: (uf._days === 0 ? "आज " : "कल ") + uf.name + " — विशेष भक्ति", festival: uf };
    }
    var w = D.weekday[String(new Date().getDay())];
    var wi = weekdayItem();
    // time-of-day nudge: shaam ko us devta ki aarti ho to prefer
    var h = new Date().getHours();
    if (h >= 17 && w) {
      for (var i = 0; i < D.items.length; i++) {
        var it = D.items[i];
        if (it.status === "ready" && it.type === "aarti" && it.deity === w.deity) { wi = it; break; }
      }
    }
    return { item: wi, reason: (w ? w.label : "आज का पाठ"), festival: uf && uf._days <= 7 ? uf : null };
  }

  // Secondary suggestions (dedup, ready only)
  function suggestions(n) {
    n = n || 4;
    var seen = {}, out = [];
    function push(it) { if (it && it.status === "ready" && !seen[it.id]) { seen[it.id] = 1; out.push(it); } }
    push(today().item);
    var favs = window.Store ? window.Store.getFavs() : [];
    for (var a = 0; a < favs.length && out.length < n; a++) push(byId[favs[a]]);
    var rec = window.Store ? window.Store.getRecents() : [];
    for (var b = 0; b < rec.length && out.length < n; b++) push(byId[rec[b]]);
    for (var c = 0; c < D.items.length && out.length < n; c++) push(D.items[c]);
    return out.slice(0, n);
  }

  window.Recommend = { today: today, suggestions: suggestions, upcomingFestival: upcomingFestival, weekdayItem: weekdayItem, ready: ready };
})();
