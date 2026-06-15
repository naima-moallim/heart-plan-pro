import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell, PageHeader, Card, Empty } from "@/components/Shell";
import { useRows, create, update, remove } from "@/lib/store";
import { useState } from "react";
import { LIFE_AREAS } from "@/lib/constants";

export const Route = createFileRoute("/monthly-goals")({
  validateSearch: (s: Record<string, unknown>) => ({ cycle_id: (s.cycle_id as string) || "" }),
  head: () => ({ meta: [{ title: "أهداف الشهر" }] }),
  component: GoalsPage,
});

function GoalsPage() {
  const { cycle_id } = Route.useSearch();
  const cycles = useRows("Planning_Cycles");
  const values = useRows("Values");
  const goals = useRows("Monthly_Goals", cycle_id ? { cycle_id } : undefined);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    goal_title: "", life_area: LIFE_AREAS[0] as string, linked_value_id: "",
    why_important: "", success_measure: "", blocking_belief: "",
  });

  const selectedCycle = cycles.find(c => c.cycle_id === cycle_id) || cycles[cycles.length - 1];
  const activeCycleId = selectedCycle?.cycle_id;

  const submit = () => {
    if (!form.goal_title || !activeCycleId) return;
    create("Monthly_Goals", { ...form, cycle_id: activeCycleId, status: "نشط", progress: 0 });
    setOpen(false);
    setForm({ ...form, goal_title: "", why_important: "", success_measure: "", blocking_belief: "" });
  };

  return (
    <Shell>
      <PageHeader
        title="أهداف الشهر"
        subtitle={selectedCycle ? `دورة: ${selectedCycle.cycle_name}` : "اختاري دورة أولاً"}
        action={
          activeCycleId && (
            <button onClick={() => setOpen(o => !o)} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium">
              {open ? "إلغاء" : "+ هدف جديد"}
            </button>
          )
        }
      />

      {!activeCycleId && (
        <Empty title="لا توجد دورة نشطة" hint="ابدئي بإنشاء دورة من صفحة خطتي." />
      )}

      {open && activeCycleId && (
        <Card className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="عنوان الهدف"><input className="input" value={form.goal_title} onChange={e => setForm({ ...form, goal_title: e.target.value })} placeholder="مثلاً: قراءة كتابين" /></Field>
            <Field label="مجال الحياة">
              <select className="input" value={form.life_area} onChange={e => setForm({ ...form, life_area: e.target.value })}>
                {LIFE_AREAS.map(a => <option key={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="القيمة المرتبطة">
              <select className="input" value={form.linked_value_id} onChange={e => setForm({ ...form, linked_value_id: e.target.value })}>
                <option value="">— بدون —</option>
                {values.map(v => <option key={v.value_id} value={v.value_id}>{v.value_name}</option>)}
              </select>
            </Field>
            <Field label="معيار النجاح"><input className="input" value={form.success_measure} onChange={e => setForm({ ...form, success_measure: e.target.value })} placeholder="كيف ستعرفين أنكِ حققتِه؟" /></Field>
            <Field label="لماذا هذا الهدف مهم؟" className="md:col-span-2">
              <textarea className="input resize-none" rows={2} value={form.why_important} onChange={e => setForm({ ...form, why_important: e.target.value })} />
            </Field>
            <Field label="ما المعتقد أو العائق الذي قد يقف في طريقك؟" className="md:col-span-2">
              <textarea className="input resize-none" rows={2} value={form.blocking_belief} onChange={e => setForm({ ...form, blocking_belief: e.target.value })} />
            </Field>
          </div>
          <button onClick={submit} className="mt-6 px-6 py-3 bg-accent text-accent-foreground rounded-full font-medium">إضافة الهدف</button>
        </Card>
      )}

      {activeCycleId && goals.length === 0 ? (
        <Empty title="لا توجد أهداف بعد" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(g => (
            <Card key={g.goal_id}>
              <div className="flex justify-between items-start gap-3 mb-3">
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-accent tracking-widest">{g.life_area}</span>
                  <h3 className="font-serif text-lg font-bold mt-1">{g.goal_title}</h3>
                </div>
                <button onClick={() => { if (confirm("حذف الهدف؟")) remove("Monthly_Goals", g.goal_id); }} className="text-xs text-muted-foreground hover:text-destructive">حذف</button>
              </div>
              {g.why_important && <p className="text-sm text-foreground/80 mb-2"><span className="text-muted-foreground">لماذا: </span>{g.why_important}</p>}
              {g.success_measure && <p className="text-sm text-foreground/80 mb-2"><span className="text-muted-foreground">النجاح: </span>{g.success_measure}</p>}
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-accent" style={{ width: `${g.progress || 0}%` }} />
                </div>
                <input
                  type="number" min={0} max={100} value={g.progress || 0}
                  onChange={e => update("Monthly_Goals", g.goal_id, { progress: Number(e.target.value) })}
                  className="w-16 text-xs text-center bg-muted rounded-md py-1"
                /> <span className="text-xs">%</span>
              </div>
              <div className="mt-4 flex gap-2">
                <Link to="/weekly" search={{ cycle_id: g.cycle_id } as any} className="chip">توزيع على الأسابيع</Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      <style>{`
        .input { width: 100%; padding: 10px 14px; background: var(--muted); border: 1px solid var(--border); border-radius: 12px; font: inherit; outline: none; }
        .input:focus { border-color: var(--accent); }
        .chip { display: inline-flex; padding: 6px 14px; background: var(--secondary); color: var(--foreground); border-radius: 999px; font-size: 12px; }
        .chip:hover { background: var(--accent); color: var(--accent-foreground); }
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
