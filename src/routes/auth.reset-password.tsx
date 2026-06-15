import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/Shell";

export const Route = createFileRoute("/auth/reset-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "إعادة تعيين كلمة المرور" }] }),
  component: ResetPage,
});

function ResetPage() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    nav({ to: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md">
        <h1 className="font-serif text-3xl font-bold text-primary text-center mb-6">كلمة مرور جديدة</h1>
        <Card>
          <form onSubmit={submit} className="space-y-3">
            <input
              className="w-full px-4 py-2.5 bg-muted rounded-xl border border-border outline-none focus:border-accent"
              type="password" placeholder="كلمة المرور الجديدة" dir="ltr"
              value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
            />
            {err && <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{err}</p>}
            <button type="submit" disabled={busy} className="w-full py-2.5 bg-primary text-primary-foreground rounded-full font-medium disabled:opacity-50">
              {busy ? "..." : "حفظ"}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
