/* Bhakti Daily — Punya engine (retention + rewarded-ad value).
 *
 * "पुण्य अंक" = sirf app ke andar ke virtual points (Level badhate hain).
 * AdMob rewarded policy: inaam app ke andar hi, kabhi paisa/cash/physical cheez nahi,
 * ad dekhne se PEHLE saaf likha ho ki kya milega, aur ad user ke tap par hi chale.
 *
 * Features:
 *   - Dainik punya: 7-din ka chakra (10..108), 1 din ki chhoot (grace) ke saath
 *   - Rewarded: aaj ka punya dugna (1/din), mala ke baad punya dugna (5/din),
 *     premium status designs 24 ghante unlock, toot-ti streak bachao (streak rakshak)
 * ES5 syntax. */
(function () {
  "use strict";

  var DAILY = [10, 15, 20, 30, 40, 50, 108];   // din 7 = 108 (shubh ank)
  var JAAP_2X_PER_DAY = 5;

  function today() { return Store.todayStr(); }
  function shift(dateStr, days) {
    var p = dateStr.split("-"), d = new Date(+p[0], +p[1] - 1, +p[2]);
    d.setDate(d.getDate() + days);
    return Store.todayStr(d);
  }
  function between(a, b) {           // b - a in whole days ("YYYY-MM-DD")
    var pa = a.split("-"), pb = b.split("-");
    return Math.round((Date.UTC(+pb[0], +pb[1] - 1, +pb[2]) - Date.UTC(+pa[0], +pa[1] - 1, +pa[2])) / 86400000);
  }
  function track(n, p) { try { Analytics.track(n, p || {}); } catch (e) {} }

  var Punya = {
    cycle: DAILY,

    // ---- bonus points (feed Level) ----
    bonus: function () { return Store.get("punya_bonus", 0) | 0; },
    add: function (n, reason) {
      n = Math.max(0, Math.round(+n || 0));
      var t = this.bonus() + n;
      Store.set("punya_bonus", t);
      track("punya_earned", { n: n, reason: reason || "" });
      return t;
    },

    // ---- daily check-in (7-day cycle, 1-day grace) ----
    daily: function () {
      var d = Store.get("daily", { last: null, day: 0, doubled: null });
      var t = today(), claimed = d.last === t, next;
      if (claimed) next = d.day || 1;
      else if (!d.last) next = 1;
      else {
        var gap = between(d.last, t);
        next = (gap === 1 || gap === 2) ? ((d.day || 0) % 7) + 1 : 1;   // gap 2 = 1 din ki chhoot
      }
      return {
        claimedToday: claimed,
        day: next,
        reward: DAILY[next - 1],
        doubledToday: d.doubled === t,
        cycle: DAILY
      };
    },
    claimDaily: function () {
      var s = this.daily();
      if (s.claimedToday) return { ok: false, reward: 0, day: s.day };
      var d = Store.get("daily", { last: null, day: 0, doubled: null });
      d.last = today(); d.day = s.day;
      Store.set("daily", d);
      this.add(s.reward, "daily_d" + s.day);
      return { ok: true, reward: s.reward, day: s.day };
    },
    doubleDaily: function () {
      var s = this.daily();
      if (!s.claimedToday || s.doubledToday) return 0;
      var d = Store.get("daily", {});
      d.doubled = today();
      Store.set("daily", d);
      this.add(s.reward, "daily_2x");
      return s.reward;
    },

    // ---- jaap mala 2x (rewarded) ----
    jaap2xLeft: function () {
      var j = Store.get("jaap2x", { date: null, n: 0 });
      return j.date === today() ? Math.max(0, JAAP_2X_PER_DAY - j.n) : JAAP_2X_PER_DAY;
    },
    jaap2x: function (amount) {
      if (this.jaap2xLeft() <= 0) return 0;
      var j = Store.get("jaap2x", { date: null, n: 0 });
      if (j.date !== today()) j = { date: today(), n: 0 };
      j.n++; Store.set("jaap2x", j);
      this.add(amount, "jaap_2x");
      return amount;
    },

    // ---- premium status designs (24h unlock via rewarded) ----
    premiumStatusUnlocked: function () {
      return Store.isPremium() || Date.now() < (Store.get("prem_status_until", 0) || 0);
    },
    premiumStatusLeftHrs: function () {
      var ms = (Store.get("prem_status_until", 0) || 0) - Date.now();
      return ms > 0 ? Math.ceil(ms / 3600000) : 0;
    },
    unlockPremiumStatus: function (hours) {
      Store.set("prem_status_until", Date.now() + (hours || 24) * 3600000);
      track("premium_status_unlocked", { hours: hours || 24 });
    },

    // ---- streak rakshak: kal chhoot gaya ho to 1 ad se streak bachao ----
    streakAtRisk: function () {
      var s = Store.get("streak", { last: null, count: 0, best: 0 });
      if (!s.last || (s.count | 0) < 2) return null;
      if (between(s.last, today()) !== 2) return null;           // theek 1 din chhoota
      if (Store.get("streak_offer", "") === today()) return null; // aaj ek hi baar poochho
      return { count: s.count };
    },
    markStreakOffered: function () { Store.set("streak_offer", today()); },
    repairStreak: function () {
      var s = Store.get("streak", { last: null, count: 0, best: 0 });
      s.last = shift(today(), -1);                                 // jaise kal bhakti ki ho
      Store.set("streak", s);
      track("streak_repaired", { count: s.count });
      return s.count;
    }
  };

  window.Punya = Punya;
})();
