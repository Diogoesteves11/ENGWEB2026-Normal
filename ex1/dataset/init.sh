#!/bin/bash
# Importa qualquer ficheiro .json deste directorio para o Mongo.
# Cada ficheiro vira uma coleccao com o nome do ficheiro (sem .json).
#
# Por omissao usa --jsonArray (formato [{...}, {...}]).
# Se o dataset for um object-map ({"k1": {...}, "k2": {...}}), converter
# primeiro com o script em ex1/scripts/import.js a partir do host.
set -e

DB="${MONGO_INITDB_DATABASE:-engweb}"

for f in /docker-entrypoint-initdb.d/*.json; do
  [ -e "$f" ] || continue
  collection=$(basename "$f" .json)
  echo "[init] Importando $f -> ${DB}.${collection}"
  mongoimport --db "$DB" --collection "$collection" --file "$f" --jsonArray
done
