import { createFileRoute } from "@tanstack/react-router";
import { Shell, PageHeader, Card, Empty } from "@/components/Shell";
import { useRows, create, remove } from "@/lib/store";
import { INFLUENCE_TYPES } from "@/lib/constants";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/influences")({
  head: () => ({ meta: [{ title: "رصد المؤثرات" }] }),
  component: InfluencesPage,
});

function InfluencesPage() {
  const list = useRows("Influences");
  const [form, setForm] = useState<any>({ influence_type: INFLUENCE_TYPES[0], is_temporary: "نعم" });

  const submit = () => {
    if (!form.what_helps && !form.what_challenges) return;
    create("Influences", form);
    setForm({ influence_type: INFLUENCE_TYPES[0], is_temporary: "نعم" });
  };

  return (
    <Shell>
      <PageHeader title="رصد المؤثرات" subtitle="ما الذي يساعدك وما الذي يصعّب عليكِ في كل جانب من حياتك؟" />

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="نوع المؤثر">
            <select className="input" value={form.influence_type} onChange={e => setForm({ ...form, influence_type: e.target.value })}>
              {INFLUENCE_TYPES.map(i => <option key={i}>{i}</option>)}
            </select>
          </Field>
          <Field label="مؤقت؟">
            <select className="input" value={form.is_temporary} onChange={e => setForm({ ...form, is_temporary: e.target.value })}>
              <option>نعم</option><option>لا</option>
            </select>
          </Field>
          <Field label="ما الذي يساعدني؟"><textarea className="input resize-none" rows={2} value={form.what_helps || ""} onChange={e => setForm({ ...form, what_helps: e.target.value })} /></Field>
          <Field label="ما الذي يصعب علي؟"><textarea className="input resize-none" rows={2} value={form.what_challenges || ""} onChange={e => setForm({ ...form, what_challenges: e.target.value })} /></Field>
          <Field label="الحل الممكن"><textarea className="input resize-none" rows={2} value={form.possible_solution || ""} onChange={e => setForm({ ...form, possible_solution: e.target.value })} /></Field>
          <Field label="الدعم المطلوب"><textarea className="input resize-none" rows={2} value={form.needed_support || ""} onChange={e => setForm({ ...form, needed_support: e.target.value })} /></Field>
        </div>
        <button onClick={submit} className="mt-6 px-6 py-3 bg-accent text-accent-foreground rounded-full font-medium">حفظ</button>
      </Card>

      {list.length === 0 ? <Empty title="لا توجد سجلات بعد" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map(i => (
            <Card key={i.influence_id}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-accent tracking-widest">{i.influence_type}</span>
                <button onClick={() => { if (confirm("حذف؟")) remove("Influences", i.influence_id); }} className="text-xs text-muted-foreground hover:text-destructive">حذف</button>
              </div>
              {i.what_helps && <p className="text-sm"><span className="text-muted-foreground">يساعد:</span> {i.what_helps}</p>}
              {i.what_challenges && <p className="text-sm mt-1"><span className="text-muted-foreground">يصعب:</span> {i.what_challenges}</p>}
              {i.possible_solution && <p className="text-sm mt-1 text-accent">حل: {i.possible_solution}</p>}
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
