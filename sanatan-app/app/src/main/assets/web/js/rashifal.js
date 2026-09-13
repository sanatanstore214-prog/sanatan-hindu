/* Bhakti Daily — Rashifal engine.
 * Deterministic daily guidance per (date, rashi). Not a claimed prediction —
 * prerak margdarshan. "Upay" app ke ready paath se judta hai.
 * ES5 syntax (var/function). */
(function () {
  "use strict";
  var R = window.BHAKTI_RASHI || { list: [] };

  function today() {
    try { return window.Store ? Store.todayStr() : new Date().toISOString().slice(0, 10); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  // simple stable string hash
  function seed(str) {
    var s = 0;
    for (var i = 0; i < str.length; i++) s = (s * 31 + str.charCodeAt(i)) >>> 0;
    return s;
  }
  function pick(arr, s, salt) { return arr[(s + salt) % arr.length]; }

  // find a ready paath title by id (for the upay line + link)
  function paath(id) {
    try {
      var items = (window.BHAKTI_DATA || {}).items || [];
      for (var i = 0; i < items.length; i++) if (items[i].id === id) return items[i];
    } catch (e) {}
    return null;
  }

  var Rashifal = {
    list: R.list,
    byKey: function (k) { for (var i = 0; i < R.list.length; i++) if (R.list[i].key === k) return R.list[i]; return null; },
    index: function (k) { for (var i = 0; i < R.list.length; i++) if (R.list[i].key === k) return i; return -1; },

    // forToday(rashiIndex) -> full daily card object
    forToday: function (ri, dateStr) {
      ri = ri | 0;
      var rashi = R.list[ri]; if (!rashi) return null;
      var d = dateStr || today();
      var s = seed(d + "#" + rashi.key);

      var color = pick(R.colors, s, 3);
      var ank = ((s + 7) % 9) + 1;                 // 1..9
      var disha = pick(R.disha, s, 5);
      var stars = 3 + ((s + ri) % 3);               // 3..5 shubh stars
      // upay: rotate between the rashi's 2 paath by day
      var upayId = rashi.upay[(s + (ri % 2)) % rashi.upay.length];
      var it = paath(upayId);
      var upayName = it ? it.title : "हनुमान चालीसा";
      var upayText = "आज " + upayName + " " + (it && it.type === "mantra" ? "का जाप करें" : "का पाठ करें") +
                     " — " + rashi.graha + " शुभ फल देंगे।";

      return {
        rashi: rashi,
        date: d,
        saamanya: pick(R.saamanya, s, 1),
        prem: pick(R.prem, s, 2),
        karya: pick(R.karya, s, 4),
        swasthya: pick(R.swasthya, s, 6),
        color: color,
        ank: ank,
        disha: disha,
        stars: stars,
        upayId: upayId,
        upayName: upayName,
        upayText: upayText
      };
    }
  };

  window.Rashifal = Rashifal;
})();
