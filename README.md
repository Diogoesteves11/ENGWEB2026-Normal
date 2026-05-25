# EngWeb 2026 - Exame de epoca normal

**Aluno:** Diogo Jose Fernandes Esteves
**UC:** Engenharia Web (3o ano LEI, UMinho)
**Data:** 25 de Maio de 2026

Resolucao dos dois exercicios:

- **ex1** - API de dados sobre Jogos de Tabuleiro
- **ex2** - "A Minha Lista de Leituras" (engenharia reversa a partir de uma
  interface Vue.js)

---

## TL;DR - executar tudo

Pre-requisito unico: **Docker + docker compose**.

```bash
docker compose up -d --build
```

Aguardar ~10 segundos pela inicializacao do Mongo. URLs disponiveis:

| Servico             | URL                                           |
|---------------------|-----------------------------------------------|
| ex1 API             | http://localhost:17000                        |
| ex1 Swagger UI      | http://localhost:17000/api-docs               |
| ex2 API             | http://localhost:19020/api/livros             |
| ex2 Frontend (UI)   | http://localhost:19021                        |

Para forcar reset completo (limpa o volume Mongo e re-importa/re-seeda):

```bash
docker compose down -v && docker compose up -d --build
```

---

## Estrutura do repositorio

```
.
|-- docker-compose.yml         # Orquestra mongodb + 3 servicos (data-api, api-livros, web-livros)
|-- README.md                  # Este ficheiro
|
|-- ex1/                       # API de dados sobre Jogos de Tabuleiro (porta 17000)
|   |-- Dockerfile             # Imagem Node 20-alpine da API
|   |-- package.json
|   |-- app.js + bin/www
|   |-- models/jogo.js         # Mongoose model (collection: jogos)
|   |-- routes/index.js        # Implementacao de todas as rotas
|   |-- swagger.js             # Carrega spec OpenAPI a partir de YAML
|   |-- swagger.yml            # Spec OpenAPI 3.0 da API
|   |-- queries.txt            # 5 queries em mongosh (resposta ao 1.2)
|   |-- dataset/
|   |   |-- Dockerfile         # Imagem Mongo 7 com dataset baked-in
|   |   |-- init.sh            # mongoimport automatico no 1o arranque
|   |   `-- jogos.json         # Dataset (array de 27 jogos)
|   `-- scripts/               # Fallback de import sem Docker
|       |-- import.js          # Importacao via Mongoose
|       `-- convert-dataset.py # Conversao object-map -> array (nao necessario neste dataset)
|
|-- ex2/
|   |-- api/                   # API Express + Mongoose (porta 19020)
|   |   |-- Dockerfile
|   |   |-- package.json
|   |   |-- app.js + bin/www
|   |   |-- models/livro.js    # Mongoose model (collection: livros)
|   |   |-- routes/livros.js   # Endpoints /api/livros
|   |   `-- dataset/livros.json  # 7 livros para seed inicial
|   `-- web/                   # Nginx a servir o frontend (porta 19021)
|       |-- Dockerfile
|       `-- index.html         # Interface Vue.js + Axios (fornecida pelo enunciado)
|
`-- engweb2026_normal.pdf      # Enunciado original (referencia)
```

---

## Servicos no docker-compose

| Servico       | Container    | Imagem base       | Porta interna | Mapping host    | Notas                                                                  |
|---------------|--------------|-------------------|---------------|-----------------|------------------------------------------------------------------------|
| `mongodb`     | `mongodb`    | `mongo:7`         | 27017         | **(sem ports)** | NAO exposto ao exterior (requisito ex2). So acessivel na rede interna. |
| `data-api`    | `data-api`   | `node:20-alpine`  | 17000         | `17000:17000`   | ex1 - Jogos. Faz `mongodb://mongodb:27017/jogostabuleiro`              |
| `api-livros`  | `api-livros` | `node:20-alpine`  | 19020         | `19020:19020`   | ex2 API - Livros. Faz `mongodb://mongodb:27017/biblioteca`             |
| `web-livros`  | `web-livros` | `nginx:alpine`    | 80            | `19021:80`      | ex2 Frontend. Serve `ex2/web/index.html`                               |

Rede docker bridge `engweb` liga os 4 containers; resolvem-se uns aos
outros pelos respectivos nomes de container.

Para debug do Mongo (esta fechado por fora):

```bash
docker compose exec mongodb mongosh                # qualquer BD
docker compose exec mongodb mongosh jogostabuleiro # entrar ja na BD do ex1
docker compose exec mongodb mongosh biblioteca     # entrar ja na BD do ex2
```

---

## Persistencia de dados

### ex1 - Jogos de Tabuleiro

- **Base de dados:** `jogostabuleiro`
- **Colecao:** `jogos`
- **Como e povoada:** o servico `mongodb` e uma imagem Mongo 7 custom
  (`ex1/dataset/Dockerfile`) que copia o `init.sh` + os `.json` do dataset
  para `/docker-entrypoint-initdb.d/`. No **primeiro arranque do volume**,
  o `init.sh` percorre todos os `.json` e faz:
  ```bash
  mongoimport --db jogostabuleiro --collection <nome-do-ficheiro> --file <f> --jsonArray
  ```
  Como o ficheiro e `jogos.json`, a colecao fica chamada `jogos`. O
  dataset original ja vem em formato array (sem necessidade de
  pre-processamento) e cada documento tem um campo `id` natural
  (e.g. `"catan"`).
- **Re-importar dataset:** `docker compose down -v && docker compose up -d --build`
  (apaga o volume e o `init.sh` corre de novo).
- **Mongoose model:** `ex1/models/jogo.js` usa `strict: false` para
  aceitar a forma livre dos sub-documentos (`autores`, `editoras`,
  `mecanicas`, `premios`).
- **Identificacao de documentos:** o `_id` e o ObjectId nativo gerado pelo
  `mongoimport`; o `id` (`catan`, etc.) e o identificador natural do
  dominio. As rotas `/jogos/:id` matcham por **`id` OU `_id`**
  (`$or: [{id: ...}, {_id: ...}]`), por isso ambos os formatos funcionam.

### ex2 - Lista de Leituras

- **Base de dados:** `biblioteca` (criada automaticamente pelo Mongo
  no 1o write)
- **Colecao:** `livros`
- **Como e povoada:** **seed automatico no arranque** da API. Em
  `ex2/api/app.js`, a funcao `seedIfEmpty()` corre depois da ligacao
  ao Mongo: se `db.livros.countDocuments() === 0`, le
  `ex2/api/dataset/livros.json` (7 livros) e faz `Livro.insertMany(...)`.
  Em arranques seguintes (count > 0), nao reinsere.
- **Mongoose model:** `ex2/api/models/livro.js` com schema estrito e
  validacao:
  ```js
  {
    titulo:  { type: String,  required: true, trim: true },
    autor:   { type: String,  required: true, trim: true },
    paginas: { type: Number,  required: true, min: 1 },
    genero:  { type: String,  required: true, trim: true },
    lido:    { type: Boolean, default: false }
  }
  ```
- **Identificacao:** `_id` ObjectId nativo (o frontend usa `livro._id`).

---

## ex1 - Jogos de Tabuleiro (API de dados)

### 1.1 Setup

Cumprido pela imagem Mongo custom + `init.sh` descritos acima. Apos
`docker compose up`:

```bash
docker compose exec mongodb mongosh jogostabuleiro --quiet --eval 'db.jogos.countDocuments({})'
# 27
```

### 1.2 Queries (warm-up)

As 5 queries pedidas estao em `ex1/queries.txt`, com resultados
anotados. Para correr:

```bash
docker compose exec mongodb mongosh jogostabuleiro
# depois colar as queries do ficheiro
```

Resultados (validados contra o dataset):

| # | Pergunta                          | Resposta                                            |
|---|-----------------------------------|-----------------------------------------------------|
| 1 | Total de jogos                    | **27**                                              |
| 2 | Jogos categoria "Family"          | **8**                                               |
| 3 | Lista de autores (distintos)      | **27** (de "Alan R. Moon" a "Vital Lacerda")        |
| 4 | Distribuicao por ano              | 15 anos (1995..2021); ano com mais lancamentos: 2017 (4) |
| 5 | Distribuicao por editora          | 20 editoras; Stonemaier Games / Czech Games Edition / Ravensburger com 2 cada |

### 1.3 API de dados (porta 17000)

Implementacao em `ex1/routes/index.js`. Todas as rotas estao
documentadas em **Swagger UI** em http://localhost:17000/api-docs
(spec em `ex1/swagger.yml`).

| Metodo | Rota                  | Comportamento                                                            |
|--------|-----------------------|--------------------------------------------------------------------------|
| GET    | `/jogos`              | Lista resumo (`_id`, `name`, `year`, `category`, `minPlayers`)           |
| GET    | `/jogos?editora=E`    | Filtra por editora (aceita **id** ou **name**: `$or` em ambos os campos) |
| GET    | `/jogos/:id`          | Documento completo (match por `id` ou `_id`)                             |
| POST   | `/jogos`              | Cria novo; auto-gera `_id` a partir do `id` do body (ou UUID se nenhum)  |
| PUT    | `/jogos/:id`          | Actualiza (parcial), devolve novo doc                                    |
| DELETE | `/jogos/:id`          | Apaga, devolve `{ok: true, removed: ...}`                                |
| GET    | `/autores`            | Aggregation: `$unwind`+`$group` por `autores.name`, ordenada alfab.      |
| GET    | `/categorias`         | Aggregation: `$group` por `category`, ordenada alfab.                    |
| GET    | `/api-docs`           | Interface Swagger UI                                                     |

Exemplos curl:

```bash
# Lista todos
curl http://localhost:17000/jogos | jq

# Filtro por editora (id ou nome - ambos funcionam)
curl 'http://localhost:17000/jogos?editora=kosmos'
curl 'http://localhost:17000/jogos?editora=KOSMOS'

# Detalhe
curl http://localhost:17000/jogos/catan | jq

# Agregados
curl http://localhost:17000/autores | jq
curl http://localhost:17000/categorias | jq

# CRUD
curl -X POST http://localhost:17000/jogos -H 'Content-Type: application/json' \
  -d '{"id":"x","name":"X","year":2026,"category":"Strategy","minPlayers":2,"editoras":[{"id":"e","name":"E"}]}'
curl -X PUT  http://localhost:17000/jogos/x -H 'Content-Type: application/json' -d '{"year":2027}'
curl -X DELETE http://localhost:17000/jogos/x
```

---

## ex2 - A Minha Lista de Leituras (engenharia reversa)

### Analise da interface

O frontend `ex2/web/index.html` (Vue.js + Axios + w3.css) faz pedidos
para `http://localhost:19020/api/livros`. Da inspeccao do codigo
extrai-se o contrato:

- `obterLivros()` -> `GET /api/livros[?search=X]`
- `adicionarLivro()` -> `POST /api/livros` body `{titulo, autor, paginas, genero}`
- `alterarEstado()` -> `PUT /api/livros/:id` body `{lido: <boolean>}`
- `removerLivro()` -> `DELETE /api/livros/:id`

A iteracao usa `livro._id` como chave - logo o identificador e o
ObjectId nativo do Mongo, nao ha campo `id` custom.

### Modelo Mongoose (1 val.)

Derivado da analise acima: ver `ex2/api/models/livro.js`. Campos
todos obrigatorios excepto `lido` (default `false` - novos livros
entram como "por ler").

### Dataset (0.5 val.)

7 registos exemplificativos em `ex2/api/dataset/livros.json` (mix
de portugues / internacional, lidos e por ler). Seed automatico
descrito acima.

### API Express (2.5 val.)

Implementacao em `ex2/api/routes/livros.js`, montada em `/api/livros`
no `ex2/api/app.js`. CORS aberto (`cors()`) - obrigatorio porque o
Nginx (`localhost:19021`) chama a API (`localhost:19020`) cross-origin.

| Metodo | Rota                    | Notas                                                                   |
|--------|-------------------------|-------------------------------------------------------------------------|
| GET    | `/api/livros`           | Lista                                                                   |
| GET    | `/api/livros?search=X`  | Filtra `titulo` OU `autor` por regex case-insensitive. **`X` e escapado** para neutralizar especiais de regex |
| POST   | `/api/livros`           | Validacao Mongoose; 201 + doc / 400 + mensagem                          |
| PUT    | `/api/livros/:id`       | `findByIdAndUpdate` com `runValidators`; 404 se nao encontra            |
| DELETE | `/api/livros/:id`       | Devolve `{ok:true, removed:<doc>}`                                      |

Exemplos curl:

```bash
curl http://localhost:19020/api/livros | jq
curl 'http://localhost:19020/api/livros?search=saramago' | jq

curl -X POST http://localhost:19020/api/livros -H 'Content-Type: application/json' \
  -d '{"titulo":"Foundation","autor":"Isaac Asimov","paginas":256,"genero":"Ficcao Cientifica"}'

# (substituir <id> pelo _id devolvido pelo POST)
curl -X PUT  http://localhost:19020/api/livros/<id> -H 'Content-Type: application/json' -d '{"lido":true}'
curl -X DELETE http://localhost:19020/api/livros/<id>
```

### Docker (3 val.)

- `ex2/api/Dockerfile` - Node 20 alpine, `npm install --omit=dev`,
  `EXPOSE 19020`.
- `ex2/web/Dockerfile` - Nginx alpine, copia `index.html` para
  `/usr/share/nginx/html/`. Nginx default escuta em 80 internamente -
  o `docker-compose.yml` mapeia `19021:80`.
- `docker-compose.yml` raiz - orquestra os 4 servicos. **Mongo sem
  `ports:`** (so acessivel pelas APIs na rede `engweb`).

---

## Correr sem Docker (opcional)

Precisas de uma instancia local de Mongo a ouvir em `localhost:27017`.

```bash
# ex1
cd ex1
npm install
DB_NAME=jogostabuleiro COLLECTION=jogos npm run import -- dataset/jogos.json   # 1a vez
npm start    # -> http://localhost:17000

# ex2 API
cd ex2/api
npm install
npm start    # -> http://localhost:19020 (faz seed se a coleccao estiver vazia)

# ex2 frontend - abrir ex2/web/index.html no browser (ou servir com qualquer http server)
```

---

## Notas finais

- **`docker compose down -v`** apaga o volume `mongodb` - na proxima
  subida o `init.sh` re-importa o ex1 e o `seedIfEmpty()` re-cria os
  livros do ex2.
- **Hot-reload em dev:** existe um `npm run dev` (via nodemon) em
  ambos os `package.json`, util quando se corre fora do docker.
- **Subject do email de entrega:** o enunciado escreve
  `ENGWEB2026::Especial::Axxxxx` mas o exame e da epoca **Normal**;
  vou enviar como `ENGWEB2026::Normal::A<num>` (assumindo gralha no
  PDF, confirmar com o docente).
