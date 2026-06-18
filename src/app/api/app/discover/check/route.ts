import { z } from "zod";
import { route, ok } from "@/server/http";
import { findExistingKeys } from "@/server/services/intakeService";

export const dynamic = "force-dynamic";

const schema = z.object({
  items: z.array(z.object({ name: z.string(), address: z.string().optional() })).max(200),
});

export const POST = route({ body: schema }, async ({ ctx, body }) => {
  return ok({ existing: await findExistingKeys(ctx, body.items) });
});
