import { z } from "zod";
import { route, ok } from "@/server/http";
import { findDuplicates, mergeContacts, mergeCompanies } from "@/server/services/dedupeService";

export const dynamic = "force-dynamic";

export const GET = route({ role: "MANAGER" }, async ({ ctx }) => ok(await findDuplicates(ctx)));

const mergeSchema = z.object({
  type: z.enum(["contact", "company"]),
  survivorId: z.string().min(1),
  dupId: z.string().min(1),
});

export const POST = route({ role: "MANAGER", body: mergeSchema }, async ({ ctx, body }) => {
  if (body.type === "contact") await mergeContacts(ctx, body.survivorId, body.dupId);
  else await mergeCompanies(ctx, body.survivorId, body.dupId);
  return ok({ ok: true });
});
