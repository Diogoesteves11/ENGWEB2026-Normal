FROM mongo:7

# Tudo o que estiver em /docker-entrypoint-initdb.d/ corre na primeira
# inicializacao do volume (.sh, .js, .json sao consumidos pelo init.sh).
# Para re-executar a importacao: docker compose down -v && docker compose up -d --build
COPY . /docker-entrypoint-initdb.d/

EXPOSE 27017
