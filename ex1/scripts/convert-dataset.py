#!/usr/bin/env python3
"""
Converte dataset JSON para formato correto (array de documentos).

Uso (a partir de /ex1):
    python scripts/convert-dataset.py dataset/<ficheiro>.json

Lida com:
  - Objeto mapa: { "k1": {...}, "k2": {...} } -> [doc1, doc2, ...]
  - Array: [...] -> [...] (passthrough)

Output:
  dataset/<ficheiro>-processed.json
"""

import json
import sys
from pathlib import Path

def main():
    if len(sys.argv) < 2:
        print("Erro: falta o caminho do dataset")
        print("Uso: python scripts/convert-dataset.py dataset/<ficheiro>.json")
        sys.exit(1)

    input_path = sys.argv[1]

    # Valida ficheiro
    if not Path(input_path).exists():
        print(f"Erro: ficheiro nao existe: {input_path}")
        sys.exit(1)

    # Le JSON
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Erro a fazer parse do JSON: {e}")
        sys.exit(1)

    # Detecta e converte
    if isinstance(data, list):
        docs = data
        tipo = "array"
    elif isinstance(data, dict):
        docs = list(data.values())
        tipo = "object-map"
    else:
        print(f"Erro: formato nao reconhecido (esperado array ou object)")
        sys.exit(1)

    # Remove Nones/nulls (opcional, comentar se nao quiser)
    # docs = [d for d in docs if d is not None]

    # Gera nome de output
    input_stem = Path(input_path).stem
    output_path = Path(input_path).parent / f"{input_stem}-processed.json"

    # Escreve output
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(docs, f, ensure_ascii=False, indent=2)
    except IOError as e:
        print(f"Erro a escrever output: {e}")
        sys.exit(1)

    # Confirma
    print(f"[INFO] Lido {input_path} ({len(docs)} documentos, {tipo})")
    print(f"[INFO] Escrito {output_path}")

if __name__ == '__main__':
    main()
