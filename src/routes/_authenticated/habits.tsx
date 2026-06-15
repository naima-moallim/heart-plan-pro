import { createFileRoute } from "@tanstack/react-router";
import { Shell, PageHeader, Card, Empty } from "@/components/Shell";
import { useRows, create, update, remove } from "@/lib/store";
import { HABIT_CATEGORIES, HABIT_LIBRARY } from "@/lib/constants";
import { useState } from "react";

export const Route = createFileRoute("/habits")({
  head: () => ({ meta: [{ title: "عاداتي" }] }),
  component: HabitsPage,
});

function HabitsPage() {
  const habits = useRows("Habits");
  const values = useRows("Values");
  const goals = useRows("Monthly_Goals");
  const [open, setOpen] = useState(false);
  const [showLib, setShowLib] = useState(false);
  const [form, setForm] = useState({
    habit_name: "", category: HABIT_CATEGORIES[0] as string,
    frequency: "يومي", reminder_time: "",
    linked_value_id: "", linked_goal_id: "",
  });

  const submit = (overrides: any = {}) => {
    const payload = { ...form, ...overrides, status: "نشطة" };
    if (!payload.habit_name) return;
    create("Habits", payload);
    setForm({ ...form, habit_name: "" });
    setOpen(false);
  };

  const logs = useRows("Habit_Logs");
  const completion = (habitId: string) => {
    const hl = logs.filter(l => l.habit_id === habitId);
    if (!hl.length) return 0;
    return Math.round((hl.filter(l => l.status === "تم").length / hl.length) * 100);
  };

  return (
    <Shell>
      <PageHeader
        title="عاداتي"
        subtitle="بناء حياة حقيقية يحدث بتكرار صغير، ليس بقفزات كبيرة."
        action={
          <div className="flex gap-2">
            <button onClick={() => setShowLib(s => !s)} className="px-4 py-2 bg-secondary rounded-full text-sm">📚 مكتبة العادات</button>
            <button onClick={() => setOpen(o => !o)} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium">
              {open ? "إلغاء" : "+ عادة جديدة"}
            </button>
          </div>
        }
      />

      {showLib && (
        <Card className="mb-6">
          <h3 className="font-serif text-lg font-bold mb-4">مكتبة العادات الجاهزة</h3>
          <div className="space-y-4">
            {Object.entries(HABIT_LIBRARY).map(([cat, list]) => (
              <div key={cat}>
                <h4 className="text-sm font-bold text-accent mb-2">{cat}</h4>
                <div className="flex flex-wrap gap-2">
                  {list.map(name => (
                    <button
                      key={name}
                      onClick={() => create("Habits", { habit_name: name, category: cat, frequency: "يومي", status: "نشطة" })}
                      className="px-3 py-1.5 bg-muted hover:bg-accent hover:text-accent-foreground rounded-full text-xs transition-colors"
                    >+ {name}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {open && (
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="اسم العادة"><input className="input" value={form.habit_name} onChange={e => setForm({ ...form, habit_name: e.target.value })} /></Field>
            <Field label="التصنيف">
              <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {HABIT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="التكرار">
              <select className="input" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
                <option>يومي</option><option>أسبوعي</option><option>عدة مرات أسبوعياً</option>
              </select>
            </Field>
            <Field label="وقت التذكير"><input type="time" className="input" value={form.reminder_time} onChange={e => setForm({ ...form, reminder_time: e.target.value })} /></Field>
            <Field label="القيمة المرتبطة">
              <select className="input" value={form.linked_value_id} onChange={e => setForm({ ...form, linked_value_id: e.target.value })}>
                <option value="">— بدون —</option>
                {values.map(v => <option key={v.value_id} value={v.value_id}>{v.value_name}</option>)}
              </select>
            </Field>
            <Field label="الهدف المرتبط">
              <select className="input" value={form.linked_goal_id} onChange={e => setForm({ ...form, linked_goal_id: e.target.value })}>
                <option value="">— بدون —</option>
                {goals.map(g => <option key={g.goal_id} value={g.goal_id}>{g.goal_title}</option>)}
              </select>
            </Field>
          </div>
          <button onClick={() => submit()} className="mt-6 px-6 py-3 bg-accent text-accent-foreground rounded-full font-medium">إضافة العادة</button>
        </Card>
      )}

      {habits.length === 0 ? (
        <Empty title="لا توجد عادات بعد" hint="ابدئي بإضافة عادة، أو افتحي مكتبة العادات." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {habits.map(h => (
            <Card key={h.habit_id}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-accent tracking-widest">{h.category}</span>
                <button onClick={() => { if (confirm("حذف العادة؟")) remove("Habits", h.habit_id); }} className="text-xs text-muted-foreground hover:text-destructive">حذف</button>
              </div>
              <h3 className="font-serif text-lg font-bold mb-1">{h.habit_name}</h3>
              <p className="text-xs text-muted-foreground">{h.frequency}{h.reminder_time && ` · ${h.reminder_time}`}</p>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">نسبة الالتزام</span>
                  <span className="font-medium">{completion(h.habit_id)}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-accent" style={{ width: `${completion(h.habit_id)}%` }} />
                </div>
              </div>
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

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs text-muted-foreground mb-2 font-medium">{label}</span>
      {children}
    </label>
  );
}
