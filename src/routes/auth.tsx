import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Card } from "@/components/Shell";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "تسجيل الدخول — حياة تشبهك" }] }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/" });
    });
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null); setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav({ to: "/" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name },
          },
        });
        if (error) throw error;
        setMsg("تم إنشاء الحساب! تحقق من بريدك للتفعيل.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (error) throw error;
        setMsg("أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك.");
      }
    } catch (e: any) {
      setErr(e.message || "حدث خطأ");
    } finally { setBusy(false); }
  };

  const google = async () => {
    setErr(null); setBusy(true);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) { setErr((r.error as any)?.message || "تعذّر الدخول عبر Google"); setBusy(false); return; }
    if (r.redirected) return;
    nav({ to: "/" });
  };

  const titles: Record<typeof mode, string> = {
    signin: "تسجيل الدخول", signup: "إنشاء حساب", forgot: "نسيت كلمة المرور",
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl font-bold text-primary">حياة تشبهك</h1>
          <p className="text-sm text-muted-foreground mt-2">مخطّطك الشخصي الذكي</p>
        </div>

        <Card>
          <h2 className="font-serif text-2xl font-bold mb-6">{titles[mode]}</h2>

          {mode !== "forgot" && (
            <button
              onClick={google}
              disabled={busy}
              className="w-full mb-4 py-2.5 border border-border rounded-full font-medium hover:bg-secondary/50 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>الدخول عبر Google</span>
            </button>
          )}

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <input
                className="w-full px-4 py-2.5 bg-muted rounded-xl border border-border outline-none focus:border-accent"
                placeholder="الاسم"
                value={name} onChange={e => setName(e.target.value)} required
              />
            )}
            <input
              className="w-full px-4 py-2.5 bg-muted rounded-xl border border-border outline-none focus:border-accent"
              type="email" placeholder="البريد الإلكتروني" dir="ltr"
              value={email} onChange={e => setEmail(e.target.value)} required
            />
            {mode !== "forgot" && (
              <input
                className="w-full px-4 py-2.5 bg-muted rounded-xl border border-border outline-none focus:border-accent"
                type="password" placeholder="كلمة المرور" dir="ltr"
                value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              />
            )}

            {err && <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{err}</p>}
            {msg && <p className="text-sm text-accent bg-accent/10 rounded-lg p-3">{msg}</p>}

            <button
              type="submit" disabled={busy}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {busy ? "..." : titles[mode]}
            </button>
          </form>

          <div className="mt-6 text-center text-sm space-y-2">
            {mode === "signin" && (
              <>
                <button onClick={() => setMode("forgot")} className="text-accent hover:underline block w-full">نسيت كلمة المرور؟</button>
                <button onClick={() => setMode("signup")} className="text-muted-foreground hover:text-foreground">
                  لا تملك حساباً؟ <span className="text-accent font-medium">أنشئي واحداً</span>
                </button>
              </>
            )}
            {mode === "signup" && (
              <button onClick={() => setMode("signin")} className="text-muted-foreground hover:text-foreground">
                لديك حساب؟ <span className="text-accent font-medium">سجّلي دخولك</span>
              </button>
            )}
            {mode === "forgot" && (
              <button onClick={() => setMode("signin")} className="text-muted-foreground hover:text-foreground">
                ← العودة لتسجيل الدخول
              </button>
            )}
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/" className="hover:underline">العودة للصفحة الرئيسية</Link>
        </p>
      </div>
    </div>
  );
}
