#!/bin/sh
set -e
cd /app
npx prisma migrate deploy
exec node dist/worker/index.js
