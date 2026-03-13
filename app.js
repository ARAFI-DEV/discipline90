'use strict';

/* ═══════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════ */
const STORAGE_KEY   = 'discipline90_v2';
const START_WEIGHT  = 89;
const GOAL_WEIGHT   = 74;
const GOAL_DAYS     = 90;
const HABITS        = ['workout','protein','sugarFree','water','sleep','learning'];
const RING_CIRCUM   = 364;
const TIMER_CIRCUM  = 534;

// Expected weight by week
const EXPECTED_WEIGHTS = {
  0:89, 2:85, 4:82, 6:79, 8:76, 10:74, 12:72
};

// Goggins quotes rotation
const QUOTES = [
  '"You don\'t negotiate with your mind."',
  '"Suffer now and live the rest of your life as a champion."',
  '"The most important conversations you\'ll ever have are the ones you have with yourself."',
  '"Who\'s gonna carry the boats?"',
  '"You are in danger of living a life so comfortable and soft that you will die without ever realizing your true potential."',
  '"Don\'t stop when you\'re tired. Stop when you\'re done."',
];

// Daily schedule
const DAILY_SCHEDULE = [
  { time:'05:00', icon:'🌅', title:'ตื่น', detail:'น้ำ 500ml + กาแฟดำ (optional)' },
  { time:'05:10', icon:'🥊', title:'TRAINING', detail:'Warm up → Heavy Bag → Strength (60 นาที)' },
  { time:'06:10', icon:'🥤', title:'Post-Workout Shake', detail:'Protein 1 scoop + น้ำ 300ml' },
  { time:'07:00', icon:'🍳', title:'อาหารเช้า', detail:'ไข่ 3 ฟอง + กล้วย/แอปเปิ้ล' },
  { time:'08:15', icon:'💻', title:'SESSION 1: เรียน/โค้ด', detail:'3.5 ชั่วโมง (08:15–11:45)' },
  { time:'12:00', icon:'🍗', title:'อาหารกลางวัน', detail:'อกไก่ 250g + ข้าว 1 ทัพพี + ผัก' },
  { time:'13:15', icon:'💻', title:'SESSION 2: เรียน/โค้ด', detail:'3 ชั่วโมง (13:15–16:15)' },
  { time:'16:30', icon:'🚶', title:'Recovery Walk', detail:'เดินเร็ว 20 นาที' },
  { time:'17:00', icon:'🍗', title:'อาหารเย็น', detail:'อกไก่ 250g + ผักเยอะ + ข้าวนิดหน่อย (optional)' },
  { time:'18:45', icon:'💻', title:'SESSION 3: เรียน/โค้ด', detail:'2.5 ชั่วโมง (18:45–21:15)' },
  { time:'21:15', icon:'🧘', title:'Wind Down', detail:'Stretch + ผ่อนคลาย' },
  { time:'22:00', icon:'🌙', title:'นอน', detail:'เป้าหมาย: ตื่น 05:00 = 7 ชั่วโมง' },
];

const REST_SCHEDULE = [
  { time:'05:00', icon:'😴', title:'ตื่น (ไม่ต้องรีบ)', detail:'พักผ่อนให้เต็มที่' },
  { time:'07:00', icon:'🍳', title:'อาหารเช้า', detail:'ไข่ + ผลไม้ + protein shake' },
  { time:'09:00', icon:'💻', title:'เรียน/โค้ด', detail:'เบาๆ ถ้าอยาก ไม่ต้องบังคับ' },
  { time:'12:00', icon:'🍗', title:'อาหารกลางวัน', detail:'อกไก่ 250g + ข้าว + ผัก' },
  { time:'14:00', icon:'🧘', title:'Stretch / เดินเบาๆ', detail:'ฟื้นฟูกล้ามเนื้อ' },
  { time:'17:00', icon:'🍗', title:'อาหารเย็น', detail:'อกไก่ 250g + ผักเยอะ' },
  { time:'22:00', icon:'🌙', title:'นอน', detail:'นอนเร็ว ฟื้นฟูเต็มที่' },
];

/* ═══════════════════════════════════════════
   STATE
═══════════════════════════════════════════ */
let state = {
  startDate:     null,
  streak:        0,
  lastStreakDate:null,
  weightHistory: [],
  dailyHistory:  {},
  // { "YYYY-MM-DD": { workout,protein,sugarFree,water,sleep,learning, notes } }
};

/* ═══════════════════════════════════════════
   PERSISTENCE
═══════════════════════════════════════════ */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = { ...state, ...JSON.parse(raw) };
  } catch(e) {}
  if (!state.startDate) { state.startDate = todayISO(); saveState(); }
}
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) {}
}
function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  state = { startDate:todayISO(), streak:0, lastStreakDate:null, weightHistory:[], dailyHistory:{} };
  saveState();
}

/* ═══════════════════════════════════════════
   DATE UTILS
═══════════════════════════════════════════ */
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function pad(n) { return String(n).padStart(2,'0'); }
function daysBetween(a, b) {
  return Math.floor((new Date(b) - new Date(a)) / 86400000);
}
function formatDate(iso, opts) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('th-TH', opts || { weekday:'short', month:'short', day:'numeric' });
}
function isToday(iso) { return iso === todayISO(); }
function isFriday(iso) {
  return new Date(iso + 'T00:00:00').getDay() === 5;
}
function isFridayToday() { return isFriday(todayISO()); }
function getWeekDays() {
  // Mon–Sun of current week
  const today = new Date();
  const day   = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`);
  }
  return days;
}
function getCurrentPhase(dayNum) {
  if (dayNum <= 28) return 1;
  if (dayNum <= 56) return 2;
  return 3;
}
function getWeekNum(dayNum) { return Math.ceil(dayNum / 7); }

/* ═══════════════════════════════════════════
   TAB NAVIGATION
═══════════════════════════════════════════ */
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${tab}`).classList.add('active');
    });
  });
}

/* ═══════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════ */
function updateDashboard() {
  const today  = todayISO();
  const dayNum = Math.max(1, Math.min(GOAL_DAYS, daysBetween(state.startDate, today) + 1));
  const pct    = Math.min(100, Math.round((dayNum / GOAL_DAYS) * 100));
  const phase  = getCurrentPhase(dayNum);

  // Day ring
  document.getElementById('day-counter').textContent = dayNum;
  document.getElementById('ring-pct').textContent    = `${pct}% COMPLETE`;
  document.getElementById('ring-fill').style.strokeDashoffset = RING_CIRCUM * (1 - pct/100);
  document.getElementById('phase-badge').textContent = `PHASE ${phase}`;

  // Streak
  document.getElementById('streak-counter').textContent = state.streak;
  const sub = document.getElementById('streak-sub');
  if (state.streak === 0)       sub.textContent = 'เริ่มวันแรกได้เลย!';
  else if (state.streak < 7)   sub.textContent  = 'สร้างนิสัยให้มันติด!';
  else if (state.streak < 14)  sub.textContent  = 'สองสัปดาห์แล้ว! 🔥';
  else if (state.streak < 30)  sub.textContent  = 'ไฟกำลังลุกโชน! ยังไม่หยุด!';
  else                          sub.textContent  = 'UNSTOPPABLE. อย่าหยุด!';

  // Goggins quote (rotate by day)
  document.getElementById('goggins-quote').textContent = QUOTES[dayNum % QUOTES.length];

  // Weight
  const lastW = getLastWeight();
  const wEl   = document.getElementById('current-weight-display');
  const dFill = document.getElementById('weight-delta-fill');
  const dText = document.getElementById('weight-delta-text');
  const wLost = document.getElementById('weight-lost');

  if (lastW) {
    wEl.textContent   = lastW.weight.toFixed(1);
    const lost        = START_WEIGHT - lastW.weight;
    wLost.textContent = lost > 0 ? `${lost.toFixed(1)}` : '0';
    const progress    = Math.max(0, Math.min(100, (lost / (START_WEIGHT - GOAL_WEIGHT)) * 100));
    dFill.style.width = progress + '%';
    const rem         = (lastW.weight - GOAL_WEIGHT).toFixed(1);
    const remNum      = parseFloat(rem);
    dText.textContent = remNum <= 0 ? '🏆 บรรลุเป้าหมายแล้ว!' : `เหลืออีก ${rem} kg • ${progress.toFixed(0)}% ไปแล้ว`;
    updateMilestones(lastW.weight);
  } else {
    wEl.textContent   = '—';
    wLost.textContent = '—';
    dText.textContent = 'บันทึกน้ำหนักเพื่อเริ่มต้น';
    dFill.style.width = '0%';
  }

  // Header date
  document.getElementById('current-date-display').textContent =
    new Date().toLocaleDateString('th-TH', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  // Rest day banner on dashboard
  document.getElementById('rest-day-banner').style.display = isFridayToday() ? 'flex' : 'none';

  // Phase timeline
  updatePhaseTimeline(phase);

  // Today status card
  renderTodayStatus();

  // Week grid
  renderWeekGrid();
}

function getLastWeight() {
  return [...state.weightHistory].sort((a,b) => a.date > b.date ? -1 : 1)[0] || null;
}

function updateMilestones(currentKg) {
  document.querySelectorAll('.milestone').forEach(el => {
    const kg = parseFloat(el.dataset.kg);
    el.classList.toggle('reached', currentKg <= kg);
  });
}

function updatePhaseTimeline(currentPhase) {
  [1,2,3].forEach(p => {
    const el = document.getElementById(`phase-item-${p}`);
    el.classList.toggle('active', p === currentPhase);
    el.classList.toggle('done',   p < currentPhase);
  });
}

function renderWeekGrid() {
  const days = getWeekDays();
  const grid = document.getElementById('week-grid');
  const dayNames = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
  let completedCount = 0;

  grid.innerHTML = '';
  days.forEach((iso, i) => {
    const isRest    = isFriday(iso);
    const habits    = state.dailyHistory[iso] || {};
    const allDone   = !isRest && HABITS.every(h => habits[h]);
    const isCurrent = isToday(iso);
    const isPast    = iso < todayISO();

    if (allDone && (isPast || isCurrent)) completedCount++;

    const div = document.createElement('div');
    div.className = 'week-day' +
      (isCurrent ? ' today' : '') +
      (isRest    ? ' rest'  : '') +
      (allDone   ? ' done'  : '');

    const dayNum = new Date(iso + 'T00:00:00').getDate();
    let statusEmoji = '';
    if (isRest)       statusEmoji = '😴';
    else if (allDone) statusEmoji = '✅';
    else if (isCurrent) statusEmoji = '▶';
    else if (isPast)  statusEmoji = '❌';

    // Habit dots
    let dotsHTML = '';
    if (!isRest) {
      dotsHTML = '<div class="week-day-habit-dots">' +
        HABITS.map(h => `<div class="habit-dot ${habits[h] ? 'done' : ''}"></div>`).join('') +
        '</div>';
    }

    div.innerHTML = `
      <div class="week-day-name">${dayNames[i]}</div>
      <div class="week-day-date">${dayNum}</div>
      <div class="week-day-status">${statusEmoji}</div>
      ${dotsHTML}
    `;
    grid.appendChild(div);
  });

  document.getElementById('week-score').textContent = `${completedCount} / 6 วัน`;
}

/* ═══════════════════════════════════════════
   TODAY TAB
═══════════════════════════════════════════ */
function updateTodayTab() {
  const today  = todayISO();
  const dayNum = Math.max(1, daysBetween(state.startDate, today) + 1);
  const phase  = getCurrentPhase(dayNum);
  const week   = getWeekNum(dayNum);
  const friday = isFridayToday();

  document.getElementById('today-date-big').textContent =
    new Date().toLocaleDateString('th-TH', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  document.getElementById('today-day-info').textContent =
    friday
      ? `Day ${dayNum} / 90  •  Week ${week}  •  Phase ${phase}  •  REST DAY 😴`
      : `Day ${dayNum} / 90  •  Week ${week}  •  Phase ${phase}`;

  document.getElementById('rest-day-view').style.display   = friday ? 'block' : 'none';
  document.getElementById('normal-day-view').style.display = friday ? 'none'  : 'block';

  // Update workout desc based on phase
  const roundsByPhase = { 1:'6 rounds', 2:'8 rounds', 3:'10–12 rounds' };
  document.getElementById('habit-workout-desc').textContent =
    `Heavy Bag ${roundsByPhase[phase]} + Strength 4 sets`;

  renderSchedule(friday);
  renderChecklist();
  loadNotes();
}

function renderSchedule(isRestDay) {
  const list     = document.getElementById('schedule-list');
  const schedule = isRestDay ? REST_SCHEDULE : DAILY_SCHEDULE;
  const now      = new Date();
  const nowMins  = now.getHours() * 60 + now.getMinutes();

  list.innerHTML = '';
  schedule.forEach((item, idx) => {
    const [h, m]     = item.time.split(':').map(Number);
    const itemMins   = h * 60 + m;
    const nextMins   = idx < schedule.length - 1
      ? (parseInt(schedule[idx+1].time.split(':')[0]) * 60 + parseInt(schedule[idx+1].time.split(':')[1]))
      : 99999;

    const isCurrent = nowMins >= itemMins && nowMins < nextMins;
    const isPassed  = nowMins >= nextMins;

    const div = document.createElement('div');
    div.className = 'schedule-item' +
      (isCurrent ? ' current' : '') +
      (isPassed  ? ' passed'  : '');
    div.innerHTML = `
      <span class="sch-icon">${item.icon}</span>
      <span class="sch-time">${item.time}</span>
      <div class="sch-body">
        <div class="sch-title">${item.title}</div>
        <div class="sch-detail">${item.detail}</div>
      </div>
    `;
    list.appendChild(div);
  });
}

/* ═══════════════════════════════════════════
   CHECKLIST
═══════════════════════════════════════════ */
function getTodayHabits() {
  const today = todayISO();
  if (!state.dailyHistory[today]) {
    state.dailyHistory[today] = { workout:false, protein:false, sugarFree:false, water:false, sleep:false, learning:false, notes:'' };
    // Don't saveState here — only save on explicit user action
  }
  return state.dailyHistory[today];
}

function renderChecklist() {
  const habits = getTodayHabits();
  const cbMap  = {
    workout: 'cb-workout', protein: 'cb-protein',
    sugarFree:'cb-sugar',  water:   'cb-water',
    sleep:   'cb-sleep',   learning:'cb-learning'
  };
  let checked = 0;
  HABITS.forEach(h => {
    const el = document.getElementById(cbMap[h]);
    if (el) { el.checked = habits[h]; if (habits[h]) checked++; }
  });
  document.getElementById('checklist-progress').textContent = `${checked} / 6`;
  const allDone = checked === 6;
  document.getElementById('all-done-msg').classList.toggle('visible', allDone);
}

function bindChecklist() {
  const cbMap = {
    'cb-workout':'workout','cb-protein':'protein','cb-sugar':'sugarFree',
    'cb-water':'water','cb-sleep':'sleep','cb-learning':'learning'
  };
  Object.entries(cbMap).forEach(([id, habit]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', e => {
      const habits = getTodayHabits();
      habits[habit]  = e.target.checked;
      state.dailyHistory[todayISO()] = habits;

      const allDone = HABITS.every(h => habits[h]);
      if (allDone) {
        const today = todayISO();
        // Only grant streak once per day
        if (state.lastStreakDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yISO = `${yesterday.getFullYear()}-${pad(yesterday.getMonth()+1)}-${pad(yesterday.getDate())}`;
          if (state.lastStreakDate === yISO) {
            // Consecutive day — extend streak
            state.streak++;
          } else {
            // Gap or first time — reset to 1
            state.streak = 1;
          }
          state.lastStreakDate = today;
        }
        showToast(`🔥 Perfect Day! Streak: ${state.streak}`, 'success');
      }

      saveState();
      renderChecklist();
      updateDashboard();
    });
  });
}

/* ═══════════════════════════════════════════
   NOTES
═══════════════════════════════════════════ */
function loadNotes() {
  const habits = getTodayHabits();
  const el     = document.getElementById('daily-notes');
  if (el) el.value = habits.notes || '';
}

function bindNotes() {
  document.getElementById('save-notes-btn')?.addEventListener('click', () => {
    const habits = getTodayHabits();
    habits.notes = document.getElementById('daily-notes').value;
    state.dailyHistory[todayISO()] = habits;
    saveState();
    showToast('บันทึกแล้ว ✓', 'success');
  });
}

/* ═══════════════════════════════════════════
   WORKOUT PHASE TABS
═══════════════════════════════════════════ */
function initWorkoutTabs() {
  document.querySelectorAll('.phase-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.phase;
      document.querySelectorAll('.phase-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.phase-detail').forEach(d => d.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`phase-detail-${p}`).classList.add('active');
    });
  });

  // Auto-switch to current phase
  const dayNum = Math.max(1, daysBetween(state.startDate, todayISO()) + 1);
  const phase  = getCurrentPhase(dayNum);
  document.querySelectorAll('.phase-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.phase-detail').forEach(d => d.classList.remove('active'));
  document.querySelector(`.phase-tab[data-phase="${phase}"]`)?.classList.add('active');
  document.getElementById(`phase-detail-${phase}`)?.classList.add('active');
  const phaseTags = { 1:'PHASE 1 • Week 1–4', 2:'PHASE 2 • Week 5–8', 3:'PHASE 3 • Week 9–12' };
  document.getElementById('workout-phase-tag').textContent = phaseTags[phase];
}

/* ═══════════════════════════════════════════
   NUTRITION CALCULATOR
═══════════════════════════════════════════ */
function initNutrition() {
  const rates = { chicken:0.22, eggs:6, shake:27, yogurt:0.10 };
  function calcProtein() {
    const chicken = parseFloat(document.getElementById('ps-chicken').value) || 0;
    const eggs    = parseFloat(document.getElementById('ps-eggs').value)    || 0;
    const shake   = parseFloat(document.getElementById('ps-shake').value)   || 0;
    const yogurt  = parseFloat(document.getElementById('ps-yogurt').value)  || 0;

    const cp = Math.round(chicken * rates.chicken);
    const ep = Math.round(eggs    * rates.eggs);
    const sp = Math.round(shake   * rates.shake);
    const yp = Math.round(yogurt  * rates.yogurt);

    document.getElementById('pp-chicken').textContent = `${cp}g`;
    document.getElementById('pp-eggs').textContent    = `${ep}g`;
    document.getElementById('pp-shake').textContent   = `${sp}g`;
    document.getElementById('pp-yogurt').textContent  = `${yp}g`;

    const total  = cp + ep + sp + yp;
    const target = 150;
    const pct    = Math.min(100, (total / target) * 100);
    document.getElementById('pt-total').textContent    = total;
    document.getElementById('ptb-fill').style.width    = pct + '%';
    document.getElementById('pt-status').textContent   = total >= target ? '✓' : (total >= 120 ? '~' : '✗');
    document.getElementById('pt-status').style.color   = total >= target ? 'var(--accent)' : (total >= 120 ? '#ffd84e' : 'var(--red)');
  }

  ['ps-chicken','ps-eggs','ps-shake','ps-yogurt'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', calcProtein);
  });
  calcProtein();
}

/* ═══════════════════════════════════════════
   WEIGHT LOG & CHART
═══════════════════════════════════════════ */
let weightChart = null;

function initChart() {
  const ctx = document.getElementById('weight-chart').getContext('2d');
  weightChart = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [
      {
        label: 'น้ำหนักจริง',
        data: [], borderColor:'#b4ff4e', backgroundColor:'rgba(180,255,78,.08)',
        pointBackgroundColor:'#b4ff4e', pointBorderColor:'#0a0a0c', pointBorderWidth:2,
        pointRadius:5, pointHoverRadius:7, borderWidth:2.5, tension:.35, fill:true
      },
      {
        label: 'เป้า 74kg',
        data: [], borderColor:'rgba(255,255,255,.15)', borderDash:[6,4],
        borderWidth:1.5, pointRadius:0, fill:false
      },
      {
        label: 'คาดการณ์',
        data: [], borderColor:'rgba(78,184,255,.3)', borderDash:[4,4],
        borderWidth:1.5, pointRadius:0, fill:false
      }
    ]},
    options: {
      responsive:true, maintainAspectRatio:false,
      interaction:{ mode:'index', intersect:false },
      plugins:{
        legend:{ display:false },
        tooltip:{
          backgroundColor:'#18181d', borderColor:'rgba(255,255,255,.1)', borderWidth:1,
          titleColor:'#aaaabc', bodyColor:'#b4ff4e', padding:10,
          callbacks:{ label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} kg` }
        }
      },
      scales:{
        x:{ grid:{ color:'rgba(255,255,255,.04)' }, ticks:{ color:'#666680', font:{ family:"'JetBrains Mono'", size:10 }, maxTicksLimit:8 }},
        y:{ grid:{ color:'rgba(255,255,255,.04)' }, ticks:{ color:'#666680', font:{ family:"'JetBrains Mono'", size:10 }, callback:v=>v+'kg' }, min:Math.max(60, GOAL_WEIGHT-4) }
      }
    }
  });
}

function updateChart() {
  const sorted   = [...state.weightHistory].sort((a,b)=>a.date>b.date?1:-1);
  const labels   = sorted.map(e => formatDate(e.date, {month:'short', day:'numeric'}));
  const weights  = sorted.map(e => e.weight);
  const goals    = sorted.map(() => GOAL_WEIGHT);
  // Build forecast line using start date + expected weights
  const expected = sorted.map(e => {
    const dayNum = daysBetween(state.startDate, e.date) + 1;
    // Interpolate between expected weight checkpoints
    const keys   = Object.keys(EXPECTED_WEIGHTS).map(Number).sort((a,b)=>a-b);
    const wkNum  = Math.floor(dayNum/7);
    for (let i=0; i<keys.length-1; i++) {
      if (wkNum >= keys[i] && wkNum <= keys[i+1]) {
        const t = (wkNum - keys[i]) / (keys[i+1] - keys[i]);
        return +(EXPECTED_WEIGHTS[keys[i]] + t * (EXPECTED_WEIGHTS[keys[i+1]] - EXPECTED_WEIGHTS[keys[i]])).toFixed(1);
      }
    }
    return EXPECTED_WEIGHTS[12];
  });

  weightChart.data.labels              = labels;
  weightChart.data.datasets[0].data   = weights;
  weightChart.data.datasets[1].data   = goals;
  weightChart.data.datasets[2].data   = expected;
  weightChart.update('active');

  renderEVAGrid(sorted);
}

function renderEVAGrid(sorted) {
  const grid = document.getElementById('eva-grid');
  const checkpoints = [
    { week:2, kg:85 }, { week:4, kg:82 }, { week:6, kg:79 },
    { week:8, kg:76 }, { week:10, kg:74 }, { week:12, kg:72 }
  ];
  grid.innerHTML = '';
  checkpoints.forEach(cp => {
    const targetDay = cp.week * 7;
    const actualEntry = sorted.find(e => daysBetween(state.startDate, e.date)+1 >= targetDay-3
      && daysBetween(state.startDate, e.date)+1 <= targetDay+4);

    const el = document.createElement('div');
    el.className = 'eva-item' + (actualEntry && actualEntry.weight <= cp.kg ? ' reached' : '');
    el.innerHTML = `
      <div class="eva-week">WEEK ${cp.week}</div>
      <div class="eva-expected">${cp.kg}</div>
      <div class="eva-label">คาดการณ์</div>
      ${actualEntry ? `<div class="eva-actual">${actualEntry.weight.toFixed(1)}</div><div class="eva-label">จริง</div>` : '<div class="eva-label" style="color:var(--gray-2)">ยังไม่ถึง</div>'}
    `;
    grid.appendChild(el);
  });
}

function renderWeightLog() {
  const list   = document.getElementById('weight-log-list');
  const sorted = [...state.weightHistory].sort((a,b)=>a.date>b.date?-1:1);
  list.innerHTML = '';
  document.getElementById('weight-count').textContent = `${sorted.length} รายการ`;
  sorted.forEach(entry => {
    const el = document.createElement('div');
    el.className = 'log-entry';
    el.innerHTML = `
      <span class="log-entry-date">${formatDate(entry.date)}</span>
      <span class="log-entry-weight">${entry.weight.toFixed(1)} kg</span>
      <button class="log-entry-delete" data-date="${entry.date}">✕</button>
    `;
    list.appendChild(el);
  });
  list.querySelectorAll('.log-entry-delete').forEach(btn => {
    btn.addEventListener('click', e => {
      const date = e.currentTarget.dataset.date;
      state.weightHistory = state.weightHistory.filter(e=>e.date!==date);
      saveState(); renderWeightLog(); updateChart(); updateDashboard();
      showToast('ลบรายการแล้ว', 'error');
    });
  });
}

function bindWeightLog() {
  document.getElementById('weight-date').value = todayISO();
  document.getElementById('log-weight-btn').addEventListener('click', () => {
    const date = document.getElementById('weight-date').value;
    const kg   = parseFloat(document.getElementById('weight-input').value);
    if (!date)              { showToast('กรุณาเลือกวันที่', 'error'); return; }
    if (isNaN(kg)||kg<30||kg>300) { showToast('กรุณาใส่น้ำหนักที่ถูกต้อง', 'error'); return; }
    state.weightHistory = state.weightHistory.filter(e=>e.date!==date);
    state.weightHistory.push({ date, weight:kg });
    saveState();
    document.getElementById('weight-input').value = '';
    renderWeightLog(); updateChart(); updateDashboard();
    showToast(`บันทึก ${kg} kg ✓`, 'success');
  });
}

/* ═══════════════════════════════════════════
   INTERVAL TIMER
═══════════════════════════════════════════ */
const audioCtx = (() => {
  try { return new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return null; }
})();

function beep(freq=880, dur=0.15, vol=0.4) {
  if (!audioCtx) return;
  try {
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime+dur);
    osc.start(); osc.stop(audioCtx.currentTime+dur);
  } catch(e) {}
}
function doubleBeep() { beep(880,.1); setTimeout(()=>beep(1100,.2),150); }
function tripleBeep()  { beep(660,.1); setTimeout(()=>beep(880,.1),150); setTimeout(()=>beep(1320,.3),300); }

let timerState = {
  running:false, paused:false,
  phase:'idle',  // idle|work|rest|done
  round:1, totalRounds:6, workSec:180, restSec:60,
  remaining:180, interval:null, totalElapsed:0,
};

function timerFmt(s) { return `${pad(Math.floor(s/60))}:${pad(s%60)}`; }

function updateTimerUI() {
  const phase   = document.getElementById('timer-phase');
  const timeEl  = document.getElementById('timer-time');
  const infoEl  = document.getElementById('timer-round-info');
  const prog    = document.getElementById('timer-progress');

  const totalSec = timerState.phase === 'work' ? timerState.workSec : timerState.restSec;
  const offset   = TIMER_CIRCUM * (1 - timerState.remaining / Math.max(1, totalSec));
  prog.style.strokeDashoffset = offset;

  if (timerState.phase === 'work') {
    prog.classList.remove('rest-mode');
    phase.textContent = '▶ WORK'; phase.className = 'timer-phase work';
  } else if (timerState.phase === 'rest') {
    prog.classList.add('rest-mode');
    phase.textContent = '— REST'; phase.className = 'timer-phase rest';
  } else if (timerState.phase === 'done') {
    prog.classList.remove('rest-mode');
    phase.textContent = '✓ DONE'; phase.className = 'timer-phase done';
  } else {
    prog.style.strokeDashoffset = 0;
    phase.textContent = 'READY'; phase.className = 'timer-phase';
  }

  timeEl.textContent = timerFmt(timerState.remaining);
  infoEl.textContent = timerState.phase === 'done' ? 'Session complete!'
    : `Round ${timerState.round} / ${timerState.totalRounds}`;
}

function readTimerConfig() {
  timerState.workSec     = Math.max(60,  Math.min(300, parseInt(document.getElementById('cfg-work').value)   || 180));
  timerState.restSec     = Math.max(30,  Math.min(120, parseInt(document.getElementById('cfg-rest').value)   || 60));
  timerState.totalRounds = Math.max(1,   Math.min(12,  parseInt(document.getElementById('cfg-rounds').value) || 6));
}

function startTimer() {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  if (timerState.phase === 'idle' || timerState.phase === 'done') {
    readTimerConfig();
    timerState.round = 1; timerState.phase = 'work';
    timerState.remaining = timerState.workSec;
    timerState.totalElapsed = 0;
    document.getElementById('timer-summary').style.display = 'none';
  }
  timerState.running = true; timerState.paused = false;
  document.getElementById('timer-start').disabled = true;
  document.getElementById('timer-pause').disabled = false;
  ['cfg-work','cfg-rest','cfg-rounds'].forEach(id => document.getElementById(id).disabled = true);

  timerState.interval = setInterval(() => {
    timerState.remaining--;
    timerState.totalElapsed++;
    if (timerState.remaining <= 0) {
      if (timerState.phase === 'work') {
        doubleBeep();
        if (timerState.round >= timerState.totalRounds) {
          clearInterval(timerState.interval);
          timerState.phase = 'done'; tripleBeep();
          showTimerSummary();
          document.getElementById('timer-start').disabled = false;
          document.getElementById('timer-pause').disabled = true;
          ['cfg-work','cfg-rest','cfg-rounds'].forEach(id => document.getElementById(id).disabled = false);
        } else {
          timerState.phase = 'rest'; timerState.remaining = timerState.restSec;
        }
      } else {
        beep(660,.2); timerState.round++; timerState.phase = 'work'; timerState.remaining = timerState.workSec;
      }
    }
    updateTimerUI();
  }, 1000);
}

function pauseTimer() {
  if (timerState.running) {
    clearInterval(timerState.interval);
    timerState.running = false; timerState.paused = true;
    document.getElementById('timer-start').disabled = false;
    document.getElementById('timer-start').textContent = '▶ RESUME';
    document.getElementById('timer-pause').disabled = true;
  }
}

function resetTimer() {
  clearInterval(timerState.interval);
  timerState.running = false; timerState.paused = false;
  timerState.phase = 'idle'; timerState.round = 1;
  timerState.remaining = parseInt(document.getElementById('cfg-work').value) || 180;
  document.getElementById('timer-start').disabled = false;
  document.getElementById('timer-start').textContent = '▶ START';
  document.getElementById('timer-pause').disabled = true;
  document.getElementById('timer-summary').style.display = 'none';
  ['cfg-work','cfg-rest','cfg-rounds'].forEach(id => document.getElementById(id).disabled = false);
  updateTimerUI();
}

function showTimerSummary() {
  const m = Math.floor(timerState.totalElapsed/60);
  const s = timerState.totalElapsed % 60;
  document.getElementById('summary-text').textContent =
    `${timerState.totalRounds} rounds เสร็จแล้ว • ${m}m ${s}s รวม`;
  document.getElementById('timer-summary').style.display = 'flex';
  document.getElementById('timer-start').textContent = '▶ RESTART';
  showToast(`💪 ${timerState.totalRounds} rounds เสร็จ! ยอดเยี่ยมมาก`, 'success');
}

function bindTimer() {
  document.getElementById('timer-start').addEventListener('click', startTimer);
  document.getElementById('timer-pause').addEventListener('click', pauseTimer);
  document.getElementById('timer-reset').addEventListener('click', resetTimer);

  // Preset buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('cfg-work').value   = btn.dataset.work;
      document.getElementById('cfg-rest').value   = btn.dataset.rest;
      document.getElementById('cfg-rounds').value = btn.dataset.rounds;
      resetTimer();
      timerState.remaining = parseInt(btn.dataset.work);
      updateTimerUI();
    });
  });

  // Init display
  timerState.remaining = parseInt(document.getElementById('cfg-work').value) || 180;
  updateTimerUI();
}

/* ═══════════════════════════════════════════
   TODAY STATUS CARD (Dashboard)
═══════════════════════════════════════════ */
const HABIT_META = {
  workout:   { icon:'⚡', label:'Workout',       urgent: false },
  protein:   { icon:'🥩', label:'Protein 140g+', urgent: false },
  sugarFree: { icon:'🚫', label:'No ของต้องห้าม', urgent: false },
  water:     { icon:'💧', label:'น้ำ 3L',         urgent: false },
  sleep:     { icon:'🌙', label:'นอน 7h',          urgent: false },
  learning:  { icon:'💻', label:'เรียน 7.5h',      urgent: false },
};

// Taunt messages per missing habit count
const TAUNTS_MISSING = {
  6: [
    'ยังไม่ได้ทำอะไรเลยวันนี้ Goggins จะไม่พอใจ',
    'หกอย่างยังไม่ครบ เริ่มเดี๋ยวนี้เลย ไม่มีข้อแม้',
    'วันยังไม่หมด แต่เวลากำลังหมด ลุกขึ้นมา',
  ],
  5: [
    'ยังขาดอีก 5 อย่าง มีเวลาพอถ้าเริ่มตอนนี้',
    'หนึ่งทำแล้ว แต่อีกห้ายังรอ อย่าหยุด',
    'เริ่มดีแล้ว แต่ยังไม่พอ ไปต่อ',
  ],
  4: [
    'สองทำแล้ว เหลืออีกสี่ ครึ่งวันยังมี',
    'ไม่มีใครจำคนที่ทำได้แค่ครึ่งเดียว',
    'ยังขาดอีกเยอะ อย่าชะล่าใจ',
  ],
  3: [
    'กึ่งกลางแล้ว ตัดสินใจว่าวันนี้จะเป็นวันที่ชนะหรือแพ้',
    'สามอย่างยังขาด ทำทีละอย่าง ไม่ต้องรีบ แต่อย่าหยุด',
    'เลยครึ่งทางมาแล้ว อย่าหยุดตรงนี้',
  ],
  2: [
    'เกือบแล้ว! เหลืออีกแค่สองอย่าง อย่าให้มันหลุด',
    'สองอย่างสุดท้าย อย่าให้วันนี้เสียเปล่า',
    'เกือบถึงแล้ว — Finish what you started.',
  ],
  1: [
    'อีกแค่หนึ่งอย่าง! ทำเดี๋ยวนี้ อย่ารอ',
    'อีกนิดเดียว streak กำลังรอ',
    'ใกล้มาก — "Don\'t stop when you\'re tired, stop when you\'re done."',
  ],
  0: [
    '"Stay hard." — Goggins',
    'ทำครบแล้ว! วันนี้ชนะแล้ว 🔥',
    'Perfect day locked. ไม่มีใครเอาสิ่งนี้ไปจากแกได้',
    'All done. นี่แหละคือวินัยที่แท้จริง',
  ],
};

const TAUNTS_REST = [
  'วันพักเป็นส่วนหนึ่งของ plan ฟื้นฟูให้เต็มที่',
  'Rest day ไม่ใช่วันขี้เกียจ แต่คือวันที่กล้ามเนื้อเติบโต',
  'วันศุกร์พักให้เต็มที่ แล้วพรุ่งนี้มาหนักกว่าเดิม',
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function renderTodayStatus() {
  const card    = document.getElementById('today-status-card');
  const titleEl = document.getElementById('tsc-title');
  const missEl  = document.getElementById('tsc-missing');
  const tauntEl = document.getElementById('tsc-taunt');

  // Rest day
  if (isFridayToday()) {
    card.className = 'today-status-card rest-day';
    titleEl.textContent = 'วันพักผ่อน 😴';
    missEl.innerHTML = '<div class="missing-pill">💧 ดื่มน้ำ 3L</div><div class="missing-pill">🌙 นอน 7h+</div><div class="missing-pill">🥩 โปรตีน 140g+</div>';
    tauntEl.textContent = pickRandom(TAUNTS_REST);
    tauntEl.className = 'tsc-taunt chill';
    return;
  }

  const habits  = getTodayHabits();
  const missing = HABITS.filter(h => !habits[h]);
  const count   = missing.length;

  // Card state
  card.className = 'today-status-card' + (count === 0 ? ' all-done' : '');

  if (count === 0) {
    titleEl.textContent = 'วันนี้สมบูรณ์แบบ!';
    missEl.innerHTML = '<div class="done-pill"><span class="done-pill-icon">🏆</span> PERFECT DAY LOCKED</div>';
    tauntEl.className = 'tsc-taunt fire';
    tauntEl.textContent = pickRandom(TAUNTS_MISSING[0]);
  } else {
    titleEl.textContent = `ยังขาดอีก ${count} อย่าง`;
    missEl.innerHTML = missing.map((h, i) => {
      const m    = HABIT_META[h];
      const isUrgent = count >= 5 && i === 0;
      return `<div class="missing-pill${isUrgent ? ' urgent' : ''}" style="animation-delay:${i*0.05}s">
        ${m.icon} ${m.label}
      </div>`;
    }).join('');
    tauntEl.className = 'tsc-taunt';
    // Pick taunt by missing count
    const bucket = TAUNTS_MISSING[count] || TAUNTS_MISSING[1];
    tauntEl.textContent = pickRandom(bucket);
  }
}


function checkStreakIntegrity() {
  if (!state.lastStreakDate || state.lastStreakDate === todayISO()) return;
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
  const yISO = `${yesterday.getFullYear()}-${pad(yesterday.getMonth()+1)}-${pad(yesterday.getDate())}`;
  if (state.lastStreakDate !== yISO) {
    state.streak = 0; state.lastStreakDate = null; saveState();
  }
}

/* ═══════════════════════════════════════════
   TOAST
═══════════════════════════════════════════ */
let toastTimer = null;
function showToast(msg, type='default') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className   = `toast toast-${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

/* ═══════════════════════════════════════════
   RESET MODAL
═══════════════════════════════════════════ */
function bindResetModal() {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('reset-btn').addEventListener('click', () => overlay.classList.add('open'));
  document.getElementById('modal-cancel').addEventListener('click', () => overlay.classList.remove('open'));
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
  document.getElementById('modal-confirm').addEventListener('click', () => {
    resetState(); overlay.classList.remove('open'); location.reload();
  });
}

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
function init() {
  loadState();
  checkStreakIntegrity();
  initTabs();
  updateDashboard();
  updateTodayTab();
  initWorkoutTabs();
  initNutrition();
  initChart();
  updateChart();
  renderWeightLog();
  bindWeightLog();
  bindChecklist();
  bindNotes();
  bindTimer();
  bindResetModal();

  // Re-render Today tab when switching to it
  document.querySelector('[data-tab="today"]').addEventListener('click', () => {
    setTimeout(updateTodayTab, 50);
  });

  // Auto-refresh at midnight
  const msUntilMidnight = (() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()+1) - now;
  })();
  setTimeout(() => {
    updateDashboard(); updateTodayTab();
    setInterval(() => { updateDashboard(); updateTodayTab(); }, 86400000);
  }, msUntilMidnight);
}

document.addEventListener('DOMContentLoaded', init);