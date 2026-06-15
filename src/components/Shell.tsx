import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useHydrated } from "@/lib/store";

const NAV = [
  { to: "/", label: "الرئيسية" },
  { to: "/day", label: "اليوم" },
  { to: "/cycle", label: "خطتي" },
  { to: "/habits", label: "عاداتي" },
  { to: "/self", label: "أفهم نفسي" },
  { to: "/reviews", label: "المراجعات" },
  { to: "/reports", label: "التقارير" },
];

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: s => s.location.pathname });
  const { user, signOut } = useAuth();
  const hydrated = useHydrated();
  const nav = useNavigate();

  const onSignOut = async () => {
    await signOut();
    nav({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <Link to="/" className="flex flex-col">
            <span className="font-serif text-2xl font-bold text-primary leading-none">حياة تشبهك</span>
            <span className="text-[11px] text-muted-foreground mt-1">مخططك الشخصي</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            {NAV.map(n => {
              const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`px-3 py-2 rounded-full transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-secondary/50"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2 text-sm">
            <Link to="/profile" className="hidden sm:inline text-foreground/70 hover:text-foreground truncate max-w-[140px]">
              {user?.email}
            </Link>
            <button onClick={onSignOut} className="px-3 py-1.5 rounded-full bg-secondary/60 hover:bg-secondary text-xs">
              خروج
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {!hydrated ? (
          <div className="text-center py-20 text-muted-foreground">جارٍ تحميل بياناتك...</div>
        ) : children}
      </main>

      <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground rounded-full px-3 py-2 flex gap-1 text-xs shadow-lg z-50 backdrop-blur max-w-[95vw] overflow-x-auto">
        {NAV.slice(0, 5).map(n => {
          const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap ${active ? "bg-accent" : "opacity-70"}`}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>

      <footer className="max-w-7xl mx-auto px-6 py-10 mt-16 border-t border-border/60 text-xs text-muted-foreground flex justify-between">
        <span>حياة تشبهك © {new Date().getFullYear()}</span>
        <Link to="/settings" className="hover:text-accent">الإعدادات</Link>
      </footer>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-10 flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary">{title}</h1>
        {subtitle && <p className="mt-2 text-muted-foreground max-w-xl">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-card border border-border/60 rounded-3xl shadow-sm p-6 ${className}`}>
      {children}
    </div>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <Card className="text-center py-12">
      <p className="text-foreground/80 font-medium">{title}</p>
      {hint && <p className="text-sm text-muted-foreground mt-2">{hint}</p>}
    </Card>
  );
}
