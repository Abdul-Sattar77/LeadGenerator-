import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default function Forbidden({ need = "Manager" }: { need?: string }) {
  return (
    <div className="mx-auto max-w-xl">
      <Card className="p-2">
        <EmptyState
          icon={Lock}
          title="You don’t have access to this page"
          description={`This area requires the ${need} role or higher. Ask an admin to upgrade your access.`}
        />
      </Card>
    </div>
  );
}
