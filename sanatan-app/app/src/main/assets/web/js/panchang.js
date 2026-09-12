/* Bhakti Daily — Panchang engine (computed, not fabricated).
 * Tithi/Paksha astronomically compute hote hain (Schlyter Sun+Moon longitude).
 * Sunrise/Sunset chosen city ke lat/lon se (default Dilli). "~" = ganitiy anuman. */
(function () {
  "use strict";
  var D2R = Math.PI / 180, R2D = 180 / Math.PI;
  function sin(d) { return Math.sin(d * D2R); }
  function cos(d) { return Math.cos(d * D2R); }
  function rev(x) { return x - Math.floor(x / 360) * 360; }

  // days since 2000 Jan 0.0 (UT)
  function dayNumber(date) {
    var Y = date.getUTCFullYear(), M = date.getUTCMonth() + 1, Dd = date.getUTCDate();
    var h = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    var d = 367 * Y - Math.floor(7 * (Y + Math.floor((M + 9) / 12)) / 4)
      + Math.floor(275 * M / 9) + Dd - 730530;
    return d + h / 24;
  }

  function sunLongitude(d) {
    var w = 282.9404 + 4.70935e-5 * d;
    var e = 0.016709 - 1.151e-9 * d;
    var M = rev(356.0470 + 0.9856002585 * d);
    var E = M + e * R2D * sin(M) * (1 + e * cos(M));
    var xv = cos(E) - e, yv = Math.sqrt(1 - e * e) * sin(E);
    var v = rev(Math.atan2(yv, xv) * R2D);
    return { lon: rev(v + w), M: M, w: w };
  }

  function moonLongitude(d, sun) {
    var N = 125.1228 - 0.0529538083 * d;
    var i = 5.1454;
    var w = 318.0634 + 0.1643573223 * d;
    var e = 0.054900;
    var M = rev(115.3654 + 13.0649929509 * d);
    var E = M + e * R2D * sin(M) * (1 + e * cos(M));
    E = E - (E - e * R2D * sin(E) - M) / (1 - e * cos(E));
    var x = cos(E) - e, y = Math.sqrt(1 - e * e) * sin(E);
    var v = rev(Math.atan2(y, x) * R2D);
    var lon = v + w;
    var xe = cos(N) * cos(lon) - sin(N) * sin(lon) * cos(i);
    var ye = sin(N) * cos(lon) + cos(N) * sin(lon) * cos(i);
    var lonecl = rev(Math.atan2(ye, xe) * R2D);
    // main perturbations
    var Ls = rev(sun.w + sun.M);
    var Lm = rev(N + w + M);
    var Dm = rev(Lm - Ls);
    var F = rev(Lm - N);
    var Ms = sun.M, Mm = M;
    lonecl += -1.274 * sin(Mm - 2 * Dm)
      + 0.658 * sin(2 * Dm)
      - 0.186 * sin(Ms)
      - 0.059 * sin(2 * Mm - 2 * Dm)
      - 0.057 * sin(Mm - 2 * Dm + Ms)
      + 0.053 * sin(Mm + 2 * Dm)
      + 0.046 * sin(2 * Dm - Ms)
      + 0.041 * sin(Mm - Ms)
      - 0.035 * sin(Dm)
      - 0.031 * sin(Mm + Ms)
      - 0.015 * sin(2 * F - 2 * Dm)
      + 0.011 * sin(Mm - 4 * Dm);
    return rev(lonecl);
  }

  var TITHI_NAMES = ["प्रतिपदा", "द्वितीया", "तृतीया", "चतुर्थी", "पंचमी", "षष्ठी", "सप्तमी",
    "अष्टमी", "नवमी", "दशमी", "एकादशी", "द्वादशी", "त्रयोदशी", "चतुर्दशी", "पूर्णिमा"];
  var TITHI_NAMES_K = TITHI_NAMES.slice(0, 14).concat(["अमावस्या"]);

  function tithi(date) {
    var d = dayNumber(date);
    var sun = sunLongitude(d);
    var moon = moonLongitude(d, sun);
    var diff = rev(moon - sun.lon);
    var idx = Math.floor(diff / 12); // 0..29
    var paksha = idx < 15 ? "शुक्ल" : "कृष्ण";
    var n = idx % 15;
    var name = idx < 15 ? TITHI_NAMES[n] : TITHI_NAMES_K[n];
    // moon phase %
    var phase = diff / 360;
    return { index: idx, paksha: paksha, name: name, num: n + 1, phase: phase };
  }

  function moonEmoji(phase) {
    if (phase < 0.03 || phase > 0.97) return "🌑";
    if (phase < 0.22) return "🌒";
    if (phase < 0.28) return "🌓";
    if (phase < 0.47) return "🌔";
    if (phase < 0.53) return "🌕";
    if (phase < 0.72) return "🌖";
    if (phase < 0.78) return "🌗";
    return "🌘";
  }

  // ---- Sunrise / Sunset (classic sunrise equation) ----
  var CITIES = {
    delhi: { name: "दिल्ली", lat: 28.61, lon: 77.21 },
    mumbai: { name: "मुंबई", lat: 19.07, lon: 72.87 },
    kolkata: { name: "कोलकाता", lat: 22.57, lon: 88.36 },
    chennai: { name: "चेन्नई", lat: 13.08, lon: 80.27 },
    bengaluru: { name: "बेंगलुरु", lat: 12.97, lon: 77.59 },
    hyderabad: { name: "हैदराबाद", lat: 17.38, lon: 78.49 },
    varanasi: { name: "वाराणसी", lat: 25.32, lon: 82.97 },
    jaipur: { name: "जयपुर", lat: 26.91, lon: 75.79 },
    ahmedabad: { name: "अहमदाबाद", lat: 23.03, lon: 72.58 },
    lucknow: { name: "लखनऊ", lat: 26.85, lon: 80.95 },
    patna: { name: "पटना", lat: 25.59, lon: 85.14 }
  };
  var TZ = 5.5; // IST

  function calcSun(date, lat, lon, rising) {
    var N = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
      - Date.UTC(date.getFullYear(), 0, 0)) / 86400000);
    var zenith = 90.833;
    var lngHour = lon / 15;
    var t = N + ((rising ? 6 : 18) - lngHour) / 24;
    var M = 0.9856 * t - 3.289;
    var L = rev(M + 1.916 * sin(M) + 0.020 * sin(2 * M) + 282.634);
    var RA = rev(Math.atan(0.91764 * Math.tan(L * D2R)) * R2D);
    RA += (Math.floor(L / 90) * 90) - (Math.floor(RA / 90) * 90);
    RA /= 15;
    var sinDec = 0.39782 * sin(L), cosDec = cos(Math.asin(sinDec) * R2D);
    var cosH = (cos(zenith) - sinDec * sin(lat)) / (cosDec * cos(lat));
    if (cosH > 1 || cosH < -1) return null;
    var H = rising ? 360 - Math.acos(cosH) * R2D : Math.acos(cosH) * R2D;
    H /= 15;
    var T = H + RA - 0.06571 * t - 6.622;
    var UT = rev((T - lngHour) * 15) / 15;
    var local = UT + TZ;
    local = (local + 24) % 24;
    var hh = Math.floor(local), mm = Math.round((local - hh) * 60);
    if (mm === 60) { mm = 0; hh = (hh + 1) % 24; }
    return (hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm;
  }

  function sunTimes(date, cityKey) {
    var c = CITIES[cityKey] || CITIES.delhi;
    return { city: c.name, sunrise: calcSun(date, c.lat, c.lon, true), sunset: calcSun(date, c.lat, c.lon, false) };
  }

  function vikramSamvat(date) {
    var y = date.getFullYear();
    return (date.getMonth() >= 3 ? y + 57 : y + 56);
  }

  window.Panchang = {
    tithi: tithi, moonEmoji: moonEmoji, sunTimes: sunTimes,
    vikramSamvat: vikramSamvat, cities: CITIES
  };
})();
