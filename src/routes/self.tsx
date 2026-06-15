import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell, PageHeader, Card } from "@/components/Shell";

export const Route = createFileRoute("/self")({
  head: () => ({ meta: [{ title: "أفهم نفسي" }] }),
  component: SelfPage,
});

const TILES = [
  { to: "/values", title: "القيم", icon: "🌟", desc: "اكتشفي قيمك الأساسية واربطيها بأهدافك." },
  { to: "/beliefs", title: "تفكيك المعتقدات", icon: "🪞", desc: "حوّلي معتقداً قديماً إلى آخر يخدمك." },
  { to: "/mindset", title: "اكتشاف العقلية", icon: "🧭", desc: "خمس عقليات تشكّل تجربتك في الحياة." },
  { to: "/influences", title: "رصد المؤثرات", icon: "🌬️", desc: "ما الذي يساعدك وما الذي يصعّب عليكِ؟" },
  { to: "/inner-seasons", title: "الفصل الداخلي", icon: "🍂", desc: "تعرّفي على فصلك الداخلي اليوم." },
];

function SelfPage() {
  return (
    <Shell>
      <PageHeader
        title="أفهم نفسي"
        subtitle="أدوات لطيفة لتقتربي من ذاتك دون أحكام."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {TILES.map(t => (
          <Link key={t.to} to={t.to} className="group">
            <Card className="h-full hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className="size-12 rounded-2xl bg-secondary/60 flex items-center justify-center text-xl mb-4 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">{t.icon}</div>
              <h3 className="font-serif text-xl font-bold mb-2">{t.title}</h3>
              <p className="text-sm text-muted-foreground">{t.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
