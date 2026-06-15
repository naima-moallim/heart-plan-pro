import { createFileRoute } from "@tanstack/react-router";
import { Shell, PageHeader, Card, Empty } from "@/components/Shell";
import { useRows, create, remove } from "@/lib/store";
import { MINDSET_TYPES } from "@/lib/constants";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/mindset")({
  head: () => ({ meta: [{ title: "اكتشاف العقلية" }] }),
  component: MindsetPage,
});

function MindsetPage() {
  const list = useRows("Mindset");
  const [form, setForm] = useState<any>({ mindset_type: MINDSET_TYPES[0] });

  const submit = () => {
    if (!form.current_sentence) return;
    create("Mindset", form);
    setForm({ mindset_type: MINDSET_TYPES[0] });
  };

  return (
    <Shell>
      <PageHeader title="اكتشاف العقلية" subtitle="حدّدي العقلية الحالية، ثم اختاري عقلية بديلة وخطوة عملية." />

      <Card className="mb-6">
        <Field label="نوع العقلية">
          <select className="input" value={form.mindset_type} onChange={e => setForm({ ...form, mindset_type: e.target.value })}>
            {MINDSET_TYPES.map(m => <option key={m}>{m}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Field label="الجملة الحالية"><textarea className="input resize-none" rows={2} value={form.current_sentence || ""} onChange={e => setForm({ ...form, current_sentence: e.target.value })} /></Field>
          <Field label="الجملة البديلة"><textarea className="input resize-none" rows={2} value={form.new_sentence || ""} onChange={e => setForm({ ...form, new_sentence: e.target.value })} /></Field>
          <Field label="الخطوة العملية"><textarea className="input resize-none" rows={2} value={form.practical_step || ""} onChange={e => setForm({ ...form, practical_step: e.target.value })} /></Field>
          <Field label="الدليل على التغيير"><textarea className="input resize-none" rows={2} value={form.evidence_of_change || ""} onChange={e => setForm({ ...form, evidence_of_change: e.target.value })} /></Field>
        </div>
        <button onClick={submit} className="mt-6 px-6 py-3 bg-accent text-accent-foreground rounded-full font-medium">حفظ</button>
      </Card>

      {list.length === 0 ? <Empty title="لا توجد سجلات بعد" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map(m => (
            <Card key={m.mindset_id}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-accent tracking-widest">{m.mindset_type}</span>
                <button onClick={() => { if (confirm("حذف؟")) remove("Mindset", m.mindset_id); }} className="text-xs text-muted-foreground hover:text-destructive">حذف</button>
              </div>
              <p className="text-sm"><span className="text-muted-foreground">الحالية:</span> {m.current_sentence}</p>
              <p className="text-sm mt-2 text-accent"><span className="font-medium">البديلة:</span> {m.new_sentence}</p>
              {m.practical_step && <p className="text-sm mt-2"><span className="text-muted-foreground">الخطوة:</span> {m.practical_step}</p>}
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
