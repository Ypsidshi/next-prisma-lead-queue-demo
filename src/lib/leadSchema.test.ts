import { describe, expect, it } from "vitest";
import { leadFormSchema } from "@/lib/leadSchema";

describe("leadFormSchema", () => {
  it("принимает валидные данные с UUID ключа идемпотентности", () => {
    const key = "550e8400-e29b-41d4-a716-446655440000";
    const r = leadFormSchema.safeParse({
      name: "Иван",
      email: "ivan@example.com",
      message: "Привет",
      idempotencyKey: key,
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.idempotencyKey).toBe(key);
    }
  });

  it("пустой idempotencyKey допускается", () => {
    const r = leadFormSchema.safeParse({
      name: "Иван",
      email: "ivan@example.com",
      message: "",
      idempotencyKey: "",
    });
    expect(r.success).toBe(true);
  });
});
