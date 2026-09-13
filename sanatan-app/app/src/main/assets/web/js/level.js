/* Bhakti Daily — Bhakti Level / Aura (gamification).
 * Jaap + streak + reading se XP; level up: नया भक्त -> ऋषि. Flex-worthy.
 * Pure computation over Store (no new data collected). ES5. */
(function () {
  "use strict";

  var LEVELS = [
    { title: "नया भक्त",  emoji: "🪔", min: 0 },
    { title: "भक्त",      emoji: "🙏", min: 100 },
    { title: "साधक",      emoji: "📿", min: 300 },
    { title: "उपासक",     emoji: "🕉️", min: 700 },
    { title: "साधु",      emoji: "🧘", min: 1500 },
    { title: "योगी",      emoji: "✨", min: 3000 },
    { title: "महायोगी",   emoji: "🌟", min: 6000 },
    { title: "ऋषि",       emoji: "🔱", min: 12000 }
  ];

  function xp() {
    var pts = 0;
    try {
      var j = Store.getJaap();                    // { total, rounds }
      var s = Store.getStreak();                  // { count, best }
      pts += (j.total || 0) * 1;                  // har jaap = 1
      pts += (j.rounds || 0) * 10;                // har mala = 10
      pts += (s.best || 0) * 15;                  // best streak day = 15
      pts += (s.count || 0) * 5;                  // current streak = 5
      pts += (Store.getFavs().length || 0) * 5;
      pts += (Store.getRecents().length || 0) * 2;
    } catch (e) {}
    return Math.round(pts);
  }

  function levelForXp(x) {
    var idx = 0;
    for (var i = 0; i < LEVELS.length; i++) if (x >= LEVELS[i].min) idx = i;
    return idx;
  }

  var Level = {
    levels: LEVELS,
    forUser: function () {
      var x = xp();
      var idx = levelForXp(x);
      var cur = LEVELS[idx];
      var next = LEVELS[idx + 1] || null;
      var base = cur.min;
      var span = next ? (next.min - base) : 1;
      var prog = next ? Math.max(0, Math.min(100, Math.round(((x - base) / span) * 100))) : 100;
      return {
        xp: x, index: idx,
        title: cur.title, emoji: cur.emoji,
        next: next ? next.title : null,
        nextEmoji: next ? next.emoji : null,
        nextAt: next ? next.min : null,
        toNext: next ? Math.max(0, next.min - x) : 0,
        progress: prog,
        isMax: !next
      };
    }
  };

  window.Level = Level;
})();
