#!/usr/bin/env python3
"""Bhakti Daily — PRIVACY_POLICY.md (repo root) -> in-app copy (assets/web/data/privacy.js).

Google Play requires the privacy policy inside the app as well as in Play Console.
Run this whenever PRIVACY_POLICY.md changes:   python3 scripts/build_privacy.py
Handles the small markdown subset the policy uses: #/## headings, paragraphs,
"- " bullets, **bold**, _italic_ lines, ---, and bare https:// links.
"""
import html, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "..", "PRIVACY_POLICY.md")
OUT = os.path.join(HERE, "..", "app", "src", "main", "assets", "web", "data", "privacy.js")


def inline(text):
    t = html.escape(text, quote=False)
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"(https://[^\s<)]+)", r'<a href="\1">\1</a>', t)
    return t


def convert(md):
    out, para, items = [], [], []

    def flush():
        nonlocal para, items
        if para:
            out.append("<p>" + inline(" ".join(para)) + "</p>")
            para = []
        if items:
            out.append("<ul>" + "".join("<li>" + inline(i) + "</li>" for i in items) + "</ul>")
            items = []

    for raw in md.splitlines():
        line = raw.rstrip()
        s = line.strip()
        if not s:
            flush(); continue
        if s == "---":
            flush(); out.append("<hr>"); continue
        if s.startswith("## "):
            flush(); out.append("<h2>" + inline(s[3:]) + "</h2>"); continue
        if s.startswith("# "):
            flush(); out.append("<h1>" + inline(s[2:]) + "</h1>"); continue
        if s.startswith("- "):
            if para:
                flush()
            items.append(s[2:]); continue
        if items and raw.startswith("  "):          # wrapped bullet continuation
            items[-1] += " " + s; continue
        if s.startswith("_") and s.endswith("_") and len(s) > 2:
            flush(); out.append('<p class="pp-date"><i>' + inline(s[1:-1]) + "</i></p>"); continue
        if items:
            flush()
        para.append(s)
    flush()
    return "\n".join(out)


def main():
    with open(SRC, encoding="utf-8") as f:
        md = f.read()
    body = convert(md)
    js = ("/* AUTO-GENERATED from PRIVACY_POLICY.md by scripts/build_privacy.py — do not edit by hand. */\n"
          "window.BHAKTI_PRIVACY_HTML = " + json.dumps(body, ensure_ascii=False) + ";\n")
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(js)
    print("wrote", os.path.relpath(OUT), "(%d chars)" % len(body))


if __name__ == "__main__":
    main()
