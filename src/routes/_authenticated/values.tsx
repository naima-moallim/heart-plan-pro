import { createFileRoute } from "@tanstack/react-router";
import { Shell, PageHeader, Card, Empty } from "@/components/Shell";
import { useRows, create, remove } from "@/lib/store";
import { VALUE_QUESTIONS } from "@/lib/constants";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/values")({
  head: () => ({ meta: [{ title: "القيم" }] }),
  component: ValuesPage,
});

function ValuesPage() {
  const values = useRows("Values");
  const [showQs, setShowQs] = useState(true);
  const [form, setForm] = useState({ value_name: "", description: "", why_important: "", evidence_from_life: "" });

  const submit = () => {
    if (!form.value_name) return;
    create("Values", form);
    setForm({ value_name: "", description: "", why_important: "", evidence_from_life: "" });
  };

  return (
    <Shell>
      <PageHeader title="قيمي" subtitle="اختاري أعلى ٥ قيم لكِ. كل هدف وعادة سترتبط بقيمة منها." />

      {showQs && (
        <Card className="mb-6 bg-secondary/30">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-serif text-lg font-bold">أسئلة اكتشاف القيم</h3>
            <button onClick={() => setShowQs(false)} className="text-xs text-muted-foreground">إخفاء</button>
          </div>
          <ol className="space-y-2 text-sm list-decimal pr-5 text-foreground/80">
            {VALUE_QUESTIONS.map((q, i) => <li key={i}>{q}</li>)}
          </ol>
        </Card>
      )}

      <Card className="mb-6">
        <h3 className="font-serif text-lg font-bold mb-4">أضيفي قيمة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="اسم القيمة"><input className="input" value={form.value_name} onChange={e => setForm({ ...form, value_name: e.target.value })} placeholder="مثلاً: الإحسان" /></Field>
          <Field label="وصف موجز"><input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="لماذا هي مهمة لكِ؟" className="md:col-span-2">
            <textarea className="input resize-none" rows={2} value={form.why_important} onChange={e => setForm({ ...form, why_important: e.target.value })} />
          </Field>
          <Field label="دليل من حياتك على هذه القيمة" className="md:col-span-2">
            <textarea className="input resize-none" rows={2} value={form.evidence_from_life} onChange={e => setForm({ ...form, evidence_from_life: e.target.value })} />
          </Field>
        </div>
        <button onClick={submit} className="mt-6 px-6 py-3 bg-accent text-accent-foreground rounded-full font-medium">إضافة القيمة</button>
      </Card>

      {values.length === 0 ? <Empty title="لم تضيفي قيماً بعد" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {values.map(v => (
            <Card key={v.value_id}>
              <div className="flex justify-between items-start">
                <h3 className="font-serif text-xl font-bold text-primary">{v.value_name}</h3>
                <button onClick={() => { if (confirm("حذف؟")) remove("Values", v.value_id); }} className="text-xs text-muted-foreground hover:text-destructive">حذف</button>
              </div>
              {v.description && <p className="text-sm mt-1 text-foreground/80">{v.description}</p>}
              {v.why_important && <p className="text-sm text-muted-foreground mt-3"><span className="font-medium">لماذا: </span>{v.why_important}</p>}
              {v.evidence_from_life && <p className="text-sm text-muted-foreground mt-2"><span className="font-medium">الدليل: </span>{v.evidence_from_life}</p>}
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
