#!/bin/bash
set -e

DB="${MONGO_INITDB_DATABASE:-jogostabuleiro}"

for f in /docker-entrypoint-initdb.d/*.json; do
  [ -e "$f" ] || continue
  collection=$(basename "$f" .json)
  echo "[init] Importando $f -> ${DB}.${collection}"
  mongoimport --db "$DB" --collection "$collection" --file "$f" --jsonArray
done
