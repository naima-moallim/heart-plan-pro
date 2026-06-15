import { createFileRoute } from "@tanstack/react-router";
import { Shell, PageHeader, Card } from "@/components/Shell";
import { useRows, create } from "@/lib/store";
import { INNER_SEASONS, SEASON_SUGGESTIONS } from "@/lib/constants";
import { todayISO, fmtDate } from "@/lib/dates";
import { useState } from "react";

export const Route = createFileRoute("/inner-seasons")({
  head: () => ({ meta: [{ title: "الفصل الداخلي" }] }),
  component: SeasonsPage,
});

function SeasonsPage() {
  const list = useRows("Inner_Seasons");
  const latest = list[list.length - 1];
  const [selected, setSelected] = useState<string>(latest?.season_type || "");

  const save = (season: string) => {
    setSelected(season);
    const s = SEASON_SUGGESTIONS[season];
    create("Inner_Seasons", { date: todayISO(), season_type: season, suitable_practices: s.practices, energy_note: s.energy });
  };

  const current = selected ? SEASON_SUGGESTIONS[selected] : null;

  return (
    <Shell>
      <PageHeader title="فصلك الداخلي" subtitle="حياتك ليست خطاً واحداً — لها فصول. أيّ فصل تعيشين الآن؟" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {INNER_SEASONS.map(s => (
          <button
            key={s}
            onClick={() => save(s)}
            className={`p-6 rounded-3xl border-2 transition-all ${
              selected === s ? "border-accent bg-accent/10" : "border-border bg-card hover:border-accent/50"
            }`}
          >
            <p className="font-serif text-lg font-bold">{s}</p>
          </button>
        ))}
      </div>

      {current && (
        <Card className="bg-secondary/40">
          <h3 className="font-serif text-2xl font-bold mb-4 text-primary">{selected}</h3>
          <div className="space-y-3 text-sm">
            <p><span className="text-muted-foreground font-medium">الممارسات المناسبة: </span>{current.practices}</p>
            <p><span className="text-muted-foreground font-medium">الطاقة: </span>{current.energy}</p>
            <p className="text-lg font-serif italic text-primary mt-6 pt-4 border-t border-border">{current.message}</p>
          </div>
        </Card>
      )}

      {list.length > 0 && (
        <div className="mt-8">
          <h3 className="font-serif text-lg font-bold mb-4">سجل الفصول</h3>
          <div className="space-y-2">
            {list.slice().reverse().slice(0, 10).map(s => (
              <div key={s.season_id} className="flex justify-between p-3 bg-card border border-border rounded-xl text-sm">
                <span>{s.season_type}</span>
                <span className="text-muted-foreground">{fmtDate(s.date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Shell>
  );
}
