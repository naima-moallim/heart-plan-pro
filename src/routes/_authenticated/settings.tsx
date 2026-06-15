import { createFileRoute } from "@tanstack/react-router";
import { Shell, PageHeader, Card } from "@/components/Shell";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "الإعدادات" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  return (
    <Shell>
      <PageHeader title="الإعدادات" subtitle="حسابك وتفضيلاتك." />
      <Card>
        <h3 className="font-serif text-xl font-bold mb-3">الحساب</h3>
        <p className="text-sm text-muted-foreground">البريد: <span className="text-foreground">{user?.email}</span></p>
        <p className="text-sm text-muted-foreground mt-1">معرّف المستخدم: <code dir="ltr" className="text-xs">{user?.id}</code></p>
        <p className="text-xs text-muted-foreground mt-4">
          بياناتك محفوظة في الـ Cloud ومتزامنة تلقائياً بين أجهزتك. لا حاجة لإعدادات إضافية.
        </p>
      </Card>
    </Shell>
  );
}
