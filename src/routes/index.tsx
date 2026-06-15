import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell, Card } from "@/components/Shell";
import { useRows } from "@/lib/store";
import { fmtDate, isCurrentRange, todayISO } from "@/lib/dates";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "حياة تشبهك — الرئيسية" },
      { name: "description", content: "لوحة التحكم الرئيسية لمخططك الشخصي" },
    ],
  }),
  component: Home,
});

const MAIN_CARDS = [
  { to: "/day", title: "اليوم", icon: "⏳", desc: "مهام، أولويات، طاقة" },
  { to: "/cycle", title: "خطتي", icon: "🗺️", desc: "دورة التخطيط الشهرية" },
  { to: "/habits", title: "عاداتي", icon: "🌿", desc: "تتبع العادات اليومية" },
  { to: "/self", title: "أفهم نفسي", icon: "🌓", desc: "قيمي، معتقداتي، عقليتي" },
];

function Home() {
  const cycles = useRows("Planning_Cycles");
  const current = cycles.find(c => isCurrentRange(c.start_date, c.end_date)) || cycles[cycles.length - 1];
  const today = todayISO();
  const tasks = useRows("Tasks", { date: today });
  const completed = tasks.filter(t => t.status === "مكتملة").length;
  const pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const weeks = useRows("Weekly_Plans", current ? { cycle_id: current.cycle_id } : undefined);
  const currentWeek = weeks.find(w => isCurrentRange(w.start_date, w.end_date));
  const values = useRows("Values");
  const activeHabits = useRows("Habits", { status: "نشطة" });

  return (
    <Shell>
      {/* Hero */}
      <section className="mb-12 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-3">
            مرحباً بكِ في حياتك
          </h1>
          <p className="text-foreground/60 max-w-md">
            خطّطي حياتك بوعي، ابدئي من قيمك الكبرى وصولاً لتفاصيل يومك الصغيرة.
          </p>
        </div>
        <div className="text-left">
          <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">اليوم</span>
          <span className="text-lg font-medium">{fmtDate(new Date())}</span>
        </div>
      </section>

      {/* 4 main cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
        {MAIN_CARDS.map((c, i) => (
          <Link key={c.to} to={c.to} className="group">
            <Card className="h-full hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className={`size-12 rounded-2xl mb-6 flex items-center justify-center text-xl transition-colors ${
                i === 0 ? "bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground"
                : "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
              }`}>
                {c.icon}
              </div>
              <h3 className="font-serif text-2xl font-bold mb-2">{c.title}</h3>
              <p className="text-sm text-muted-foreground">{c.desc}</p>
              {i === 0 && (
                <div className="mt-6 w-full h-1 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                </div>
              )}
            </Card>
          </Link>
        ))}
      </div>

      {/* Hierarchy / current cycle */}
      <section className="mb-14">
        <h2 className="font-serif text-xl font-bold mb-6 border-b border-border pb-4 flex items-center gap-3">
          <span className="size-2 bg-accent rounded-full" />
          التسلسل التخطيطي الحالي
        </h2>

        <div className="space-y-4">
          <div className="bg-secondary/40 p-6 rounded-2xl flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-5">
              <span className="text-xs font-bold text-accent tracking-widest">القيم العليا</span>
              <span className="text-lg">
                {values.length ? values.slice(0, 3).map(v => v.value_name).join("، ") : "لم تحدّدي قيمك بعد"}
              </span>
            </div>
            <Link to="/values" className="text-sm text-foreground/60 hover:text-foreground">تعديل</Link>
          </div>

          <div className="bg-secondary/15 p-6 rounded-2xl border-r-4 border-accent">
            <span className="text-xs font-bold text-muted-foreground tracking-widest block mb-1">الدورة الحالية</span>
            {current ? (
              <>
                <p className="text-lg font-medium">{current.cycle_name || "دورة بدون اسم"}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {fmtDate(current.start_date)} — {fmtDate(current.end_date)} · {current.theme || "بدون طابع"}
                </p>
              </>
            ) : (
              <Link to="/cycle" className="text-accent font-medium">ابدئي دورة جديدة ←</Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <span className="block text-[10px] font-bold text-muted-foreground tracking-widest mb-2">الأسبوع الحالي</span>
              <p className="font-medium">{currentWeek?.week_focus || (currentWeek ? `الأسبوع ${currentWeek.week_number}` : "—")}</p>
            </Card>
            <Card>
              <span className="block text-[10px] font-bold text-muted-foreground tracking-widest mb-2">إنجاز اليوم</span>
              <p className="font-medium">{completed} / {tasks.length} مهام · {pct}%</p>
            </Card>
            <Card>
              <span className="block text-[10px] font-bold text-muted-foreground tracking-widest mb-2">العادات النشطة</span>
              <p className="font-medium text-accent">{activeHabits.length} عادة</p>
            </Card>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          to="/day"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90"
        >
          خططي يومك
        </Link>
        <Link
          to="/day"
          search={{ tired: true } as any}
          className="px-6 py-3 bg-secondary text-foreground rounded-full font-medium hover:bg-secondary/70"
        >
          أنا تعبانة اليوم
        </Link>
      </div>
    </Shell>
  );
}
