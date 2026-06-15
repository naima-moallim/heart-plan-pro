import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell, PageHeader, Card, Empty } from "@/components/Shell";
import { useRows, update, bulkCreate } from "@/lib/store";
import { daysBetween, fmtDate } from "@/lib/dates";

export const Route = createFileRoute("/weekly")({
  validateSearch: (s: Record<string, unknown>) => ({ cycle_id: (s.cycle_id as string) || "" }),
  head: () => ({ meta: [{ title: "الأسابيع" }] }),
  component: WeeklyPage,
});

function WeeklyPage() {
  const { cycle_id } = Route.useSearch();
  const cycles = useRows("Planning_Cycles");
  const cycle = cycles.find(c => c.cycle_id === cycle_id) || cycles[cycles.length - 1];
  const weeks = useRows("Weekly_Plans", cycle ? { cycle_id: cycle.cycle_id } : undefined);
  const goals = useRows("Monthly_Goals", cycle ? { cycle_id: cycle.cycle_id } : undefined);

  const distributeToDays = (week: any) => {
    const days = daysBetween(week.start_date, week.end_date);
    bulkCreate("Daily_Plans", days.map(d => ({
      cycle_id: week.cycle_id,
      week_id: week.week_id,
      date: d,
      day_theme: week.week_theme || "",
      energy_level: "متوسطة",
    })));
    // also create one anchor task per goal per week
    if (goals.length) {
      const middleDay = days[Math.floor(days.length / 2)];
      bulkCreate("Tasks", goals.map(g => ({
        cycle_id: week.cycle_id,
        week_id: week.week_id,
        goal_id: g.goal_id,
        date: middleDay,
        task_title: `خطوة نحو: ${g.goal_title}`,
        category: "مشروع",
        priority: "متوسطة",
        status: "لم تبدأ",
      })));
    }
    update("Weekly_Plans", week.week_id, { status: "موزع" });
    alert("تم توزيع الأسبوع على أيام ومهام أولية ✓");
  };

  return (
    <Shell>
      <PageHeader
        title="التوزيع الأسبوعي"
        subtitle={cycle ? `دورة: ${cycle.cycle_name}` : ""}
      />

      {!cycle ? (
        <Empty title="لا توجد دورة" hint="ابدئي من صفحة خطتي." />
      ) : weeks.length === 0 ? (
        <Empty title="لا توجد أسابيع — تم إنشاؤها تلقائياً مع الدورة عادة." />
      ) : (
        <div className="space-y-4">
          {weeks.map(w => (
            <Card key={w.week_id}>
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <span className="text-[10px] font-bold text-accent tracking-widest">الأسبوع {w.week_number}</span>
                  <h3 className="font-serif text-lg font-bold mt-1">
                    {fmtDate(w.start_date)} — {fmtDate(w.end_date)}
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => distributeToDays(w)}
                    className="px-4 py-2 bg-accent text-accent-foreground rounded-full text-sm font-medium hover:opacity-90"
                  >توزيع على الأيام</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <input
                  className="input"
                  placeholder="طابع الأسبوع"
                  defaultValue={w.week_theme}
                  onBlur={e => update("Weekly_Plans", w.week_id, { week_theme: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="تركيز الأسبوع"
                  defaultValue={w.week_focus}
                  onBlur={e => update("Weekly_Plans", w.week_id, { week_focus: e.target.value })}
                />
              </div>
              {w.status === "موزع" && (
                <p className="text-xs text-accent mt-3">✓ موزع على الأيام</p>
              )}
            </Card>
          ))}
        </div>
      )}

      <style>{`
        .input { width: 100%; padding: 10px 14px; background: var(--muted); border: 1px solid var(--border); border-radius: 12px; font: inherit; outline: none; }
        .input:focus { border-color: var(--accent); }
      `}</style>
    </Shell>
  );
}
