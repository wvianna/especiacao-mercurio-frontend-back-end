#!/usr/bin/env bash
# Compila a monografia: pdflatex -> bibtex -> pdflatex -> pdflatex
# (sem latexmk no ambiente). Uso: ./build.sh
set -e
cd "$(dirname "$0")"

echo "[1/4] pdflatex (1a passagem)"
pdflatex -interaction=nonstopmode -halt-on-error main.tex >/dev/null

echo "[2/4] bibtex"
bibtex main >/dev/null || echo "  aviso: bibtex com saida nao vazia (ver log)"

echo "[3/4] pdflatex (2a passagem)"
pdflatex -interaction=nonstopmode -halt-on-error main.tex >/dev/null

echo "[4/4] pdflatex (3a passagem)"
pdflatex -interaction=nonstopmode -halt-on-error main.tex >/dev/null

echo "OK: monografia/main.pdf gerado."
