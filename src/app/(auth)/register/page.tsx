"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, Mail, Lock, User as UserIcon, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", organizationName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Registration failed.");
      return;
    }

    // Auto sign-in after successful registration.
    const login = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (login?.error) {
      router.push("/login");
      return;
    }
    router.push("/app");
    router.refresh();
  }

  return (
    <Card className="p-8">
      <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Start finding and managing leads in minutes. No card required.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field icon={UserIcon} label="Your name" value={form.name} onChange={set("name")} placeholder="Jane Doe" required />
        <Field icon={Building2} label="Company / team" value={form.organizationName} onChange={set("organizationName")} placeholder="Acme Sales" required />
        <Field icon={Mail} label="Email" type="email" value={form.email} onChange={set("email")} placeholder="you@company.com" required />
        <Field icon={Lock} label="Password" type="password" value={form.password} onChange={set("password")} placeholder="At least 8 characters" required />

        {error && <p className="text-sm font-medium text-destructive">{error}</p>}

        <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}

function Field({ icon: Icon, label, type = "text", value, onChange, placeholder, required }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <span className="flex items-center gap-2.5 rounded-lg border border-input bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </span>
    </label>
  );
}
