import { createFileRoute } from "@tanstack/react-router";
import { Shell, PageHeader, Card } from "@/components/Shell";
import { useAppsUrl, pullFromSheet, getUserId } from "@/lib/store";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "الإعدادات" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [url, setUrl] = useAppsUrl();
  const [draft, setDraft] = useState(url);
  const [pulling, setPulling] = useState(false);

  return (
    <Shell>
      <PageHeader title="الإعدادات" subtitle="ربط التطبيق بـ Google Sheets كقاعدة بيانات." />

      <Card className="mb-6">
        <h3 className="font-serif text-xl font-bold mb-2">ربط Google Sheets</h3>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          البيانات تُحفظ محلياً فوراً، وتُزامن مع Google Sheets إذا تم ربط رابط الـ Apps Script.
          الصقي رابط الـ Web App هنا:
        </p>
        <div className="flex gap-2 flex-wrap">
          <input
            className="input flex-1 min-w-[280px]"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            dir="ltr"
          />
          <button onClick={() => setUrl(draft.trim())} className="px-6 py-2.5 bg-accent text-accent-foreground rounded-full font-medium">
            حفظ
          </button>
          <button
            disabled={!url || pulling}
            onClick={async () => { setPulling(true); await pullFromSheet(); setPulling(false); alert("تم سحب البيانات من الـ Sheet"); }}
            className="px-6 py-2.5 bg-secondary rounded-full font-medium disabled:opacity-50"
          >
            {pulling ? "جارٍ السحب..." : "سحب البيانات من الـ Sheet"}
          </button>
        </div>
        <p className="text-xs mt-3 text-muted-foreground">
          الحالة: {url ? <span className="text-accent font-medium">متصل</span> : <span>غير متصل (يعمل محلياً)</span>}
        </p>
        <p className="text-xs mt-1 text-muted-foreground">معرّف المستخدم: <code dir="ltr">{getUserId()}</code></p>
      </Card>

      <Card>
        <h3 className="font-serif text-xl font-bold mb-3">طريقة التثبيت في 6 خطوات</h3>
        <ol className="space-y-3 text-sm text-foreground/85 list-decimal pr-5 leading-relaxed">
          <li>أنشئي ملف Google Sheet جديد فارغ.</li>
          <li>من القائمة العلوية: Extensions → Apps Script.</li>
          <li>
            افتحي ملف <a href="/apps-script.js" target="_blank" className="text-accent underline">apps-script.js</a> الذي جهّزناه لك، والصقي محتواه كاملاً في ملف Code.gs.
          </li>
          <li>احفظي ثم اضغطي <strong>Deploy → New deployment</strong>.</li>
          <li>اختاري النوع: <code>Web app</code>، Execute as: <code>Me</code>، Who has access: <code>Anyone</code>.</li>
          <li>انسخي رابط الـ Web App والصقيه أعلاه، ثم اضغطي حفظ.</li>
        </ol>
        <p className="text-xs text-muted-foreground mt-4">
          عند أول طلب، سيقوم السكربت بإنشاء كل الصفحات والأعمدة تلقائياً داخل الـ Sheet.
        </p>
      </Card>

      <style>{`
        .input { padding: 10px 14px; background: var(--muted); border: 1px solid var(--border); border-radius: 12px; font: inherit; outline: none; }
        .input:focus { border-color: var(--accent); }
      `}</style>
    </Shell>
  );
}
