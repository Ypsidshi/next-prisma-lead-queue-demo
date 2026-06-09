# Smoke-проверка (локально)

| Проверка | Результат |
|----------|-----------|
| `docker compose up -d --build` (БД **5435**, веб **3001**) | OK |
| HTTP `http://localhost:3001/` | 200 |
| `npm run lint` | OK |
| `npm run test` | OK (Vitest) |

Скриншот: `docs/screenshots/home.png`.
