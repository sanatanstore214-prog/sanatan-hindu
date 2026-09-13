/* Bhakti Daily — Family / Group Jaap (Firestore REST).
 *
 * Ek group banao ya code se join karo; sab members ka jaap ek saath jud kar
 * ek "samuhik jaap" total banata hai + leaderboard. Data ek FREE Firebase
 * (Firestore) project me jata hai — config data/group-config.js me.
 *
 * Network calls Bridge.http se hote hain (native HTTP => WebView CORS bypass).
 * Bina config ke sab kuch gracefully "setup pending" dikhata hai.
 *
 * ES5 syntax rakha hai (var/function); Promise use kiya hai (Android 6+ WebView
 * = Chrome 44+, Promise supported). Koi arrow-fn / template-literal nahi.
 */
(function () {
  "use strict";

  function cfg() { return window.BHAKTI_GROUP_CONFIG || { projectId: "", apiKey: "" }; }
  function configured() { var c = cfg(); return !!(c.projectId && c.apiKey); }

  function base() {
    return "https://firestore.googleapis.com/v1/projects/" + cfg().projectId +
           "/databases/(default)/documents";
  }
  function keyParam() { return "key=" + encodeURIComponent(cfg().apiKey); }
  function docPath(rel) { return "projects/" + cfg().projectId + "/databases/(default)/documents/" + rel; }

  // ---- Firestore value helpers ----
  function sV(s) { return { stringValue: String(s == null ? "" : s) }; }
  function iV(n) { return { integerValue: String(Math.round(+n || 0)) }; }
  function readField(doc, key) {
    if (!doc || !doc.fields || !doc.fields[key]) return null;
    var f = doc.fields[key];
    if (f.stringValue != null) return f.stringValue;
    if (f.integerValue != null) return parseInt(f.integerValue, 10);
    if (f.doubleValue != null) return +f.doubleValue;
    return null;
  }
  function parse(text) { try { return JSON.parse(text || "{}"); } catch (e) { return {}; } }

  // ---- code generator (no ambiguous chars) ----
  function newCode() {
    var cs = "ABCDEFGHJKMNPQRSTUVWXYZ23456789", s = "";
    for (var i = 0; i < 6; i++) s += cs.charAt(Math.floor(Math.random() * cs.length));
    return s;
  }
  function normCode(c) { return String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8); }

  var Group = {
    isConfigured: configured,

    // Create a new group. Retries with a fresh code on 409 (collision).
    // resolves { ok, code, name } or { ok:false, error }
    createGroup: function (name, myName, _tries) {
      if (!configured()) return Promise.resolve({ ok: false, error: "not_configured" });
      _tries = _tries || 0;
      if (_tries > 4) return Promise.resolve({ ok: false, error: "code_collision" });
      var code = newCode();
      var url = base() + "/groups?documentId=" + code + "&" + keyParam();
      var body = JSON.stringify({ fields: {
        name: sV(String(name || "Bhakti Group").slice(0, 40)),
        total: iV(0),
        created: iV(Date.now())
      }});
      var self = this;
      return Bridge.http("POST", url, body).then(function (r) {
        if (r.status === 409) return self.createGroup(name, myName, _tries + 1); // code taken
        if (r.status < 200 || r.status >= 300) return { ok: false, error: "http_" + r.status, detail: r.text };
        // register self as first member
        return self._putMember(code, myName).then(function () {
          Store.setGroup({ code: code, name: String(name || "Bhakti Group").slice(0, 40), myName: myName });
          Store.setGroupSynced(0);
          return { ok: true, code: code, name: String(name || "Bhakti Group").slice(0, 40) };
        });
      });
    },

    // Join an existing group by code. resolves { ok, code, name } or { ok:false, error }
    joinGroup: function (code, myName) {
      if (!configured()) return Promise.resolve({ ok: false, error: "not_configured" });
      code = normCode(code);
      if (code.length < 4) return Promise.resolve({ ok: false, error: "bad_code" });
      var url = base() + "/groups/" + code + "?" + keyParam();
      var self = this;
      return Bridge.http("GET", url).then(function (r) {
        if (r.status === 404) return { ok: false, error: "not_found" };
        if (r.status < 200 || r.status >= 300) return { ok: false, error: "http_" + r.status };
        var doc = parse(r.text);
        var gname = readField(doc, "name") || "Bhakti Group";
        return self._putMember(code, myName).then(function () {
          Store.setGroup({ code: code, name: gname, myName: myName });
          Store.setGroupSynced(0);
          return { ok: true, code: code, name: gname };
        });
      });
    },

    // Create/merge the member doc (name only; count via transform on contribute).
    _putMember: function (code, myName) {
      var uid = Store.getUid();
      var url = base() + "/groups/" + code + "/members/" + uid +
                "?updateMask.fieldPaths=name&updateMask.fieldPaths=updated&" + keyParam();
      var body = JSON.stringify({ fields: {
        name: sV(String(myName || "Bhakt").slice(0, 24)),
        updated: iV(Date.now())
      }});
      return Bridge.http("PATCH", url, body);
    },

    // Contribute `delta` jaaps: increment group.total AND member.count atomically.
    // resolves { ok, total } or { ok:false }
    contribute: function (delta) {
      if (!configured()) return Promise.resolve({ ok: false, error: "not_configured" });
      var g = Store.getGroup();
      if (!g) return Promise.resolve({ ok: false, error: "no_group" });
      delta = Math.round(+delta || 0);
      if (delta <= 0) return Promise.resolve({ ok: true, total: null, skipped: true });
      var uid = Store.getUid();
      var url = base() + ":commit?" + keyParam();
      var body = JSON.stringify({ writes: [
        { // group total += delta (also refresh 'updated')
          update: { name: docPath("groups/" + g.code), fields: { updated: iV(Date.now()) } },
          updateMask: { fieldPaths: ["updated"] },
          updateTransforms: [ { fieldPath: "total", increment: iV(delta) } ]
        },
        { // member count += delta (also refresh name + updated)
          update: { name: docPath("groups/" + g.code + "/members/" + uid),
                    fields: { name: sV(g.myName || "Bhakt"), updated: iV(Date.now()) } },
          updateMask: { fieldPaths: ["name", "updated"] },
          updateTransforms: [ { fieldPath: "count", increment: iV(delta) } ]
        }
      ]});
      return Bridge.http("POST", url, body).then(function (r) {
        if (r.status < 200 || r.status >= 300) return { ok: false, error: "http_" + r.status, detail: r.text };
        return { ok: true };
      });
    },

    // Read group summary { name, total } or null.
    fetchGroup: function (code) {
      if (!configured()) return Promise.resolve(null);
      code = normCode(code);
      var url = base() + "/groups/" + code + "?" + keyParam();
      return Bridge.http("GET", url).then(function (r) {
        if (r.status < 200 || r.status >= 300) return null;
        var doc = parse(r.text);
        return { code: code, name: readField(doc, "name") || "Bhakti Group", total: readField(doc, "total") || 0 };
      });
    },

    // Leaderboard: list members, sorted by count desc (client-side). resolves array.
    leaderboard: function (code) {
      if (!configured()) return Promise.resolve([]);
      code = normCode(code);
      var url = base() + "/groups/" + code + "/members?pageSize=100&" + keyParam();
      var myUid = Store.getUid();
      return Bridge.http("GET", url).then(function (r) {
        if (r.status < 200 || r.status >= 300) return [];
        var data = parse(r.text), docs = data.documents || [], out = [];
        for (var i = 0; i < docs.length; i++) {
          var d = docs[i], nm = d.name || "", id = nm.slice(nm.lastIndexOf("/") + 1);
          out.push({
            uid: id,
            name: readField(d, "name") || "Bhakt",
            count: readField(d, "count") || 0,
            me: id === myUid
          });
        }
        out.sort(function (a, b) { return b.count - a.count; });
        return out;
      });
    }
  };

  window.Group = Group;
})();
