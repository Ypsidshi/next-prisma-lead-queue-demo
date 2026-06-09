import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { leadFormSchema, type LeadFormInput } from "@/lib/leadSchema";

export type CreateLeadResult =
  | { ok: true; leadId: string; duplicate: boolean }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function parseFormData(formData: FormData): LeadFormInput | { error: string } {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message") ?? "",
    idempotencyKey: formData.get("idempotencyKey") ?? "",
  };
  const parsed = leadFormSchema.safeParse({
    name: typeof raw.name === "string" ? raw.name : "",
    email: typeof raw.email === "string" ? raw.email : "",
    message: typeof raw.message === "string" ? raw.message : "",
    idempotencyKey:
      typeof raw.idempotencyKey === "string" && raw.idempotencyKey.length > 0
        ? raw.idempotencyKey
        : undefined,
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      error: flat.fieldErrors.name?.[0] ?? flat.fieldErrors.email?.[0] ?? "Ошибка валидации",
    };
  }
  return parsed.data;
}

export async function createLeadFromForm(formData: FormData): Promise<CreateLeadResult> {
  const parsed = parseFormData(formData);
  if ("error" in parsed) {
    return { ok: false, error: parsed.error };
  }

  const { name, email, message, idempotencyKey } = parsed;
  const key = idempotencyKey && idempotencyKey.length > 0 ? idempotencyKey : null;

  if (key) {
    const existing = await prisma.lead.findUnique({ where: { idempotencyKey: key } });
    if (existing) {
      return { ok: true, leadId: existing.id, duplicate: true };
    }
  }

  try {
    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        message: message ?? "",
        idempotencyKey: key,
      },
    });
    return { ok: true, leadId: lead.id, duplicate: false };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const target = e.meta?.target;
      const isIdempotency =
        Array.isArray(target) && target.includes("idempotencyKey");
      if (isIdempotency && key) {
        const existing = await prisma.lead.findUnique({ where: { idempotencyKey: key } });
        if (existing) {
          return { ok: true, leadId: existing.id, duplicate: true };
        }
      }
    }
    console.error(e);
    return { ok: false, error: "Не удалось сохранить заявку. Попробуйте позже." };
  }
}
