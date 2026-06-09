"use server";

import { createLeadFromForm, type CreateLeadResult } from "@/lib/leads";

export async function createLeadAction(
  _prev: CreateLeadResult | null,
  formData: FormData,
): Promise<CreateLeadResult> {
  return createLeadFromForm(formData);
}
