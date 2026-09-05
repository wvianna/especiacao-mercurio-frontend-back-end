#!/usr/bin/env bash
# Compila o artigo: pdflatex -> bibtex -> pdflatex -> pdflatex
set -e
cd "$(dirname "$0")"
pdflatex -interaction=nonstopmode -halt-on-error main.tex >/dev/null
bibtex main >/dev/null || true
pdflatex -interaction=nonstopmode -halt-on-error main.tex >/dev/null
pdflatex -interaction=nonstopmode -halt-on-error main.tex >/dev/null
echo "OK: artigo/main.pdf gerado."
