import { route, ok } from "@/server/http";
import { listTags, createTag } from "@/server/services/tagService";
import { createTagSchema } from "@/lib/validations/tag";

export const dynamic = "force-dynamic";

export const GET = route({}, async ({ ctx }) => ok(await listTags(ctx)));

export const POST = route({ role: "SALES_REP", body: createTagSchema }, async ({ ctx, body }) =>
  ok(await createTag(ctx, body), { status: 201 })
);
