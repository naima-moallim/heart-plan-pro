import { createFileRoute } from "@tanstack/react-router";
import { Shell, PageHeader, Card, Empty } from "@/components/Shell";
import { useRows, create, update, remove } from "@/lib/store";
import { fmtDate, todayISO } from "@/lib/dates";
import { TASK_CATEGORIES, TASK_STATUSES, PRIORITIES, ENERGY_LEVELS } from "@/lib/constants";
import { useState } from "react";

export const Route = createFileRoute("/day")({
  validateSearch: (s: Record<string, unknown>) => ({
    tired: s.tired === true || s.tired === "true",
    date: (s.date as string) || "",
  }),
  head: () => ({ meta: [{ title: "اليوم" }] }),
  component: DayPage,
});

function DayPage() {
  const { tired, date: searchDate } = Route.useSearch();
  const date = searchDate || todayISO();
  const dailyPlans = useRows("Daily_Plans", { date });
  const plan = dailyPlans[0];
  const tasks = useRows("Tasks", { date });
  const habits = useRows("Habits");
  const logs = useRows("Habit_Logs", { date });

  const [quickTask, setQuickTask] = useState("");

  const visibleTasks = tired
    ? tasks.filter(t => t.priority === "عالية" || t.category === "صحة").slice(0, 3)
    : tasks;

  const ensurePlan = (patch: any) => {
    if (plan) update("Daily_Plans", plan.daily_plan_id, patch);
    else create("Daily_Plans", { date, ...patch });
  };

  const toggleTask = (t: any) => {
    update("Tasks", t.task_id, { status: t.status === "مكتملة" ? "لم تبدأ" : "مكتملة" });
  };

  const postpone = (t: any) => {
    const choice = prompt("اختاري: 1=للغد، 2=للأسبوع القادم، 3=حذف، أو تاريخ YYYY-MM-DD", "1");
    if (!choice) return;
    if (choice === "3") { remove("Tasks", t.task_id); return; }
    let newDate = t.date;
    if (choice === "1") {
      const d = new Date(date); d.setDate(d.getDate() + 1);
      newDate = d.toISOString().slice(0, 10);
    } else if (choice === "2") {
      const d = new Date(date); d.setDate(d.getDate() + 7);
      newDate = d.toISOString().slice(0, 10);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(choice)) {
      newDate = choice;
    }
    update("Tasks", t.task_id, { date: newDate, status: "مؤجلة", postponed_count: (t.postponed_count || 0) + 1 });
  };

  const addQuick = () => {
    if (!quickTask.trim()) return;
    create("Tasks", { task_title: quickTask, date, category: "شخصي", priority: "متوسطة", status: "لم تبدأ" });
    setQuickTask("");
  };

  const isHabitDone = (h: any) => logs.some(l => l.habit_id === h.habit_id && l.status === "تم");
  const toggleHabit = (h: any) => {
    const existing = logs.find(l => l.habit_id === h.habit_id);
    if (existing) update("Habit_Logs", existing.log_id, { status: existing.status === "تم" ? "لم يتم" : "تم" });
    else create("Habit_Logs", { habit_id: h.habit_id, date, status: "تم" });
  };

  return (
    <Shell>
      <PageHeader
        title={tired ? "يوم خفيف 🌿" : "اليوم"}
        subtitle={fmtDate(date)}
        action={
          <a
            href={tired ? `?date=${date}` : `?date=${date}&tired=true`}
            className="px-5 py-2.5 bg-secondary rounded-full text-sm font-medium"
          >
            {tired ? "العودة للعرض العادي" : "أنا تعبانة اليوم"}
          </a>
        }
      />

      {tired && (
        <Card className="mb-6 bg-blush/40 border-blush">
          <p className="font-serif text-lg">اليوم لا نحتاج الكمال، خطوة صغيرة تكفي.</p>
          <p className="text-sm text-muted-foreground mt-2">عرضنا لكِ فقط ٣ مهام ضرورية وأخفينا الباقي. ارتاحي.</p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Right col: day plan */}
        <Card className="lg:col-span-1">
          <h3 className="font-serif text-lg font-bold mb-4">خطة اليوم</h3>
          <Field label="طابع اليوم">
            <input className="input" defaultValue={plan?.day_theme || ""} onBlur={e => ensurePlan({ day_theme: e.target.value })} />
          </Field>
          <Field label="مستوى الطاقة" className="mt-3">
            <select className="input" defaultValue={plan?.energy_level || "متوسطة"} onChange={e => ensurePlan({ energy_level: e.target.value })}>
              {ENERGY_LEVELS.map(e => <option key={e}>{e}</option>)}
            </select>
          </Field>
          <div className="mt-4">
            <span className="text-xs text-muted-foreground font-medium block mb-2">أهم ٣ أولويات</span>
            {[1,2,3].map(i => (
              <input
                key={i}
                className="input mb-2"
                placeholder={`الأولوية ${i}`}
                defaultValue={plan?.[`top_priority_${i}`] || ""}
                onBlur={e => ensurePlan({ [`top_priority_${i}`]: e.target.value })}
              />
            ))}
          </div>
          <Field label="ما الذي سأتركه اليوم؟" className="mt-3">
            <input className="input" defaultValue={plan?.what_to_leave_today || ""} onBlur={e => ensurePlan({ what_to_leave_today: e.target.value })} />
          </Field>
        </Card>

        {/* Middle: tasks */}
        <Card className="lg:col-span-1">
          <h3 className="font-serif text-lg font-bold mb-4">المهام</h3>
          <div className="flex gap-2 mb-4">
            <input className="input flex-1" placeholder="مهمة سريعة..." value={quickTask}
              onChange={e => setQuickTask(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addQuick()}
            />
            <button onClick={addQuick} className="px-4 bg-accent text-accent-foreground rounded-xl text-sm">+</button>
          </div>
          {visibleTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا مهام لليوم.</p>
          ) : (
            <ul className="space-y-2">
              {visibleTasks.map(t => (
                <li key={t.task_id} className="flex items-start gap-3 p-3 bg-muted/40 rounded-xl">
                  <button
                    onClick={() => toggleTask(t)}
                    className={`size-5 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center text-[10px] ${
                      t.status === "مكتملة" ? "bg-accent border-accent text-accent-foreground" : "border-border"
                    }`}
                  >{t.status === "مكتملة" && "✓"}</button>
                  <div className="flex-1">
                    <p className={`text-sm ${t.status === "مكتملة" ? "line-through text-muted-foreground" : ""}`}>{t.task_title}</p>
                    <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                      <span>{t.category}</span>
                      <span>·</span>
                      <span>{t.priority}</span>
                    </div>
                  </div>
                  <button onClick={() => postpone(t)} className="text-xs text-muted-foreground hover:text-accent">⋯</button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Left: habits */}
        <Card className="lg:col-span-1">
          <h3 className="font-serif text-lg font-bold mb-4">عادات اليوم</h3>
          {habits.length === 0 ? (
            <p className="text-sm text-muted-foreground">لم تضيفي عادات بعد.</p>
          ) : (
            <ul className="space-y-2">
              {habits.map(h => {
                const done = isHabitDone(h);
                return (
                  <li key={h.habit_id} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleHabit(h)}
                        className={`size-5 rounded border-2 flex items-center justify-center text-[10px] ${
                          done ? "bg-accent border-accent text-accent-foreground" : "border-border"
                        }`}
                      >{done && "✓"}</button>
                      <div>
                        <p className={`text-sm ${done ? "line-through text-muted-foreground" : ""}`}>{h.habit_name}</p>
                        <span className="text-[10px] text-muted-foreground">{h.category}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <style>{`
        .input { width: 100%; padding: 9px 12px; background: var(--muted); border: 1px solid var(--border); border-radius: 10px; font: inherit; outline: none; font-size: 14px; }
        .input:focus { border-color: var(--accent); }
      `}</style>
    </Shell>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs text-muted-foreground mb-2 font-medium">{label}</span>
      {children}
    </label>
  );
}
