import { createFileRoute } from "@tanstack/react-router";
import { Shell, PageHeader, Card } from "@/components/Shell";
import { useRows, create } from "@/lib/store";
import { todayISO, fmtDate } from "@/lib/dates";
import { useState } from "react";

export const Route = createFileRoute("/reviews")({
  head: () => ({ meta: [{ title: "المراجعات" }] }),
  component: ReviewsPage,
});

function ReviewsPage() {
  const [tab, setTab] = useState<"daily" | "weekly" | "monthly">("daily");

  return (
    <Shell>
      <PageHeader title="المراجعات" subtitle="مراجعة لطيفة، بلا أحكام — لتعرفي إلى أين تتجهين." />

      <div className="flex gap-2 mb-6">
        {[["daily","يومية"],["weekly","أسبوعية"],["monthly","شهرية"]].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k as any)}
            className={`px-5 py-2 rounded-full text-sm font-medium ${tab === k ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
          >{l}</button>
        ))}
      </div>

      {tab === "daily" && <DailyReview />}
      {tab === "weekly" && <WeeklyReview />}
      {tab === "monthly" && <MonthlyReview />}
    </Shell>
  );
}

function DailyReview() {
  const list = useRows("Daily_Reviews");
  const [form, setForm] = useState<any>({ date: todayISO(), day_rating: 7 });

  const submit = () => { create("Daily_Reviews", form); setForm({ date: todayISO(), day_rating: 7 }); };

  const fields: [string, string][] = [
    ["completed_today", "ماذا أنجزتِ اليوم؟"],
    ["postponed_today", "ماذا تأجل؟"],
    ["feeling", "شعورك اليوم"],
    ["gratitude", "شيء أمتنّ له"],
    ["lesson", "الدرس"],
    ["tomorrow_step", "خطوة الغد"],
  ];

  return (
    <>
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(([k, l]) => (
            <Field key={k} label={l}><textarea className="input resize-none" rows={2} value={form[k] || ""} onChange={e => setForm({ ...form, [k]: e.target.value })} /></Field>
          ))}
          <Field label={`تقييم اليوم: ${form.day_rating}/10`}>
            <input type="range" min={1} max={10} value={form.day_rating} onChange={e => setForm({ ...form, day_rating: Number(e.target.value) })} className="w-full accent-accent" />
          </Field>
        </div>
        <button onClick={submit} className="mt-6 px-6 py-3 bg-accent text-accent-foreground rounded-full font-medium">حفظ المراجعة</button>
      </Card>
      <ReviewList list={list} idKey="review_id" />
      <Style />
    </>
  );
}

function WeeklyReview() {
  const list = useRows("Weekly_Reviews");
  const [form, setForm] = useState<any>({});
  const submit = () => { create("Weekly_Reviews", form); setForm({}); };
  const fields: [string, string][] = [
    ["best_achievement", "أفضل إنجاز"],
    ["most_postponed", "أكثر شيء تأجل"],
    ["best_habit", "أفضل عادة"],
    ["hardest_day", "أصعب يوم"],
    ["what_to_reduce", "ما الذي أحتاج أن أخفف؟"],
    ["next_week_plan", "خطة الأسبوع القادم"],
    ["next_week_theme", "طابع الأسبوع القادم"],
  ];
  return (
    <>
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(([k, l]) => (
            <Field key={k} label={l}><textarea className="input resize-none" rows={2} value={form[k] || ""} onChange={e => setForm({ ...form, [k]: e.target.value })} /></Field>
          ))}
        </div>
        <button onClick={submit} className="mt-6 px-6 py-3 bg-accent text-accent-foreground rounded-full font-medium">حفظ</button>
      </Card>
      <ReviewList list={list} idKey="weekly_review_id" />
      <Style />
    </>
  );
}

function MonthlyReview() {
  const list = useRows("Monthly_Reviews");
  const [form, setForm] = useState<any>({});
  const submit = () => { create("Monthly_Reviews", form); setForm({}); };
  const fields: [string, string][] = [
    ["completed_goals", "الأهداف المكتملة"],
    ["uncompleted_goals", "الأهداف غير المكتملة"],
    ["why_not_completed", "لماذا لم تكتمل؟"],
    ["successful_habits", "العادات الناجحة"],
    ["habits_to_adjust", "العادات التي تحتاج تعديل"],
    ["best_area", "أفضل مجال"],
    ["area_needs_attention", "المجال الذي يحتاج اهتمام"],
    ["next_month_theme", "طابع الشهر القادم"],
  ];
  return (
    <>
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(([k, l]) => (
            <Field key={k} label={l}><textarea className="input resize-none" rows={2} value={form[k] || ""} onChange={e => setForm({ ...form, [k]: e.target.value })} /></Field>
          ))}
        </div>
        <button onClick={submit} className="mt-6 px-6 py-3 bg-accent text-accent-foreground rounded-full font-medium">حفظ</button>
      </Card>
      <ReviewList list={list} idKey="monthly_review_id" />
      <Style />
    </>
  );
}

function ReviewList({ list, idKey }: { list: any[]; idKey: string }) {
  if (!list.length) return <p className="text-sm text-muted-foreground text-center">لا مراجعات سابقة بعد.</p>;
  return (
    <div className="space-y-3">
      {list.slice().reverse().slice(0, 5).map(r => (
        <Card key={r[idKey]}>
          <p className="text-xs text-muted-foreground mb-2">{r.date ? fmtDate(r.date) : fmtDate(r.created_at)}</p>
          <div className="text-sm space-y-1 text-foreground/80">
            {Object.entries(r).filter(([k, v]) => v && !["created_at","user_id",idKey,"cycle_id","week_id","date"].includes(k)).slice(0, 4).map(([k, v]) => (
              <p key={k}><span className="text-muted-foreground">{k}:</span> {String(v)}</p>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-xs text-muted-foreground mb-2 font-medium">{label}</span>{children}</label>;
}
function Style() {
  return <style>{`.input { width: 100%; padding: 10px 14px; background: var(--muted); border: 1px solid var(--border); border-radius: 12px; font: inherit; outline: none; } .input:focus { border-color: var(--accent); }`}</style>;
}
