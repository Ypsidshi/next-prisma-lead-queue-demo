import { LeadForm } from "@/app/lead-form";

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">next-prisma-lead-queue-demo</p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Очередь лидов</h1>
        <p className="max-w-2xl text-zinc-600">
          Публичная форма создаёт запись со статусом <code className="rounded bg-zinc-100 px-1">PENDING</code>.
          Воркер в Docker забирает задачи, ставит <code className="rounded bg-zinc-100 px-1">PROCESSING</code>, при
          успехе — <code className="rounded bg-zinc-100 px-1">SUCCEEDED</code> (с ретраями до лимита попыток).
        </p>
      </header>
      <LeadForm />
    </main>
  );
}
