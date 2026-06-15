import { createFileRoute } from "@tanstack/react-router";
import { Shell, PageHeader, Card } from "@/components/Shell";
import { useRows } from "@/lib/store";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "التقارير" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const tasks = useRows("Tasks");
  const habits = useRows("Habits");
  const logs = useRows("Habit_Logs");
  const plans = useRows("Daily_Plans");
  const goals = useRows("Monthly_Goals");

  const completedTasks = tasks.filter(t => t.status === "مكتملة").length;
  const taskPct = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const habitDone = logs.filter(l => l.status === "تم").length;
  const habitPct = logs.length ? Math.round((habitDone / logs.length) * 100) : 0;

  const mostPostponed = tasks.slice().sort((a, b) => (b.postponed_count || 0) - (a.postponed_count || 0))[0];

  const habitFreq: Record<string, number> = {};
  logs.filter(l => l.status === "تم").forEach(l => {
    const h = habits.find(x => x.habit_id === l.habit_id);
    if (h) habitFreq[h.habit_name] = (habitFreq[h.habit_name] || 0) + 1;
  });
  const topHabit = Object.entries(habitFreq).sort((a, b) => b[1] - a[1])[0];

  const areaFreq: Record<string, number> = {};
  goals.forEach(g => { areaFreq[g.life_area] = (areaFreq[g.life_area] || 0) + 1; });
  const topArea = Object.entries(areaFreq).sort((a, b) => b[1] - a[1])[0];
  const neglectedArea = Object.entries(areaFreq).sort((a, b) => a[1] - b[1])[0];

  const energySum = plans.reduce((s, p) => s + ({ "خفيفة": 1, "متوسطة": 2, "عالية": 3 } as any)[p.energy_level || ""] || 0, 0);
  const avgEnergy = plans.length ? (energySum / plans.length).toFixed(1) : "—";

  const stats = [
    { label: "إنجاز المهام", value: `${taskPct}%`, hint: `${completedTasks} من ${tasks.length}` },
    { label: "الالتزام بالعادات", value: `${habitPct}%`, hint: `${habitDone} من ${logs.length} سجلاً` },
    { label: "أيام التخطيط", value: plans.length, hint: "خطة يومية" },
    { label: "أكثر مهمة تأجلت", value: mostPostponed?.task_title || "—", hint: mostPostponed ? `${mostPostponed.postponed_count} مرات` : "" },
    { label: "أكثر عادة التزاماً", value: topHabit?.[0] || "—", hint: topHabit ? `${topHabit[1]} مرة` : "" },
    { label: "أكثر مجال تركيزاً", value: topArea?.[0] || "—", hint: topArea ? `${topArea[1]} أهداف` : "" },
    { label: "المجال المهمل", value: neglectedArea?.[0] || "—", hint: neglectedArea ? `${neglectedArea[1]} هدف` : "" },
    { label: "متوسط الطاقة", value: avgEnergy, hint: "من 3" },
  ];

  return (
    <Shell>
      <PageHeader title="التقارير" subtitle="نظرة هادئة على ما حدث، لتقرّري ما القادم." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i}>
            <span className="text-xs text-muted-foreground font-medium block mb-2">{s.label}</span>
            <p className="font-serif text-2xl font-bold text-primary">{s.value}</p>
            {s.hint && <p className="text-xs text-muted-foreground mt-1">{s.hint}</p>}
          </Card>
        ))}
      </div>
    </Shell>
  );
}
