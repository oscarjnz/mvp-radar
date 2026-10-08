"""Auditoria de texto visible: lista cadenas y texto JSX con dos puntos, punto y coma, 'ano', guiones largos
y verbos repetidos para jonrones. Uso: python scripts/audit_text.py [--hr]
"""
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAT = re.compile(r"""(?:'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`)""")
FILES = sorted(glob.glob(os.path.join(ROOT, "web", "src", "**", "*.ts*"), recursive=True)) + [os.path.join(ROOT, "scripts", "narratives.py")]


def short(path):
    return os.path.relpath(path, ROOT).replace("\\", "/")


def main():
    mode_hr = "--hr" in sys.argv
    rows = []
    for f in FILES:
        for i, line in enumerate(open(f, encoding="utf-8").read().split("\n"), 1):
            cands = []
            for m in PAT.finditer(line):
                s = m.group(1) or m.group(2) or m.group(3) or ""
                if len(s) > 14 and " " in s and not s.startswith(("http", "var(", "M ", "translate", "(prefers")):
                    cands.append(s)
            for m in re.finditer(r">([^<>{}]{14,})<", line):
                cands.append("JSX " + m.group(1))
            for s in cands:
                if mode_hr:
                    if re.search(r"\b(hizo|hacer|hace|hicieron)\b[^.]{0,40}(jonr|cuadrang|HR)", s, re.I):
                        rows.append((short(f), i, s))
                elif re.search(r"[A-Za-zÁ-úñ\)\d]\s?[:;]\s", s) or re.search(r"[–—]", s):
                    rows.append((short(f), i, s))
    print(len(rows))
    for r in rows:
        print(f"{r[0].split('/')[-1]}:{r[1]} {r[2][:150]}")


if __name__ == "__main__":
    main()
