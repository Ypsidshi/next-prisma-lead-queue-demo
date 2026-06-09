"use client";

import { useActionState, useEffect, useId, useMemo } from "react";
import { createLeadAction } from "@/app/actions";

function initialIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "";
}

export function LeadForm() {
  const fieldId = useId();
  const defaultKey = useMemo(() => initialIdempotencyKey(), []);
  const [state, formAction, isPending] = useActionState(createLeadAction, null);

  useEffect(() => {
    if (state?.ok) {
      const el = document.getElementById(`${fieldId}-status`);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [state, fieldId]);

  return (
    <form action={formAction} className="mx-auto flex max-w-lg flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="idempotencyKey" defaultValue={defaultKey} />

      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Оставить заявку</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Данные попадают в PostgreSQL; отдельный TS-воркер обрабатывает очередь со статусами и
          повторными попытками.
        </p>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-800">Имя</span>
        <input
          name="name"
          required
          autoComplete="name"
          className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
          placeholder="Иван"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-800">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
          placeholder="you@example.com"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-800">Сообщение</span>
        <textarea
          name="message"
          rows={4}
          className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
          placeholder="Кратко опишите запрос"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {isPending ? "Отправка…" : "Отправить"}
      </button>

      <div id={`${fieldId}-status`} className="min-h-[1.25rem] text-sm" aria-live="polite">
        {state?.ok === true && (
          <p className="text-emerald-700">
            {state.duplicate
              ? "Повторная отправка с тем же ключом: заявка уже была принята."
              : "Заявка принята и поставлена в очередь на обработку."}{" "}
            <span className="text-zinc-600">id: {state.leadId}</span>
          </p>
        )}
        {state?.ok === false && <p className="text-red-700">{state.error}</p>}
      </div>
    </form>
  );
}
