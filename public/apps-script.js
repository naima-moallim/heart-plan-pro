/**
 * حياة تشبهك - Google Apps Script Backend
 * =============================================
 *
 * تعليمات النشر:
 * 1) أنشئي Google Sheet جديد
 * 2) من القائمة: Extensions → Apps Script
 * 3) الصقي هذا الكود بالكامل في ملف Code.gs
 * 4) احفظي ثم اضغطي Deploy → New deployment
 * 5) النوع: Web app | Execute as: Me | Who has access: Anyone
 * 6) انسخي رابط الـ Web App
 * 7) الصقيه في صفحة الإعدادات داخل التطبيق
 *
 * عند أول طلب سيقوم السكربت بإنشاء جميع الصفحات والأعمدة تلقائياً.
 */

const SHEETS = {
  Users: ['user_id','name','email','password_hash','created_at','status'],
  Planning_Cycles: ['cycle_id','user_id','cycle_name','cycle_type','start_date','end_date','theme','vision','status','created_at','updated_at'],
  Values: ['value_id','user_id','value_name','description','why_important','linked_goal','linked_habit','evidence_from_life','created_at'],
  Monthly_Goals: ['goal_id','cycle_id','user_id','goal_title','life_area','linked_value_id','why_important','success_measure','blocking_belief','status','progress','created_at','updated_at'],
  Weekly_Plans: ['week_id','cycle_id','user_id','week_number','start_date','end_date','week_theme','week_focus','linked_goal_ids','notes','status','created_at','updated_at'],
  Daily_Plans: ['daily_plan_id','cycle_id','week_id','user_id','date','day_theme','energy_level','top_priority_1','top_priority_2','top_priority_3','necessary_task','what_to_leave_today','focus_time','interruptions','notes','created_at','updated_at'],
  Tasks: ['task_id','user_id','cycle_id','week_id','goal_id','date','time','task_title','description','category','priority','energy_required','status','repeat_type','reminder_time','postponed_count','created_at','updated_at'],
  Habits: ['habit_id','user_id','linked_value_id','linked_goal_id','habit_name','category','frequency','days','reminder_time','status','created_at','updated_at'],
  Habit_Logs: ['log_id','habit_id','user_id','date','status','notes','created_at'],
  Beliefs: ['belief_id','user_id','belief_category','old_belief','source','how_it_appears','damage','new_belief','evidence','small_action','created_at','updated_at'],
  Mindset: ['mindset_id','user_id','mindset_type','current_sentence','new_sentence','practical_step','evidence_of_change','created_at'],
  Influences: ['influence_id','user_id','influence_type','what_helps','what_challenges','is_temporary','possible_solution','needed_support','created_at'],
  Inner_Seasons: ['season_id','user_id','date','season_type','suitable_practices','energy_note','created_at'],
  Daily_Reviews: ['review_id','user_id','cycle_id','week_id','date','completed_today','postponed_today','feeling','gratitude','lesson','tomorrow_step','day_rating','created_at'],
  Weekly_Reviews: ['weekly_review_id','user_id','cycle_id','week_id','best_achievement','most_postponed','best_habit','hardest_day','what_to_reduce','next_week_plan','next_week_theme','created_at'],
  Monthly_Reviews: ['monthly_review_id','user_id','cycle_id','completed_goals','uncompleted_goals','why_not_completed','successful_habits','habits_to_adjust','best_area','area_needs_attention','next_month_theme','created_at'],
  Reminders: ['reminder_id','user_id','related_type','related_id','reminder_title','reminder_date','reminder_time','repeat_type','channel','status','created_at'],
  Settings: ['setting_id','user_id','daily_planning_time','daily_review_time','weekly_review_day','monthly_planning_day','theme_mode','language','created_at','updated_at'],
};

function ensureSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEETS).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      sh.getRange(1, 1, 1, SHEETS[name].length).setValues([SHEETS[name]]);
      sh.setFrozenRows(1);
    }
  });
}

function getSheet_(name) {
  ensureSheets_();
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function rowsToObjects_(sh) {
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function uid_() { return Utilities.getUuid(); }
function now_() { return new Date().toISOString(); }

function appendRow_(sheetName, obj) {
  const sh = getSheet_(sheetName);
  const headers = SHEETS[sheetName];
  const idKey = headers[0];
  if (!obj[idKey]) obj[idKey] = uid_();
  if (headers.includes('created_at') && !obj.created_at) obj.created_at = now_();
  if (headers.includes('updated_at')) obj.updated_at = now_();
  const row = headers.map(h => obj[h] != null ? obj[h] : '');
  sh.appendRow(row);
  return obj;
}

function updateRow_(sheetName, idValue, patch) {
  const sh = getSheet_(sheetName);
  const data = sh.getDataRange().getValues();
  const headers = data[0];
  const idKey = headers[0];
  const idCol = headers.indexOf(idKey);
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(idValue)) {
      const current = {};
      headers.forEach((h, j) => current[h] = data[i][j]);
      const merged = Object.assign({}, current, patch);
      if (headers.includes('updated_at')) merged.updated_at = now_();
      const row = headers.map(h => merged[h] != null ? merged[h] : '');
      sh.getRange(i + 1, 1, 1, headers.length).setValues([row]);
      return merged;
    }
  }
  return null;
}

function deleteRow_(sheetName, idValue) {
  const sh = getSheet_(sheetName);
  const data = sh.getDataRange().getValues();
  const idCol = 0;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(idValue)) {
      sh.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function listRows_(sheetName, filter) {
  const sh = getSheet_(sheetName);
  let rows = rowsToObjects_(sh);
  if (filter) {
    rows = rows.filter(r => Object.keys(filter).every(k => String(r[k]) === String(filter[k])));
  }
  return rows;
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const action = (e.parameter.action || 'list');
    const sheet = e.parameter.sheet;
    const filter = {};
    Object.keys(e.parameter).forEach(k => {
      if (!['action','sheet'].includes(k)) filter[k] = e.parameter[k];
    });
    if (action === 'list' && sheet && SHEETS[sheet]) {
      return jsonOut_({ ok: true, data: listRows_(sheet, Object.keys(filter).length ? filter : null) });
    }
    if (action === 'all') {
      const out = {};
      Object.keys(SHEETS).forEach(s => out[s] = listRows_(s, Object.keys(filter).length ? filter : null));
      return jsonOut_({ ok: true, data: out });
    }
    return jsonOut_({ ok: false, error: 'invalid_action' });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { action, sheet, payload, id } = body;
    if (!SHEETS[sheet]) return jsonOut_({ ok: false, error: 'unknown_sheet' });
    if (action === 'create') return jsonOut_({ ok: true, data: appendRow_(sheet, payload || {}) });
    if (action === 'update') return jsonOut_({ ok: true, data: updateRow_(sheet, id, payload || {}) });
    if (action === 'delete') return jsonOut_({ ok: true, data: deleteRow_(sheet, id) });
    if (action === 'bulk_create') {
      const arr = (payload || []).map(p => appendRow_(sheet, p));
      return jsonOut_({ ok: true, data: arr });
    }
    return jsonOut_({ ok: false, error: 'invalid_action' });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}
