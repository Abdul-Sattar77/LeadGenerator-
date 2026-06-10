import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mesh-bg relative flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="grid-fade pointer-events-none absolute inset-0" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Logo size={34} />
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
