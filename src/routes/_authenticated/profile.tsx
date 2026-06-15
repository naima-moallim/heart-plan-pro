import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell, PageHeader, Card } from "@/components/Shell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "ملفّي الشخصي" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setName(data?.display_name || ""));
  }, [user]);

  const save = async () => {
    if (!user) return;
    setBusy(true); setMsg(null);
    const { error } = await supabase.from("profiles")
      .upsert({ id: user.id, display_name: name, email: user.email });
    setBusy(false);
    setMsg(error ? error.message : "تم الحفظ ✓");
  };

  return (
    <Shell>
      <PageHeader title="ملفّي الشخصي" />
      <Card>
        <label className="text-sm text-muted-foreground block mb-2">الاسم المعروض</label>
        <input
          className="w-full max-w-md px-4 py-2.5 bg-muted rounded-xl border border-border outline-none focus:border-accent"
          value={name} onChange={e => setName(e.target.value)}
        />
        <div className="mt-4 flex items-center gap-3">
          <button onClick={save} disabled={busy} className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-medium disabled:opacity-50">
            {busy ? "..." : "حفظ"}
          </button>
          {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
        </div>
        <p className="text-xs text-muted-foreground mt-6">البريد: <span dir="ltr">{user?.email}</span></p>
      </Card>
    </Shell>
  );
}
