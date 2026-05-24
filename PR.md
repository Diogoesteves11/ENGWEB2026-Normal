# EngWeb 2026 - Exame epoca normal

**Aluno:** Diogo Jose Fernandes Esteves
**UC:** Engenharia Web (3o ano LEI)

## Estrutura do repositorio

```
.
|-- docker-compose.yml        # mongodb + data-api + interface
|-- ex1/
|   |-- Dockerfile            # imagem da API
|   |-- dataset/
|   |   |-- Dockerfile        # imagem do Mongo (com dataset + init.sh)
|   |   `-- init.sh           # mongoimport automatico no 1o arranque
|   |-- models/, routes/, scripts/, ...
|-- ex2/
|   |-- Dockerfile            # imagem da interface
|   `-- routes/, views/, ...
`-- PR.md
```

## Pre-requisitos

- Docker + docker compose
- (Opcional) Node 18+ se quiseres correr fora do docker

## Correr tudo via Docker Compose (recomendado)

```bash
docker compose up -d --build    # build + arranque dos 3 servicos
docker compose logs -f          # acompanhar logs
docker compose down             # parar
docker compose down -v          # parar e apagar volume Mongo (forca re-import)
```

Servicos:
- `mongodb`  -> porta 27017 (Mongo 7 com dataset baked-in via init.sh)
- `data-api` -> porta 25000 (Express + Mongoose, fala com `mongodb:27017`)
- `interface`-> porta 25001 (Express + Pug, fala com `data-api:25000`)

Rede interna `engweb` permite que os servicos se vejam pelos respectivos
nomes de container.

## Import do dataset

### Workflow com Docker (recomendado)

1. **Se o dataset for object-map** (`{ "k": {...} }`), converter para array primeiro:
   ```bash
   cd ex1
   python scripts/convert-dataset.py dataset/<ficheiro>.json
   ```
   Gera `dataset/<ficheiro>-processed.json` (array, bem formatado).

2. **Colocar o JSON em `ex1/dataset/`** (original ou `-processed.json`).

3. **Build e arranque:**
   ```bash
   docker compose up -d --build
   ```
   O `init.sh` dentro do Mongo deteta `*.json` e faz `mongoimport --jsonArray` na primeira inicializacao do volume.

4. **Para re-importar** (apaga dados e re-importa):
   ```bash
   docker compose down -v && docker compose up -d --build
   ```

### Alternativa: script Node (sem Docker)

```bash
cd ex1
npm i
DB_NAME=<nome> COLLECTION=<col> npm run import -- dataset/<ficheiro>.json
```
Requer Mongo a correr localmente (localhost:27017).

## Correr localmente (sem docker)

### Exercicio 1 - API (porta 25000)

```bash
cd ex1
npm i
npm start                       # -> http://localhost:25000
# ou
PORT=25000 DB_NAME=<nome> npm start
```

### Exercicio 2 - Interface (porta 25001)

```bash
cd ex2
npm i
npm start                       # -> http://localhost:25001
# ou
PORT=25001 API_URL=http://localhost:25000 npm start
```

## Variaveis de ambiente

| Var          | Default                                  | Onde      |
|--------------|------------------------------------------|-----------|
| `PORT`       | `25000` (ex1) / `25001` (ex2)            | ambos     |
| `MONGO_URL`  | `mongodb://127.0.0.1:27017/<DB_NAME>`    | ex1       |
| `DB_NAME`    | `engweb`                                 | ex1       |
| `COLLECTION` | `COLECCAO`                               | ex1 import|
| `API_URL`    | `http://localhost:25000`                 | ex2       |

## Notas de persistencia

- O Mongoose model usa `strict: false`, por isso aceita qualquer shape de
  documento que importes - util para nao bloquear na shape do dataset.
- O script `scripts/import.js` faz `deleteMany({})` antes de inserir, para
  poderes re-importar sem duplicar.
- Quando um documento tem campo `id`, o script copia-o para `_id` para o
  Mongo nao gerar ObjectIds aleatorios e mantermos URLs estaveis.

## Queries

Ver `ex1/queries.txt`.

## Checklist do exame (preencher durante)

### Setup e ex1
- [ ] Ler PDF do enunciado todo antes de tocar em codigo
- [ ] Confirmar formato do subject do email no PDF
- [ ] Trocar `engweb` por o nome da BD em `docker-compose.yml` (3 sitios: `MONGO_INITDB_DATABASE`, `MONGO_URL`, `DB_NAME`)
- [ ] Renomear `models/recurso.js` (e `Recurso`) para o dominio do enunciado
- [ ] Trocar `COLECCAO` por o nome da coleccao pedida em `models/recurso.js`
- [ ] Colocar dataset em `ex1/dataset/` (ou converter object-map -> array primeiro com `npm run import`)
- [ ] `docker compose up -d --build` e confirmar import no Mongo
- [ ] Trocar `/recursos` por o recurso pedido em `ex1/routes/index.js`
- [ ] Implementar filtros das query-strings
- [ ] Implementar rotas extra (paises, interpretes, ...)
- [ ] Escrever `ex1/queries.txt`
- [ ] Testar todas as rotas no Postman

### ex2
- [ ] Trocar `/RECURSO` em `ex2/routes/index.js`
- [ ] Trocar `/CATEGORIA/:valor` em `ex2/routes/index.js`
- [ ] Adaptar campos nas views Pug (`index.pug`, `item.pug`, `categoria.pug`)
- [ ] Testar tudo no browser

### Entrega
- [ ] Criar repo GitHub publico chamado `ENGWEB2026-Normal`
- [ ] `git remote add origin <url>` e `git push -u origin main`
- [ ] Verificar que o PR.md final reflecte o que ficou feito (e nao so este skeleton)
- [ ] Enviar email para **jcr@di.uminho.pt**
- [ ] Subject: `ENGWEB2026::Normal::A<numero>` (confirmar formato no PDF)
- [ ] Corpo do email com link do repo
