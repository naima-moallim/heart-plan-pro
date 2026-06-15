# خطة تطوير "حياة تشبهك" – المرحلة الثانية

نطاق متفق عليه: **كل المحاور عدا الذكاء الاصطناعي (11) و WhatsApp**. سأنفذ على **4 دفعات متتابعة** حتى تبقى كل دفعة قابلة للاختبار، وأطلب موافقتك بين الدفعات.

---

## الدفعة 1 — الأساس (Backend + Auth + ترحيل البيانات)

**يغطي المحاور: 1، 2، 3، 10**

### قاعدة البيانات (Lovable Cloud / Supabase)
سأنشئ الجداول التالية مع RLS كاملة (كل مستخدم يرى بياناته فقط):

```text
profiles            (id, display_name, avatar_url, timezone, energy_baseline)
values              (id, user_id, title, description, weight, color, order)
vision              (id, user_id, year, statement, theme)
planning_cycles     (id, user_id, name, start_date, end_date, vision_id, status)
monthly_goals       (id, user_id, cycle_id, value_id?, title, area, priority, status)
weeks               (id, user_id, cycle_id, week_number, start_date, end_date, focus)
weekly_goal_links   (id, week_id, monthly_goal_id, allocation_pct)
daily_plans         (id, user_id, week_id, date, energy_level, tired_mode, note)
tasks               (id, user_id, daily_plan_id?, week_id?, monthly_goal_id?,
                     title, priority, status, postpone_count, due_date, completed_at)
habits              (id, user_id, value_id?, title, frequency, target_per_week, icon)
habit_logs          (id, user_id, habit_id, date, completed)
beliefs             (id, user_id, statement, type, reframe)
mindset_entries     (id, user_id, type, content, date)
influences          (id, user_id, name, category, impact)
inner_seasons       (id, user_id, season, started_at, notes)
reviews             (id, user_id, type, period_ref, content, gratitude, lessons)
reminders           (id, user_id, entity_type, entity_id, fires_at, frequency, channel)
```

كل جدول: `GRANT` للمستخدمين المصادقين + `RLS` على `auth.uid() = user_id`.

### المصادقة (المحور 2)
- صفحة `/auth` للتسجيل والدخول (بريد + كلمة مرور + Google).
- صفحة `/auth/reset-password` لإعادة تعيين كلمة المرور.
- صفحة `/profile` لإدارة الحساب.
- نقل كل الصفحات الحالية تحت `_authenticated/` (يطلب تسجيل الدخول).
- تأكيد البريد الإلكتروني مفعّل.

### ترحيل من localStorage
- استبدال `src/lib/store.ts` بالكامل بطبقة Supabase (server functions + React Query).
- **حذف** كود Google Sheets الحالي والملف `public/apps-script.js`.
- **سيتم إضافة زر "تصدير لـ Google Sheets" يدوي لاحقاً في الدفعة 4** كخيار ثانوي للنسخ الاحتياطي.

### الهيكل الهرمي (المحور 3)
- روابط FK واضحة: `monthly_goals.value_id` → `values`, `weekly_goal_links` يربط `weeks` بـ `monthly_goals`, `tasks.monthly_goal_id` و `tasks.week_id`.
- مكوّن `<HierarchyBreadcrumb>` يظهر فوق كل مهمة: القيمة → الهدف الشهري → الأسبوع → اليوم.

### مركز اكتشاف الذات (المحور 10)
- دمج صفحات `values`, `beliefs`, `mindset`, `influences`, `inner-seasons` تحت مسار واحد `/self` بتبويبات داخلية ورحلة مرشدة (Steps).
- حذف عناصر القائمة الجانبية الخمسة المنفصلة.

---

## الدفعة 2 — التجربة اليومية الذكية

**يغطي: 4، 5، 6، 15**

### توزيع الأهداف الذكي (المحور 4)
- زر "وزّعي الأهداف تلقائياً على الأسابيع" مع منطق التوزيع المتوازن.
- واجهة سحب وإفلات لإعادة التوزيع يدوياً.
- زر "وزّعي أسبوع على أيام" يولّد مهام يومية من بنود الهدف الأسبوعي.

### وضع "أنا متعبة اليوم" (المحور 5)
- زر بارز في صفحة اليوم.
- يخفي كل المهام عدا أعلى 3 أولوية.
- يؤجل تلقائياً المهام منخفضة الأولوية للغد.
- يقترح عادات خفيفة (شرب ماء، نَفَس عميق، 5 دقائق مشي).
- رسالة: "اليوم لا يطلب الكمال. خطوة صغيرة تكفي."

### نظام التأجيل (المحور 6)
- زر "تأجيل" على كل مهمة بقائمة: غداً / الأسبوع القادم / الشهر القادم / تقسيم / حذف.
- عدّاد `postpone_count` يظهر بشارة على المهام المؤجلة كثيراً.
- صفحة "المهام الأكثر تأجيلاً" داخل التقارير.

### تحسين الواجهة (المحور 15)
- تقليل القائمة الجانبية من 14 عنصر إلى 6: اليوم، الأسبوع، الدورة، اكتشاف الذات، التقارير، الإعدادات.
- شريط تقدم "رحلتك" على الـ Dashboard يوجّه: أنشئي دورة → أهداف → وزّعي → ابدئي.

---

## الدفعة 3 — التتبع والتقارير

**يغطي: 7 (المرحلة 1+2)، 8، 9، 13**

- تقويم العادات الشهري + إحصائيات (سلسلة، أطول سلسلة، نسبة الإنجاز).
- لوحة معلومات متقدمة (يومي/أسبوعي/شهري + رؤى).
- تقارير: اتجاهات الطاقة، توازن المجالات، الأنماط طويلة المدى، رسوم بيانية.
- تذكيرات داخل التطبيق + Browser Notifications + بريد إلكتروني (عبر Resend).

---

## الدفعة 4 — التصدير و PWA

**يغطي: 12، 14**

- تصدير CSV / Excel (xlsx) / PDF.
- **تصدير يدوي اختياري لـ Google Sheets** (الخيار الثانوي الذي طلبتِه).
- نسخ احتياطي JSON كامل + استعادة.
- PWA: manifest + أيقونات + splash + Service Worker للتشغيل دون إنترنت.

---

## ملاحظات تقنية

- المنصة: Lovable Cloud (Supabase تحت الغطاء) — تفعيل تلقائي.
- الواجهة: نفس تصميم "الزن العربي الكلاسيكي" الحالي.
- البيانات الحالية في localStorage **ستُحذف** (لا حاجة لاستيراد، حسب تأكيدك).
- التذكيرات عبر WhatsApp والذكاء الاصطناعي **مستبعدة** من هذه الخطة.

---

## ما سأبدأ به فوراً عند موافقتك
**الدفعة 1 فقط** (الأساس). بعد اختبارك لها ننتقل للدفعة 2.

هل أبدأ الدفعة 1؟
