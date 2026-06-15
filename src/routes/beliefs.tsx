import { createFileRoute } from "@tanstack/react-router";
import { Shell, PageHeader, Card, Empty } from "@/components/Shell";
import { useRows, create, remove } from "@/lib/store";
import { BELIEF_CATEGORIES } from "@/lib/constants";
import { useState } from "react";

export const Route = createFileRoute("/beliefs")({
  head: () => ({ meta: [{ title: "تفكيك المعتقدات" }] }),
  component: BeliefsPage,
});

const FIELDS: [string, string, string][] = [
  ["old_belief", "المعتقد القديم", "مثلاً: لا أستحق الراحة"],
  ["source", "مصدر المعتقد", "من أين جاء؟"],
  ["how_it_appears", "كيف يظهر في حياتي؟", ""],
  ["damage", "الضرر", "ما الذي يكلفني؟"],
  ["new_belief", "المعتقد الجديد", "ما البديل الذي يخدمك؟"],
  ["evidence", "الدليل", "ما يدعم المعتقد الجديد"],
  ["small_action", "الخطوة الصغيرة", "ماذا ستفعلين اليوم؟"],
];

function BeliefsPage() {
  const list = useRows("Beliefs");
  const [form, setForm] = useState<any>({ belief_category: BELIEF_CATEGORIES[0] });

  const submit = () => {
    if (!form.old_belief) return;
    create("Beliefs", form);
    setForm({ belief_category: BELIEF_CATEGORIES[0] });
  };

  return (
    <Shell>
      <PageHeader title="تفكيك المعتقدات" subtitle="كل معتقد قديم تستطيعين تحويله، خطوة بخطوة." />

      <Card className="mb-6">
        <Field label="تصنيف المعتقد">
          <select className="input" value={form.belief_category} onChange={e => setForm({ ...form, belief_category: e.target.value })}>
            {BELIEF_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {FIELDS.map(([k, label, ph]) => (
            <Field key={k} label={label}>
              <textarea className="input resize-none" rows={2} placeholder={ph} value={form[k] || ""} onChange={e => setForm({ ...form, [k]: e.target.value })} />
            </Field>
          ))}
        </div>
        <button onClick={submit} className="mt-6 px-6 py-3 bg-accent text-accent-foreground rounded-full font-medium">حفظ</button>
      </Card>

      {list.length === 0 ? <Empty title="لا توجد سجلات بعد" /> : (
        <div className="space-y-4">
          {list.map(b => (
            <Card key={b.belief_id}>
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold text-accent tracking-widest">{b.belief_category}</span>
                <button onClick={() => { if (confirm("حذف؟")) remove("Beliefs", b.belief_id); }} className="text-xs text-muted-foreground hover:text-destructive">حذف</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <p><span className="text-muted-foreground">القديم:</span> {b.old_belief}</p>
                <p><span className="text-accent font-medium">الجديد:</span> {b.new_belief}</p>
                {b.damage && <p><span className="text-muted-foreground">الضرر:</span> {b.damage}</p>}
                {b.evidence && <p><span className="text-muted-foreground">الدليل:</span> {b.evidence}</p>}
                {b.small_action && <p className="md:col-span-2"><span className="text-muted-foreground">خطوة اليوم:</span> {b.small_action}</p>}
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
  return <label className={`block ${className}`}><span className="block text-xs text-muted-foreground mb-2 font-medium">{label}</span>{children}</label>;
}
