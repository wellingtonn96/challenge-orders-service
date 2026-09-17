# Challenge Pedidos

API NestJS para receber pedidos via webhook, processá-los de forma assíncrona (RabbitMQ) e converter o valor com a API Frankfurter (USD → BRL). Persistência em PostgreSQL.

---

## Stack

- **NestJS 12** + TypeScript
- **PostgreSQL** + TypeORM
- **RabbitMQ** (amqplib) — fila `orders` + DLQ `orders.dlq`
- **Joi** — validação HTTP
- **Axios** — HTTP client (câmbio)
- **Frankfurter** — conversão de moedas
- **Jest** + Supertest — testes
- **Docker Compose** — Postgres + RabbitMQ (+ app opcional)

---

## Como rodar

```bash
docker compose up -d postgres rabbitmq
cp .env.example .env
npm install
npm run start:dev
```

API: `http://localhost:3000`  
RabbitMQ UI: `http://localhost:15672` (`orders` / `orders`)

```bash
npm test          # unitários
npm run test:e2e  # e2e
```

---

## Fluxo

1. `POST /webhook/orders` → valida, grava (`RECEIVED`), publica na fila `orders`
2. Consumer processa → câmbio (retry/backoff) → `COMPLETED`
3. Se FX falhar após retries → `FAILED_ENRICHMENT` + mensagem na DLQ

**Idempotência:** mesmo `idempotency_key` (UUID) não duplica pedido nem republica na fila.

---

## Status

| Status | Significado |
|--------|-------------|
| `RECEIVED` | Recebido e enfileirado |
| `PROCESSING` | Em processamento |
| `COMPLETED` | Convertido com sucesso |
| `FAILED_ENRICHMENT` | Falha no câmbio; mensagem na DLQ |
| `FAILED` | Reservado |

---

## API

### `POST /webhook/orders`

```bash
curl -X POST http://localhost:3000/webhook/orders \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ext-123",
    "customer": { "email": "user@example.com", "name": "Ana" },
    "items": [{ "sku": "ABC123", "qty": 2, "unit_price": 59.9 }],
    "currency": "USD",
    "idempotency_key": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

- `201` criado (ou retornado se key já existir)
- `400` validação (`idempotency_key` deve ser UUID; `unit_price` obrigatório)

### `GET /orders`

Query: `page` (default 1), `limit` (default 20, máx 100), `status` (opcional).

```bash
curl "http://localhost:3000/orders?page=1&limit=10&status=COMPLETED"
```

Resposta: `{ data, total, page, limit, totalPages }`

### `GET /orders/:id`

```bash
curl "http://localhost:3000/orders/<UUID>"
```

`404` se não existir.

### `GET /queue/metrics` (ou `GET /orders/metrics/queues`)

```bash
curl "http://localhost:3000/queue/metrics"
```

Retorna contagem da fila `orders` e da DLQ `orders.dlq`.

---

## Resiliência

- **FX:** até 3 retries com backoff (200→400→800ms), só rede/429/5xx  
  (`FX_RETRY_ATTEMPTS`, `FX_RETRY_BASE_MS`, `FX_RETRY_MAX_MS`)
- **DLQ:** após falha definitiva, `nack` sem requeue → `orders.dlq`

> Se a fila `orders` já existir sem config de DLX, delete-a no RabbitMQ e reinicie a app.

---

## Estrutura

```
src/order/
  domain/                 # entidade, ports, cálculo de total
  application/use-cases/  # receive, process, list, get, metrics
  presentation/           # controllers + DTOs Joi
  infrastructure/         # TypeORM + consumer
src/shared/               # messaging, currency, http, resilience
```

---

## Env

Ver `.env.example`. Principais: `DATABASE_*`, `RABBITMQ_*`, `CURRENCY_API_BASE_URL`, `DEFAULT_TARGET_CURRENCY` (`BRL`), `FX_RETRY_*`.
