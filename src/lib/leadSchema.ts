import { z } from "zod";

/** Публичный ввод формы лида + опциональный ключ идемпотентности (UUID). */
export const leadFormSchema = z.object({
  name: z.string().trim().min(1, "Укажите имя").max(200),
  email: z.string().trim().email("Некорректный email"),
  message: z.string().max(5000).optional().default(""),
  idempotencyKey: z.string().uuid().optional().or(z.literal("")),
});

export type LeadFormInput = z.infer<typeof leadFormSchema>;
