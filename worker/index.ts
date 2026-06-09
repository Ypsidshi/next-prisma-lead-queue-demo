import { PrismaClient, type Lead } from "@prisma/client";

const prisma = new PrismaClient();

const POLL_MS = Number(process.env.WORKER_POLL_MS ?? 2000);
const LOCK_TTL_MS = Number(process.env.WORKER_LOCK_TTL_MS ?? 120_000);
const MAX_ATTEMPTS = Number(process.env.WORKER_MAX_ATTEMPTS ?? 5);

/** Имитация внешнего API: для демо ретраев — падает, пока attemptCount < 2 и email содержит `fail-once@` */
async function simulateExternalProcess(lead: Lead): Promise<void> {
  await new Promise((r) => setTimeout(r, 400));
  const demoFail =
    lead.email.includes("fail-once@") && lead.attemptCount < 2;
  if (demoFail) {
    throw new Error("Внешний сервис временно недоступен (демо)");
  }
}

async function resetStaleLocks(): Promise<void> {
  const threshold = new Date(Date.now() - LOCK_TTL_MS);
  const res = await prisma.lead.updateMany({
    where: {
      processingStatus: "PROCESSING",
      lockedAt: { lt: threshold },
    },
    data: {
      processingStatus: "PENDING",
      lockedAt: null,
    },
  });
  if (res.count > 0) {
    console.log(`[worker] сброшено зависших блокировок: ${res.count}`);
  }
}

async function claimNextLead(): Promise<Lead | null> {
  return prisma.$transaction(async (tx) => {
    const next = await tx.lead.findFirst({
      where: { processingStatus: "PENDING" },
      orderBy: { createdAt: "asc" },
    });
    if (!next) return null;

    const updated = await tx.lead.updateMany({
      where: { id: next.id, processingStatus: "PENDING" },
      data: {
        processingStatus: "PROCESSING",
        lockedAt: new Date(),
        attemptCount: { increment: 1 },
      },
    });

    if (updated.count !== 1) {
      return null;
    }

    return tx.lead.findUniqueOrThrow({ where: { id: next.id } });
  });
}

async function handleFailure(lead: Lead, message: string): Promise<void> {
  const shouldRetry = lead.attemptCount < MAX_ATTEMPTS;
  await prisma.lead.update({
    where: { id: lead.id },
    data: shouldRetry
      ? {
          processingStatus: "PENDING",
          lockedAt: null,
          lastError: message,
        }
      : {
          processingStatus: "FAILED",
          lockedAt: null,
          lastError: message,
        },
  });
  console.warn(
    `[worker] лид ${lead.id}: ошибка (${lead.attemptCount}/${MAX_ATTEMPTS}) — ${shouldRetry ? "retry" : "FAILED"}`,
  );
}

async function handleSuccess(lead: Lead): Promise<void> {
  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      processingStatus: "SUCCEEDED",
      processedAt: new Date(),
      lockedAt: null,
      lastError: null,
    },
  });
  console.log(`[worker] лид ${lead.id}: SUCCEEDED`);
}

async function tick(): Promise<void> {
  await resetStaleLocks();
  const lead = await claimNextLead();
  if (!lead) return;

  try {
    await simulateExternalProcess(lead);
    await handleSuccess(lead);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await handleFailure(lead, message);
  }
}

async function main(): Promise<void> {
  console.log(
    `[worker] старт poll=${POLL_MS}ms lockTtl=${LOCK_TTL_MS}ms maxAttempts=${MAX_ATTEMPTS}`,
  );
  for (;;) {
    try {
      await tick();
    } catch (e) {
      console.error("[worker] tick error", e);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
