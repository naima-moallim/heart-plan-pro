import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell, PageHeader, Card, Empty } from "@/components/Shell";
import { useRows, create, remove, bulkCreate, update } from "@/lib/store";
import { useState } from "react";
import { buildWeeks, fmtDate, todayISO } from "@/lib/dates";
import { format, addMonths } from "date-fns";

export const Route = createFileRoute("/cycle")({
  head: () => ({ meta: [{ title: "خطتي — دورات التخطيط" }] }),
  component: CyclePage,
});

function CyclePage() {
  const cycles = useRows("Planning_Cycles");
  const [open, setOpen] = useState(false);
  const today = todayISO();
  const [form, setForm] = useState({
    cycle_name: "",
    start_date: today,
    end_date: format(addMonths(new Date(), 1), "yyyy-MM-dd"),
    theme: "",
    vision: "",
  });

  const submit = () => {
    if (!form.cycle_name) return;
    const cycle = create("Planning_Cycles", { ...form, cycle_type: "شهرية", status: "نشطة" });
    const weeks = buildWeeks(form.start_date, form.end_date);
    bulkCreate("Weekly_Plans", weeks.map(w => ({
      cycle_id: cycle.cycle_id,
      week_number: w.week_number,
      start_date: w.start_date,
      end_date: w.end_date,
      week_theme: "",
      week_focus: "",
      status: "نشط",
    })));
    setOpen(false);
    setForm({ ...form, cycle_name: "", theme: "", vision: "" });
  };

  return (
    <Shell>
      <PageHeader
        title="دورات التخطيط"
        subtitle="كل دورة فترة تختارينها لتخططي خلالها — شهر، أربعون يوماً، أو أي مدة تناسبك."
        action={
          <button
            onClick={() => setOpen(o => !o)}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90"
          >
            {open ? "إلغاء" : "+ دورة جديدة"}
          </button>
        }
      />

      {open && (
        <Card className="mb-8">
          <h3 className="font-serif text-xl font-bold mb-6">دورة تخطيط جديدة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="اسم الدورة">
              <input
                value={form.cycle_name}
                onChange={e => setForm({ ...form, cycle_name: e.target.value })}
                placeholder="مثلاً: شهر التروي"
                className="input"
              />
            </Field>
            <Field label="طابع الدورة">
              <input
                value={form.theme}
                onChange={e => setForm({ ...form, theme: e.target.value })}
                placeholder="مثلاً: السكون"
                className="input"
              />
            </Field>
            <Field label="تاريخ البداية">
              <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="input" />
            </Field>
            <Field label="تاريخ النهاية">
              <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="input" />
            </Field>
          </div>
          <Field label="نية الدورة" className="mt-4">
            <textarea
              value={form.vision}
              onChange={e => setForm({ ...form, vision: e.target.value })}
              placeholder="ما الذي تودين أن تعيشيه في هذه الفترة؟"
              rows={3}
              className="input resize-none"
            />
          </Field>
          <button
            onClick={submit}
            className="mt-6 w-full md:w-auto px-6 py-3 bg-accent text-accent-foreground rounded-full font-medium hover:opacity-90"
          >
            إنشاء الدورة + توليد الأسابيع تلقائياً
          </button>
        </Card>
      )}

      {cycles.length === 0 ? (
        <Empty title="لا توجد دورات بعد" hint="ابدئي بإنشاء دورة جديدة من الزر أعلاه." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cycles.slice().reverse().map(c => (
            <Card key={c.cycle_id}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-serif text-xl font-bold">{c.cycle_name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fmtDate(c.start_date)} — {fmtDate(c.end_date)}
                  </p>
                </div>
                <button
                  onClick={() => { if (confirm("حذف الدورة؟")) remove("Planning_Cycles", c.cycle_id); }}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >حذف</button>
              </div>
              {c.theme && <p className="text-sm mb-2"><span className="text-muted-foreground">الطابع:</span> {c.theme}</p>}
              {c.vision && <p className="text-sm text-foreground/80 leading-relaxed">{c.vision}</p>}
              <div className="mt-5 flex gap-2 flex-wrap">
                <Link to="/monthly-goals" search={{ cycle_id: c.cycle_id } as any} className="chip">أهداف الشهر</Link>
                <Link to="/weekly" search={{ cycle_id: c.cycle_id } as any} className="chip">الأسابيع</Link>
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
