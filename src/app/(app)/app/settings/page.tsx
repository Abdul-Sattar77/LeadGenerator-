import { requireAuth } from "@/server/tenant";
import { roleAtLeast } from "@/lib/enums";
import { getBilling } from "@/server/services/billingService";
import { getConnectedGmail } from "@/server/services/userMailService";
import { googleEnabled } from "@/lib/googleMail";
import Forbidden from "@/app/(app)/_components/Forbidden";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: { upgraded?: string; gmail?: string } }) {
  const ctx = await requireAuth();
  if (!roleAtLeast(ctx.role, "ADMIN")) return <Forbidden need="Admin" />;

  const [billing, gmail] = await Promise.all([getBilling(ctx), getConnectedGmail(ctx.userId)]);
  return (
    <SettingsClient
      billing={billing}
      upgraded={searchParams.upgraded ?? null}
      gmail={gmail}
      googleConfigured={googleEnabled()}
      gmailStatus={searchParams.gmail ?? null}
    />
  );
}
