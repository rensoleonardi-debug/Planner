(() => {
  'use strict';

  /* ========================================================================
     1. Constantes y Configuración Fluent 2
     ======================================================================== */

  const STORAGE_KEY = 'fluent_planner_state_v1';
  const PIXELS_PER_HOUR = 60;

  const FLUENT_SWATCHES = [
    { hex: '#0067C0', name: 'Azul Fluent' },
    { hex: '#008575', name: 'Verde azulado' },
    { hex: '#107C10', name: 'Verde bosque' },
    { hex: '#CA5010', name: 'Naranja terracota' },
    { hex: '#C42B1C', name: 'Rojo carmesí' },
    { hex: '#8764B8', name: 'Púrpura amatista' },
    { hex: '#4F6BED', name: 'Índigo' },
    { hex: '#5C5F66', name: 'Grafito neutro' }
  ];

  const CATEGORIES = {
    profundo: { label: 'Trabajo profundo', defaultColor: '#0067C0' },
    trabajo:  { label: 'Trabajo / Proyecto', defaultColor: '#4F6BED' },
    reunion:  { label: 'Reunión', defaultColor: '#CA5010' },
    personal: { label: 'Personal', defaultColor: '#008575' },
    salud:    { label: 'Salud / Ejercicio', defaultColor: '#107C10' },
    estudio:  { label: 'Estudio', defaultColor: '#8764B8' }
  };

  const WEEKDAY_NAMES_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const MONTH_NAMES_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  /* ========================================================================
     2. Utilidades de Fecha Local (100 % libres de desfase UTC) y Tiempo
     ======================================================================== */

  function parseLocalDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0, 0);
  }

  function formatLocalDate(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getTodayStr() {
    return formatLocalDate(new Date());
  }

  function addDays(dateStr, days) {
    const d = parseLocalDate(dateStr);
    d.setDate(d.getDate() + days);
    return formatLocalDate(d);
  }

  // Índice de día de semana con Lunes = 0 ... Domingo = 6
  function getWeekdayIndex(dateStr) {
    const d = parseLocalDate(dateStr);
    return (d.getDay() + 6) % 7;
  }

  function getMondayOfWeek(dateStr) {
    const idx = getWeekdayIndex(dateStr);
    return addDays(dateStr, -idx);
  }

  function getWeekDates(mondayStr) {
    return Array.from({ length: 7 }, (_, i) => addDays(mondayStr, i));
  }

  function getISOWeekInfo(dateStr) {
    const d = parseLocalDate(dateStr);
    const dayNum = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dayNum + 3);
    const isoYear = d.getFullYear();
    const jan4 = new Date(isoYear, 0, 4, 12, 0, 0, 0);
    const jan4DayNum = (jan4.getDay() + 6) % 7;
    const firstThursday = new Date(isoYear, 0, 4 - jan4DayNum + 3, 12, 0, 0, 0);
    const weekNo = 1 + Math.round((d - firstThursday) / (7 * 24 * 3600 * 1000));
    return {
      year: isoYear,
      week: weekNo,
      code: `${isoYear}-W${String(weekNo).padStart(2, '0')}`
    };
  }

  function formatReadableWeekRange(mondayStr) {
    const sundayStr = addDays(mondayStr, 6);
    const mon = parseLocalDate(mondayStr);
    const sun = parseLocalDate(sundayStr);
    const m1 = MONTH_NAMES_SHORT[mon.getMonth()];
    const m2 = MONTH_NAMES_SHORT[sun.getMonth()];
    if (mon.getFullYear() !== sun.getFullYear()) {
      return `${mon.getDate()} ${m1} ${mon.getFullYear()} – ${sun.getDate()} ${m2} ${sun.getFullYear()}`;
    }
    if (m1 === m2) {
      return `${mon.getDate()} – ${sun.getDate()} ${m2} ${sun.getFullYear()}`;
    }
    return `${mon.getDate()} ${m1} – ${sun.getDate()} ${m2} ${sun.getFullYear()}`;
  }

  function timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  function minutesToTime(totalMins) {
    const clamped = Math.max(0, Math.min(24 * 60, totalMins));
    const h = Math.floor(clamped / 60);
    const m = clamped % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  function formatDuration(mins) {
    if (mins <= 0) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  }

  function generateId(prefix = 'blk') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function normalizeHex(hex, fallback = '#0067C0') {
    if (typeof hex !== 'string') return fallback;
    const clean = hex.trim().toUpperCase();
    return /^#[0-9A-F]{6}$/.test(clean) ? clean : fallback;
  }

  /* ========================================================================
     3. Estado Global y Persistencia
     ======================================================================== */

  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const todayStr = getTodayStr();
  const initialMonday = getMondayOfWeek(todayStr);

  const defaultState = {
    settings: {
      theme: prefersDark ? 'dark' : 'light',
      workStart: 7,
      workEnd: 22,
      showFreeSlots: true,
      sidebarOpen: true
    },
    tasks: [],
    goalsByWeek: {},
    notesByWeek: {}
  };

  let state = loadState();
  let currentMonday = initialMonday;
  let activeMobileDate = todayStr;
  let dupSourceTaskId = null;
  let notesSaveTimer = null;
  let deferredInstallPrompt = null;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return createInitialSeedState();
      }
      const parsed = JSON.parse(raw);
      return sanitizeImportedState(parsed);
    } catch (err) {
      console.error('Error cargando estado local:', err);
      return structuredClone(defaultState);
    }
  }

  function createInitialSeedState() {
    const mon = getMondayOfWeek(getTodayStr());
    const wed = addDays(mon, 2);
    const fri = addDays(mon, 4);
    const isoCode = getISOWeekInfo(mon).code;

    const seeded = {
      settings: { ...defaultState.settings },
      tasks: [
        {
          id: generateId(),
          title: 'Planificación estratégica semanal',
          date: mon,
          start: '08:30',
          end: '10:00',
          category: 'profundo',
          color: '#0067C0',
          completed: true
        },
        {
          id: generateId(),
          title: 'Sincronización de equipo',
          date: mon,
          start: '11:00',
          end: '12:00',
          category: 'reunion',
          color: '#CA5010',
          completed: false
        },
        {
          id: generateId(),
          title: 'Bloque de desarrollo concentrado',
          date: wed,
          start: '09:00',
          end: '11:30',
          category: 'trabajo',
          color: '#4F6BED',
          completed: false
        },
        {
          id: generateId(),
          title: 'Entrenamiento físico',
          date: fri,
          start: '18:00',
          end: '19:15',
          category: 'salud',
          color: '#107C10',
          completed: false
        }
      ],
      goalsByWeek: {
        [isoCode]: [
          { id: generateId('goal'), text: 'Completar entregables clave sin interrupciones', completed: false },
          { id: generateId('goal'), text: 'Reservar al menos 2 bloques de trabajo profundo', completed: true }
        ]
      },
      notesByWeek: {
        [isoCode]: 'Priorizar bloques matutinos para tareas analíticas y agrupar reuniones por la tarde.'
      }
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  function sanitizeImportedState(raw) {
    const safeTheme = raw?.settings?.theme === 'dark' || raw?.settings?.theme === 'light'
      ? raw.settings.theme
      : (prefersDark ? 'dark' : 'light');

    const workStart = Number.isInteger(raw?.settings?.workStart) ? Math.max(0, Math.min(22, raw.settings.workStart)) : 7;
    const workEnd = Number.isInteger(raw?.settings?.workEnd) ? Math.max(workStart + 1, Math.min(24, raw.settings.workEnd)) : 22;

    const tasks = Array.isArray(raw?.tasks)
      ? raw.tasks
          .filter(t => t && typeof t.title === 'string' && typeof t.date === 'string' && typeof t.start === 'string' && typeof t.end === 'string')
          .map(t => {
            const cat = CATEGORIES[t.category] ? t.category : 'trabajo';
            return {
              id: typeof t.id === 'string' && t.id ? t.id : generateId(),
              title: t.title.trim(),
              date: t.date,
              start: t.start,
              end: t.end,
              category: cat,
              color: normalizeHex(t.color, CATEGORIES[cat].defaultColor),
              completed: Boolean(t.completed)
            };
          })
      : [];

    const goalsByWeek = (raw?.goalsByWeek && typeof raw.goalsByWeek === 'object') ? raw.goalsByWeek : {};
    const notesByWeek = (raw?.notesByWeek && typeof raw.notesByWeek === 'object') ? raw.notesByWeek : {};

    return {
      settings: {
        theme: safeTheme,
        workStart,
        workEnd,
        showFreeSlots: raw?.settings?.showFreeSlots !== undefined ? Boolean(raw.settings.showFreeSlots) : true,
        sidebarOpen: raw?.settings?.sidebarOpen !== undefined ? Boolean(raw.settings.sidebarOpen) : true
      },
      tasks,
      goalsByWeek,
      notesByWeek
    };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('No se pudo guardar en localStorage:', err);
      showToast('Error al guardar en almacenamiento local.');
    }
  }

  /* ========================================================================
     4. Referencias del DOM
     ======================================================================== */

  const els = {
    themeColorMeta: document.getElementById('themeColorMeta'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIcon: document.getElementById('themeIcon'),
    themeLabel: document.getElementById('themeLabel'),
    netStatusBadge: document.getElementById('netStatusBadge'),
    installPwaBtn: document.getElementById('installPwaBtn'),

    prevWeekBtn: document.getElementById('prevWeekBtn'),
    todayBtn: document.getElementById('todayBtn'),
    nextWeekBtn: document.getElementById('nextWeekBtn'),
    isoWeekBadge: document.getElementById('isoWeekBadge'),
    weekRangeText: document.getElementById('weekRangeText'),
    dateJumpInput: document.getElementById('dateJumpInput'),

    workStartSelect: document.getElementById('workStartSelect'),
    workEndSelect: document.getElementById('workEndSelect'),
    toggleFreeSlots: document.getElementById('toggleFreeSlots'),
    newTaskBtn: document.getElementById('newTaskBtn'),

    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    importFileInput: document.getElementById('importFileInput'),
    sidebarToggleBtn: document.getElementById('sidebarToggleBtn'),

    metricBlocks: document.getElementById('metricBlocks'),
    metricCompleted: document.getElementById('metricCompleted'),
    metricPlanned: document.getElementById('metricPlanned'),
    metricFree: document.getElementById('metricFree'),

    mobileDayStrip: document.getElementById('mobileDayStrip'),
    gridHeaders: document.getElementById('gridHeaders'),
    gridScrollArea: document.getElementById('gridScrollArea'),
    gridCanvas: document.getElementById('gridCanvas'),
    timeAxis: document.getElementById('timeAxis'),
    dayColumns: document.getElementById('dayColumns'),

    sidebar: document.getElementById('sidebar'),
    sidebarBackdrop: document.getElementById('sidebarBackdrop'),
    sidebarCloseMobile: document.getElementById('sidebarCloseMobile'),
    sidebarWeekCode: document.getElementById('sidebarWeekCode'),
    goalsCounter: document.getElementById('goalsCounter'),
    goalForm: document.getElementById('goalForm'),
    goalInput: document.getElementById('goalInput'),
    goalsList: document.getElementById('goalsList'),
    weeklyNotesInput: document.getElementById('weeklyNotesInput'),
    notesSaveStatus: document.getElementById('notesSaveStatus'),

    // Modal Crear/Editar
    taskModal: document.getElementById('taskModal'),
    taskModalTitle: document.getElementById('taskModalTitle'),
    closeTaskModalBtn: document.getElementById('closeTaskModalBtn'),
    cancelTaskModalBtn: document.getElementById('cancelTaskModalBtn'),
    taskForm: document.getElementById('taskForm'),
    taskIdInput: document.getElementById('taskIdInput'),
    taskTitleInput: document.getElementById('taskTitleInput'),
    taskDateInput: document.getElementById('taskDateInput'),
    taskCategorySelect: document.getElementById('taskCategorySelect'),
    colorSwatches: document.getElementById('colorSwatches'),
    taskCustomColorInput: document.getElementById('taskCustomColorInput'),
    taskColorHex: document.getElementById('taskColorHex'),
    taskStartInput: document.getElementById('taskStartInput'),
    taskEndInput: document.getElementById('taskEndInput'),
    taskDurationPreview: document.getElementById('taskDurationPreview'),
    durationChips: document.getElementById('durationChips'),
    taskCompletedInput: document.getElementById('taskCompletedInput'),
    taskFormError: document.getElementById('taskFormError'),
    deleteTaskBtn: document.getElementById('deleteTaskBtn'),
    openDupFromModalBtn: document.getElementById('openDupFromModalBtn'),

    // Modal Duplicación
    dupModal: document.getElementById('dupModal'),
    closeDupModalBtn: document.getElementById('closeDupModalBtn'),
    cancelDupModalBtn: document.getElementById('cancelDupModalBtn'),
    dupForm: document.getElementById('dupForm'),
    dupSourceBanner: document.getElementById('dupSourceBanner'),
    dupPanelWeekDays: document.getElementById('dupPanelWeekDays'),
    dupPanelNextWeeks: document.getElementById('dupPanelNextWeeks'),
    dupPanelRestOfYear: document.getElementById('dupPanelRestOfYear'),
    dupPanelCustomRange: document.getElementById('dupPanelCustomRange'),
    dupWeekDaysSelector: document.getElementById('dupWeekDaysSelector'),
    dupWeeksCountInput: document.getElementById('dupWeeksCountInput'),
    quickWeeksChips: document.getElementById('quickWeeksChips'),
    restOfYearHint: document.getElementById('restOfYearHint'),
    dupRangeStartInput: document.getElementById('dupRangeStartInput'),
    dupRangeEndInput: document.getElementById('dupRangeEndInput'),
    dupCustomDaysSelector: document.getElementById('dupCustomDaysSelector'),
    dupSkipIdentical: document.getElementById('dupSkipIdentical'),
    dupAsPending: document.getElementById('dupAsPending'),
    dupPreviewBox: document.getElementById('dupPreviewBox'),
    confirmDupBtn: document.getElementById('confirmDupBtn'),

    toastContainer: document.getElementById('toastContainer')
  };

  /* ========================================================================
     5. Tema Claro / Oscuro Fluent 2
     ======================================================================== */

  const SUN_SVG = `<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3.2" stroke="currentColor" stroke-width="1.5"/><path d="M8 1.5V3M8 13V14.5M1.5 8H3M13 8H14.5M3.4 3.4L4.5 4.5M11.5 11.5L12.6 12.6M12.6 3.4L11.5 4.5M4.5 11.5L3.4 12.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  const MOON_SVG = `<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M13.2 10.2A5.5 5.5 0 0 1 5.8 2.8a5.5 5.5 0 1 0 7.4 7.4Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`;

  function applyTheme(theme) {
    const resolved = theme === 'dark' ? 'dark' : 'light';
    state.settings.theme = resolved;
    document.documentElement.setAttribute('data-theme', resolved);
    if (els.themeColorMeta) {
      els.themeColorMeta.setAttribute('content', resolved === 'dark' ? '#202020' : '#F3F3F3');
    }
    els.themeIcon.innerHTML = resolved === 'dark' ? MOON_SVG : SUN_SVG;
    els.themeLabel.textContent = resolved === 'dark' ? 'Oscuro' : 'Claro';
  }

  /* ========================================================================
     6. Inicialización de Selectores de Jornada y Swatches
     ======================================================================== */

  function initWorkdaySelectors() {
    els.workStartSelect.innerHTML = '';
    els.workEndSelect.innerHTML = '';

    for (let h = 0; h <= 23; h++) {
      const opt = document.createElement('option');
      opt.value = String(h);
      opt.textContent = `${String(h).padStart(2, '0')}:00`;
      els.workStartSelect.appendChild(opt);
    }

    for (let h = 1; h <= 24; h++) {
      const opt = document.createElement('option');
      opt.value = String(h);
      opt.textContent = h === 24 ? '24:00' : `${String(h).padStart(2, '0')}:00`;
      els.workEndSelect.appendChild(opt);
    }

    els.workStartSelect.value = String(state.settings.workStart);
    els.workEndSelect.value = String(state.settings.workEnd);
    els.toggleFreeSlots.checked = state.settings.showFreeSlots;
  }

  function initColorSwatches() {
    els.colorSwatches.innerHTML = '';
    FLUENT_SWATCHES.forEach(swatch => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'swatch-btn';
      btn.style.setProperty('--swatch-color', swatch.hex);
      btn.dataset.hex = swatch.hex;
      btn.title = `${swatch.name} (${swatch.hex})`;
      btn.setAttribute('aria-label', `${swatch.name} ${swatch.hex}`);
      btn.addEventListener('click', () => setSelectedTaskColor(swatch.hex));
      els.colorSwatches.appendChild(btn);
    });
  }

  function setSelectedTaskColor(hex) {
    const normalized = normalizeHex(hex, '#0067C0');
    els.taskCustomColorInput.value = normalized;
    els.taskColorHex.textContent = normalized;
    els.colorSwatches.querySelectorAll('.swatch-btn').forEach(btn => {
      btn.classList.toggle('is-selected', btn.dataset.hex === normalized);
    });
  }

  /* ========================================================================
     7. Cálculo de Huecos Libres y Solapamientos
     ======================================================================== */

  function computeFreeSlots(dayTasks, workStartMins, workEndMins) {
    if (workEndMins <= workStartMins) return [];

    const busy = dayTasks
      .map(t => ({
        start: Math.max(workStartMins, timeToMinutes(t.start)),
        end: Math.min(workEndMins, timeToMinutes(t.end))
      }))
      .filter(iv => iv.end > iv.start)
      .sort((a, b) => a.start - b.start || a.end - b.end);

    const merged = [];
    for (const iv of busy) {
      if (!merged.length || iv.start > merged[merged.length - 1].end) {
        merged.push({ ...iv });
      } else {
        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, iv.end);
      }
    }

    const freeSlots = [];
    let cursor = workStartMins;
    for (const iv of merged) {
      if (iv.start - cursor >= 15) {
        freeSlots.push({
          start: cursor,
          end: iv.start,
          duration: iv.start - cursor
        });
      }
      cursor = Math.max(cursor, iv.end);
    }

    if (workEndMins - cursor >= 15) {
      freeSlots.push({
        start: cursor,
        end: workEndMins,
        duration: workEndMins - cursor
      });
    }

    return freeSlots;
  }

  // Asigna subcolumnas paralelas a tareas solapadas para evitar superposición visual
  function layoutOverlappingTasks(dayTasks) {
    const items = dayTasks
      .map(t => ({
        task: t,
        startMins: timeToMinutes(t.start),
        endMins: timeToMinutes(t.end)
      }))
      .filter(item => item.endMins > item.startMins)
      .sort((a, b) => a.startMins - b.startMins || (b.endMins - b.startMins) - (a.endMins - a.startMins));

    const clusters = [];
    let currentCluster = [];
    let clusterEnd = -1;

    for (const item of items) {
      if (!currentCluster.length || item.startMins < clusterEnd) {
        currentCluster.push(item);
        clusterEnd = Math.max(clusterEnd, item.endMins);
      } else {
        clusters.push(currentCluster);
        currentCluster = [item];
        clusterEnd = item.endMins;
      }
    }
    if (currentCluster.length) clusters.push(currentCluster);

    const positioned = [];
    for (const cluster of clusters) {
      const colEnds = [];
      for (const item of cluster) {
        let placedCol = colEnds.findIndex(end => end <= item.startMins);
        if (placedCol === -1) {
          placedCol = colEnds.length;
          colEnds.push(item.endMins);
        } else {
          colEnds[placedCol] = item.endMins;
        }
        item.colIndex = placedCol;
      }
      const totalCols = colEnds.length;
      for (const item of cluster) {
        positioned.push({
          ...item,
          totalCols
        });
      }
    }

    return positioned;
  }

  /* ========================================================================
     8. Renderizado Principal (Grilla, Métricas, Tira Móvil, Sidebar)
     ======================================================================== */

  function renderAll() {
    const weekDates = getWeekDates(currentMonday);
    if (!weekDates.includes(activeMobileDate)) {
      activeMobileDate = weekDates.includes(getTodayStr()) ? getTodayStr() : weekDates[0];
    }

    const isoInfo = getISOWeekInfo(currentMonday);
    els.isoWeekBadge.textContent = isoInfo.code;
    els.weekRangeText.textContent = formatReadableWeekRange(currentMonday);
    els.dateJumpInput.value = activeMobileDate;

    const workStartMins = state.settings.workStart * 60;
    const workEndMins = state.settings.workEnd * 60;

    // Agrupar tareas por fecha de la semana actual
    const tasksByDate = {};
    let displayStartHour = state.settings.workStart;
    let displayEndHour = state.settings.workEnd;

    let weeklyBlockCount = 0;
    let weeklyCompletedCount = 0;
    let weeklyPlannedMins = 0;
    let weeklyFreeMins = 0;

    const freeSlotsByDate = {};

    for (const dateStr of weekDates) {
      const dayTasks = state.tasks.filter(t => t.date === dateStr);
      tasksByDate[dateStr] = dayTasks;

      for (const t of dayTasks) {
        const s = timeToMinutes(t.start);
        const e = timeToMinutes(t.end);
        if (e > s) {
          weeklyBlockCount++;
          if (t.completed) weeklyCompletedCount++;
          weeklyPlannedMins += (e - s);
          displayStartHour = Math.min(displayStartHour, Math.floor(s / 60));
          displayEndHour = Math.max(displayEndHour, Math.ceil(e / 60));
        }
      }

      const dayFree = computeFreeSlots(dayTasks, workStartMins, workEndMins);
      freeSlotsByDate[dateStr] = dayFree;
      weeklyFreeMins += dayFree.reduce((acc, slot) => acc + slot.duration, 0);
    }

    // Actualizar métricas semanales
    els.metricBlocks.textContent = String(weeklyBlockCount);
    els.metricCompleted.textContent = `(${weeklyCompletedCount} completados)`;
    els.metricPlanned.textContent = formatDuration(weeklyPlannedMins);
    els.metricFree.textContent = formatDuration(weeklyFreeMins);

    renderMobileDayStrip(weekDates, tasksByDate);
    renderGrid(weekDates, tasksByDate, freeSlotsByDate, displayStartHour, displayEndHour);
    renderSidebar(isoInfo.code);
  }

  function renderMobileDayStrip(weekDates, tasksByDate) {
    const today = getTodayStr();
    els.mobileDayStrip.innerHTML = '';

    weekDates.forEach((dateStr, idx) => {
      const d = parseLocalDate(dateStr);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mobile-day-btn';
      if (dateStr === today) btn.classList.add('is-today');
      if (dateStr === activeMobileDate) btn.classList.add('is-active');

      const count = tasksByDate[dateStr]?.length || 0;
      btn.innerHTML = `
        <span class="m-day-name">${WEEKDAY_NAMES_SHORT[idx]}</span>
        <span class="m-day-num">${d.getDate()}</span>
      `;
      btn.title = `${WEEKDAY_NAMES_SHORT[idx]} ${d.getDate()} (${count} bloques)`;
      btn.addEventListener('click', () => {
        activeMobileDate = dateStr;
        renderAll();
      });
      els.mobileDayStrip.appendChild(btn);
    });
  }

  function renderGrid(weekDates, tasksByDate, freeSlotsByDate, displayStartHour, displayEndHour) {
    const today = getTodayStr();
    const totalHours = Math.max(1, displayEndHour - displayStartHour);
    const totalHeightPx = totalHours * PIXELS_PER_HOUR;

    // 1. Encabezados de días
    els.gridHeaders.innerHTML = '<div class="corner-cell mono">HORA</div>';
    weekDates.forEach((dateStr, idx) => {
      const d = parseLocalDate(dateStr);
      const isToday = dateStr === today;
      const freeMins = (freeSlotsByDate[dateStr] || []).reduce((acc, s) => acc + s.duration, 0);

      const header = document.createElement('div');
      header.className = 'day-header';
      if (isToday) header.classList.add('is-today');
      if (dateStr === activeMobileDate) header.classList.add('is-mobile-active');

      header.innerHTML = `
        <div class="day-header-top">
          <span class="day-name">${WEEKDAY_NAMES_SHORT[idx]} ${d.getDate()}</span>
          ${isToday ? '<span class="today-badge">HOY</span>' : ''}
        </div>
        <span class="day-free-counter mono">+ ${formatDuration(freeMins)} libre</span>
      `;
      els.gridHeaders.appendChild(header);
    });

    // 2. Eje horario vertical
    els.timeAxis.style.height = `${totalHeightPx}px`;
    els.timeAxis.innerHTML = '';

    for (let h = displayStartHour; h <= displayEndHour; h++) {
      const label = document.createElement('div');
      label.className = 'time-axis-label mono';
      if (h === displayStartHour) label.classList.add('is-first');
      const topPx = (h - displayStartHour) * PIXELS_PER_HOUR;
      if (h === displayEndHour) {
        label.style.top = `${topPx - 8}px`;
      } else {
        label.style.top = `${topPx}px`;
      }
      label.textContent = h === 24 ? '24:00' : `${String(h).padStart(2, '0')}:00`;
      els.timeAxis.appendChild(label);
    }

    // 3. Columnas de días
    els.dayColumns.innerHTML = '';
    const displayStartMins = displayStartHour * 60;
    const displayEndMins = displayEndHour * 60;
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();

    weekDates.forEach(dateStr => {
      const col = document.createElement('div');
      col.className = 'day-column';
      col.style.height = `${totalHeightPx}px`;
      if (dateStr === today) col.classList.add('is-today');
      if (dateStr === activeMobileDate) col.classList.add('is-mobile-active');

      // Celdas por hora (clic para crear bloque)
      for (let h = displayStartHour; h < displayEndHour; h++) {
        const slot = document.createElement('div');
        slot.className = 'hour-slot';
        if (h < state.settings.workStart || h >= state.settings.workEnd) {
          slot.classList.add('is-outside-workday');
        }
        slot.addEventListener('click', () => {
          const startStr = `${String(h).padStart(2, '0')}:00`;
          const endStr = minutesToTime(Math.min(24 * 60, (h + 1) * 60));
          openTaskModal({ date: dateStr, start: startStr, end: endStr });
        });
        col.appendChild(slot);
      }

      // Huecos libres detectados automáticamente
      if (state.settings.showFreeSlots) {
        const freeSlots = freeSlotsByDate[dateStr] || [];
        for (const free of freeSlots) {
          const topPx = ((free.start - displayStartMins) / 60) * PIXELS_PER_HOUR + 2;
          const heightPx = Math.max(14, ((free.end - free.start) / 60) * PIXELS_PER_HOUR - 4);

          const freeEl = document.createElement('div');
          freeEl.className = 'free-slot-block';
          if (heightPx < 34) freeEl.classList.add('is-compact');
          freeEl.style.top = `${topPx}px`;
          freeEl.style.height = `${heightPx}px`;
          freeEl.title = `Espacio disponible (${minutesToTime(free.start)} – ${minutesToTime(free.end)}). Clic para agendar.`;

          freeEl.innerHTML = `
            <span class="free-slot-badge mono">+ ${formatDuration(free.duration)} libre</span>
            ${heightPx >= 34 ? `<span class="free-slot-range mono">${minutesToTime(free.start)}–${minutesToTime(free.end)}</span>` : ''}
          `;

          freeEl.addEventListener('click', e => {
            e.stopPropagation();
            openTaskModal({
              date: dateStr,
              start: minutesToTime(free.start),
              end: minutesToTime(free.end)
            });
          });

          col.appendChild(freeEl);
        }
      }

      // Bloques de actividad (con subcolumnas para solapamientos)
      const positionedTasks = layoutOverlappingTasks(tasksByDate[dateStr] || []);
      for (const item of positionedTasks) {
        const { task, startMins, endMins, colIndex, totalCols } = item;
        const topPx = ((startMins - displayStartMins) / 60) * PIXELS_PER_HOUR + 1;
        const heightPx = Math.max(22, ((endMins - startMins) / 60) * PIXELS_PER_HOUR - 2);

        const card = document.createElement('article');
        card.className = 'task-card';
        if (task.completed) card.classList.add('is-completed');
        if (heightPx <= 38) card.classList.add('is-short');

        card.style.setProperty('--task-accent', task.color);
        card.style.top = `${topPx}px`;
        card.style.height = `${heightPx}px`;
        card.style.left = `calc(${(colIndex / totalCols) * 100}% + 3px)`;
        card.style.width = `calc(${(1 / totalCols) * 100}% - 6px)`;

        card.innerHTML = `
          <div class="task-card-top">
            <div class="task-check-title">
              <input type="checkbox" class="fluent-checkbox" ${task.completed ? 'checked' : ''} aria-label="Completar ${escapeHtml(task.title)}">
              <span class="task-title">${escapeHtml(task.title)}</span>
            </div>
            <button type="button" class="task-dup-btn" title="Duplicar este bloque">Dup</button>
          </div>
          <div class="task-card-meta mono">
            <span>${task.start}–${task.end}</span>
            <span>${formatDuration(endMins - startMins)}</span>
          </div>
        `;

        const checkbox = card.querySelector('.fluent-checkbox');
        checkbox.addEventListener('click', e => {
          e.stopPropagation();
          toggleTaskCompleted(task.id);
        });

        const dupBtn = card.querySelector('.task-dup-btn');
        dupBtn.addEventListener('click', e => {
          e.stopPropagation();
          openDupModal(task.id);
        });

        card.addEventListener('click', () => {
          openTaskModal({ task });
        });

        col.appendChild(card);
      }

      // Línea de hora actual sobre HOY
      if (dateStr === today && nowMins >= displayStartMins && nowMins <= displayEndMins) {
        const nowLine = document.createElement('div');
        nowLine.className = 'now-indicator';
        nowLine.style.top = `${((nowMins - displayStartMins) / 60) * PIXELS_PER_HOUR}px`;
        col.appendChild(nowLine);
      }

      els.dayColumns.appendChild(col);
    });
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ========================================================================
     9. Panel Lateral: Objetivos Semanales y Notas con Autoguardado
     ======================================================================== */

  function renderSidebar(isoCode) {
    els.sidebarWeekCode.textContent = isoCode;

    // Estado colapsado en escritorio
    els.sidebar.classList.toggle('is-collapsed', !state.settings.sidebarOpen);
    els.sidebarToggleBtn.setAttribute('aria-expanded', String(state.settings.sidebarOpen));

    // Objetivos de la semana ISO
    const goals = state.goalsByWeek[isoCode] || [];
    const doneCount = goals.filter(g => g.completed).length;
    els.goalsCounter.textContent = `${doneCount}/${goals.length}`;

    els.goalsList.innerHTML = '';
    if (!goals.length) {
      els.goalsList.innerHTML = '<li class="empty-state-text">Sin objetivos definidos para esta semana.</li>';
    } else {
      goals.forEach(goal => {
        const li = document.createElement('li');
        li.className = 'goal-item';
        if (goal.completed) li.classList.add('is-completed');

        li.innerHTML = `
          <label class="goal-item-label">
            <input type="checkbox" class="fluent-checkbox" ${goal.completed ? 'checked' : ''}>
            <span class="goal-text">${escapeHtml(goal.text)}</span>
          </label>
          <button type="button" class="goal-delete-btn" title="Eliminar objetivo" aria-label="Eliminar objetivo">&times;</button>
        `;

        li.querySelector('.fluent-checkbox').addEventListener('change', () => {
          goal.completed = !goal.completed;
          saveState();
          renderSidebar(isoCode);
        });

        li.querySelector('.goal-delete-btn').addEventListener('click', () => {
          state.goalsByWeek[isoCode] = (state.goalsByWeek[isoCode] || []).filter(g => g.id !== goal.id);
          saveState();
          renderSidebar(isoCode);
        });

        els.goalsList.appendChild(li);
      });
    }

    // Notas de la semana ISO (evitar sobrescribir si el usuario está escribiendo activamente)
    const savedNote = state.notesByWeek[isoCode] || '';
    if (document.activeElement !== els.weeklyNotesInput) {
      els.weeklyNotesInput.value = savedNote;
      els.notesSaveStatus.classList.remove('is-saving');
      els.notesSaveStatus.textContent = savedNote ? 'Sincronizado' : 'Listo';
    }
  }

  function flushWeeklyNotesSave() {
    if (notesSaveTimer) {
      clearTimeout(notesSaveTimer);
      notesSaveTimer = null;
    }
    const isoCode = getISOWeekInfo(currentMonday).code;
    const text = els.weeklyNotesInput.value;
    if (text.trim() === '') {
      delete state.notesByWeek[isoCode];
    } else {
      state.notesByWeek[isoCode] = text;
    }
    saveState();

    const now = new Date();
    const stamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    els.notesSaveStatus.classList.remove('is-saving');
    els.notesSaveStatus.textContent = `Guardado · ${stamp}`;
  }

  /* ========================================================================
     10. Modal CRUD de Bloques Horarios
     ======================================================================== */

  function openTaskModal({ task = null, date = null, start = null, end = null } = {}) {
    els.taskFormError.hidden = true;

    if (task) {
      els.taskModalTitle.textContent = 'Editar bloque horario';
      els.taskIdInput.value = task.id;
      els.taskTitleInput.value = task.title;
      els.taskDateInput.value = task.date;
      els.taskCategorySelect.value = CATEGORIES[task.category] ? task.category : 'trabajo';
      setSelectedTaskColor(task.color);
      els.taskStartInput.value = task.start;
      els.taskEndInput.value = task.end;
      els.taskCompletedInput.checked = Boolean(task.completed);
      els.deleteTaskBtn.hidden = false;
      els.openDupFromModalBtn.hidden = false;
    } else {
      els.taskModalTitle.textContent = 'Nuevo bloque horario';
      els.taskIdInput.value = '';
      els.taskTitleInput.value = '';
      els.taskDateInput.value = date || activeMobileDate || getTodayStr();
      els.taskCategorySelect.value = 'profundo';
      setSelectedTaskColor(CATEGORIES.profundo.defaultColor);
      els.taskStartInput.value = start || '09:00';
      els.taskEndInput.value = end || '10:00';
      els.taskCompletedInput.checked = false;
      els.deleteTaskBtn.hidden = true;
      els.openDupFromModalBtn.hidden = true;
    }

    updateTaskDurationPreview();
    els.taskModal.hidden = false;
    setTimeout(() => els.taskTitleInput.focus(), 30);
  }

  function closeTaskModal() {
    els.taskModal.hidden = true;
  }

  function updateTaskDurationPreview() {
    const s = els.taskStartInput.value;
    const e = els.taskEndInput.value;
    if (!s || !e) {
      els.taskDurationPreview.textContent = '--';
      return;
    }
    const diff = timeToMinutes(e) - timeToMinutes(s);
    els.taskDurationPreview.textContent = diff > 0 ? formatDuration(diff) : 'Inválido';

    els.durationChips.querySelectorAll('.chip-btn').forEach(btn => {
      btn.classList.toggle('is-active', Number(btn.dataset.mins) === diff);
    });
  }

  function toggleTaskCompleted(taskId) {
    const target = state.tasks.find(t => t.id === taskId);
    if (!target) return;
    target.completed = !target.completed;
    saveState();
    renderAll();
  }

  /* ========================================================================
     11. Sistema Avanzado de Duplicación Inteligente (4 Modos)
     ======================================================================== */

  function openDupModal(taskId) {
    const source = state.tasks.find(t => t.id === taskId);
    if (!source) return;

    dupSourceTaskId = source.id;
    closeTaskModal();

    const durationMins = timeToMinutes(source.end) - timeToMinutes(source.start);
    els.dupSourceBanner.style.setProperty('--source-color', source.color);
    els.dupSourceBanner.innerHTML = `
      <div>
        <strong>${escapeHtml(source.title)}</strong>
        <div class="helper-text mono">${source.date} · ${source.start}–${source.end} (${formatDuration(durationMins)})</div>
      </div>
      <span class="iso-pill mono">${getISOWeekInfo(source.date).code}</span>
    `;

    // Reiniciar modo por defecto a 'weekDays'
    const defaultRadio = els.dupForm.querySelector('input[name="dupMode"][value="weekDays"]');
    if (defaultRadio) defaultRadio.checked = true;

    // Construir selector de días de la misma semana
    const sourceMonday = getMondayOfWeek(source.date);
    const sourceWeekDates = getWeekDates(sourceMonday);
    const sourceWeekdayIdx = getWeekdayIndex(source.date);

    els.dupWeekDaysSelector.innerHTML = '';
    sourceWeekDates.forEach((dStr, idx) => {
      const dObj = parseLocalDate(dStr);
      const isSameOrigin = dStr === source.date;
      const label = document.createElement('label');
      label.className = 'weekday-pill';
      label.innerHTML = `
        <input type="checkbox" value="${dStr}" ${!isSameOrigin && idx < 5 ? 'checked' : ''}>
        <span>${WEEKDAY_NAMES_SHORT[idx]}</span>
        <span class="mono" style="font-size:10px;opacity:0.85">${dObj.getDate()}</span>
      `;
      els.dupWeekDaysSelector.appendChild(label);
    });

    // Configurar Resto del año
    const sourceYear = parseLocalDate(source.date).getFullYear();
    els.restOfYearHint.textContent = `Se replicará cada ${WEEKDAY_NAMES_SHORT[sourceWeekdayIdx]} desde ${addDays(source.date, 7)} hasta el 31 de diciembre de ${sourceYear}.`;

    // Configurar Periodo personalizado
    els.dupRangeStartInput.value = addDays(source.date, 1);
    els.dupRangeEndInput.value = addDays(source.date, 28);
    els.dupCustomDaysSelector.innerHTML = '';
    WEEKDAY_NAMES_SHORT.forEach((name, idx) => {
      const label = document.createElement('label');
      label.className = 'weekday-pill';
      label.innerHTML = `
        <input type="checkbox" value="${idx}" ${idx === sourceWeekdayIdx ? 'checked' : ''}>
        <span>${name}</span>
      `;
      els.dupCustomDaysSelector.appendChild(label);
    });

    updateDupModeVisibility();
    updateDupPreview();
    els.dupModal.hidden = false;
  }

  function closeDupModal() {
    els.dupModal.hidden = true;
    dupSourceTaskId = null;
  }

  function getSelectedDupMode() {
    const checked = els.dupForm.querySelector('input[name="dupMode"]:checked');
    return checked ? checked.value : 'weekDays';
  }

  function updateDupModeVisibility() {
    const mode = getSelectedDupMode();
    els.dupPanelWeekDays.hidden = mode !== 'weekDays';
    els.dupPanelNextWeeks.hidden = mode !== 'nextWeeks';
    els.dupPanelRestOfYear.hidden = mode !== 'restOfYear';
    els.dupPanelCustomRange.hidden = mode !== 'customRange';
  }

  function computeDuplicationTargetDates() {
    const source = state.tasks.find(t => t.id === dupSourceTaskId);
    if (!source) return [];

    const mode = getSelectedDupMode();
    const rawDates = [];

    if (mode === 'weekDays') {
      els.dupWeekDaysSelector.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        rawDates.push(cb.value);
      });
    } else if (mode === 'nextWeeks') {
      const count = Math.max(1, Math.min(104, parseInt(els.dupWeeksCountInput.value, 10) || 1));
      for (let w = 1; w <= count; w++) {
        rawDates.push(addDays(source.date, w * 7));
      }
    } else if (mode === 'restOfYear') {
      const year = parseLocalDate(source.date).getFullYear();
      const endOfYear = `${year}-12-31`;
      let cursor = addDays(source.date, 7);
      while (cursor <= endOfYear) {
        rawDates.push(cursor);
        cursor = addDays(cursor, 7);
      }
    } else if (mode === 'customRange') {
      const startStr = els.dupRangeStartInput.value;
      const endStr = els.dupRangeEndInput.value;
      const allowedWeekdays = new Set(
        Array.from(els.dupCustomDaysSelector.querySelectorAll('input[type="checkbox"]:checked')).map(cb => Number(cb.value))
      );

      if (startStr && endStr && startStr <= endStr && allowedWeekdays.size > 0) {
        let cursor = startStr;
        let safetyCounter = 0;
        while (cursor <= endStr && safetyCounter < 750) {
          if (allowedWeekdays.has(getWeekdayIndex(cursor))) {
            rawDates.push(cursor);
          }
          cursor = addDays(cursor, 1);
          safetyCounter++;
        }
      }
    }

    // Ordenar y deduplicar fechas
    const uniqueDates = Array.from(new Set(rawDates)).sort();

    // Filtrar si ya existe un bloque idéntico
    if (els.dupSkipIdentical.checked) {
      return uniqueDates.filter(dStr => {
        const exists = state.tasks.some(
          t => t.date === dStr && t.start === source.start && t.end === source.end && t.title.trim() === source.title.trim()
        );
        return !exists;
      });
    }

    return uniqueDates;
  }

  function updateDupPreview() {
    const dates = computeDuplicationTargetDates();
    const count = dates.length;
    els.confirmDupBtn.disabled = count === 0;
    els.confirmDupBtn.textContent = count > 0 ? `Duplicar (${count})` : 'Duplicar';

    if (count === 0) {
      els.dupPreviewBox.innerHTML = `<span style="color:var(--text-secondary)">No hay fechas nuevas para crear con la configuración actual.</span>`;
      return;
    }

    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    const rangeLabel = firstDate === lastDate ? firstDate : `${firstDate} → ${lastDate}`;

    els.dupPreviewBox.innerHTML = `
      <div>Se crearán <strong class="mono" style="color:var(--accent)">${count} ${count === 1 ? 'bloque' : 'bloques'}</strong> nuevos.</div>
      <div class="helper-text mono">Rango resultante: ${rangeLabel}</div>
    `;
  }

  /* ========================================================================
     12. Exportación e Importación JSON + Conectividad + Toast
     ======================================================================== */

  function exportBackupJson() {
    flushWeeklyNotesSave();
    const payload = {
      app: 'Planificador Semanal Fluent',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: state.settings,
      tasks: state.tasks,
      goalsByWeek: state.goalsByWeek,
      notesByWeek: state.notesByWeek
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planificador-semanal-${getTodayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Respaldo JSON exportado correctamente.');
  }

  function handleImportFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.tasks)) {
          throw new Error('Formato de archivo inválido.');
        }

        const sanitized = sanitizeImportedState(parsed);
        const msg = `Se importarán ${sanitized.tasks.length} bloques horarios y notas semanales, reemplazando los datos actuales. ¿Continuar?`;
        if (!window.confirm(msg)) return;

        state = sanitized;
        saveState();
        applyTheme(state.settings.theme);
        initWorkdaySelectors();
        renderAll();
        showToast(`Respaldo importado (${state.tasks.length} bloques).`);
      } catch (err) {
        console.error(err);
        showToast('El archivo JSON no tiene una estructura válida.');
      } finally {
        els.importFileInput.value = '';
      }
    };
    reader.readAsText(file);
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    els.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.18s ease';
      setTimeout(() => toast.remove(), 200);
    }, 2800);
  }

  function updateConnectivityBadge() {
    const online = navigator.onLine;
    els.netStatusBadge.textContent = online ? 'OFFLINE READY' : 'MODO OFFLINE';
    els.netStatusBadge.classList.toggle('is-offline', !online);
  }

  /* ========================================================================
     13. Registro de Eventos
     ======================================================================== */

  function bindEvents() {
    // Tema
    els.themeToggleBtn.addEventListener('click', () => {
      const next = state.settings.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      saveState();
    });

    // Navegación semanal
    els.prevWeekBtn.addEventListener('click', () => {
      currentMonday = addDays(currentMonday, -7);
      activeMobileDate = currentMonday;
      renderAll();
    });

    els.nextWeekBtn.addEventListener('click', () => {
      currentMonday = addDays(currentMonday, 7);
      activeMobileDate = currentMonday;
      renderAll();
    });

    els.todayBtn.addEventListener('click', () => {
      const today = getTodayStr();
      currentMonday = getMondayOfWeek(today);
      activeMobileDate = today;
      renderAll();
    });

    els.dateJumpInput.addEventListener('change', () => {
      const chosen = els.dateJumpInput.value;
      if (!chosen) return;
      currentMonday = getMondayOfWeek(chosen);
      activeMobileDate = chosen;
      renderAll();
    });

    // Jornada y huecos libres
    els.workStartSelect.addEventListener('change', () => {
      const start = Number(els.workStartSelect.value);
      let end = Number(els.workEndSelect.value);
      if (end <= start) {
        end = Math.min(24, start + 1);
        els.workEndSelect.value = String(end);
      }
      state.settings.workStart = start;
      state.settings.workEnd = end;
      saveState();
      renderAll();
    });

    els.workEndSelect.addEventListener('change', () => {
      const end = Number(els.workEndSelect.value);
      let start = Number(els.workStartSelect.value);
      if (start >= end) {
        start = Math.max(0, end - 1);
        els.workStartSelect.value = String(start);
      }
      state.settings.workStart = start;
      state.settings.workEnd = end;
      saveState();
      renderAll();
    });

    els.toggleFreeSlots.addEventListener('change', () => {
      state.settings.showFreeSlots = els.toggleFreeSlots.checked;
      saveState();
      renderAll();
    });

    // Botón Nuevo Bloque
    els.newTaskBtn.addEventListener('click', () => {
      openTaskModal({ date: activeMobileDate });
    });

    // Exportar / Importar
    els.exportBtn.addEventListener('click', exportBackupJson);
    els.importBtn.addEventListener('click', () => els.importFileInput.click());
    els.importFileInput.addEventListener('change', e => handleImportFile(e.target.files[0]));

    // Sidebar colapsable (Escritorio + Drawer móvil)
    els.sidebarToggleBtn.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        const isOpen = els.sidebar.classList.toggle('is-mobile-open');
        els.sidebarBackdrop.classList.toggle('is-open', isOpen);
      } else {
        state.settings.sidebarOpen = !state.settings.sidebarOpen;
        saveState();
        renderSidebar(getISOWeekInfo(currentMonday).code);
      }
    });

    const closeMobileSidebar = () => {
      els.sidebar.classList.remove('is-mobile-open');
      els.sidebarBackdrop.classList.remove('is-open');
    };
    els.sidebarBackdrop.addEventListener('click', closeMobileSidebar);
    els.sidebarCloseMobile.addEventListener('click', closeMobileSidebar);

    // Objetivos semanales
    els.goalForm.addEventListener('submit', e => {
      e.preventDefault();
      const text = els.goalInput.value.trim();
      if (!text) return;
      const isoCode = getISOWeekInfo(currentMonday).code;
      if (!state.goalsByWeek[isoCode]) state.goalsByWeek[isoCode] = [];
      state.goalsByWeek[isoCode].push({
        id: generateId('goal'),
        text,
        completed: false
      });
      els.goalInput.value = '';
      saveState();
      renderSidebar(isoCode);
    });

    // Notas semanales con autoguardado instantáneo (debounce 220 ms + blur)
    els.weeklyNotesInput.addEventListener('input', () => {
      els.notesSaveStatus.classList.add('is-saving');
      els.notesSaveStatus.textContent = 'Guardando...';
      if (notesSaveTimer) clearTimeout(notesSaveTimer);
      notesSaveTimer = setTimeout(flushWeeklyNotesSave, 220);
    });

    els.weeklyNotesInput.addEventListener('blur', flushWeeklyNotesSave);

    // Modal Crear/Editar Bloque
    els.closeTaskModalBtn.addEventListener('click', closeTaskModal);
    els.cancelTaskModalBtn.addEventListener('click', closeTaskModal);
    els.taskModal.addEventListener('click', e => {
      if (e.target === els.taskModal) closeTaskModal();
    });

    els.taskCategorySelect.addEventListener('change', () => {
      const cat = els.taskCategorySelect.value;
      if (CATEGORIES[cat]) {
        setSelectedTaskColor(CATEGORIES[cat].defaultColor);
      }
    });

    els.taskCustomColorInput.addEventListener('input', e => {
      setSelectedTaskColor(e.target.value);
    });

    els.taskStartInput.addEventListener('input', updateTaskDurationPreview);
    els.taskEndInput.addEventListener('input', updateTaskDurationPreview);

    els.durationChips.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mins = Number(btn.dataset.mins);
        const startMins = els.taskStartInput.value ? timeToMinutes(els.taskStartInput.value) : 9 * 60;
        if (!els.taskStartInput.value) els.taskStartInput.value = '09:00';
        const endMins = Math.min(24 * 60, startMins + mins);
        els.taskEndInput.value = minutesToTime(endMins);
        updateTaskDurationPreview();
      });
    });

    els.taskForm.addEventListener('submit', e => {
      e.preventDefault();
      const title = els.taskTitleInput.value.trim();
      const date = els.taskDateInput.value;
      const category = els.taskCategorySelect.value;
      const color = normalizeHex(els.taskCustomColorInput.value, CATEGORIES[category]?.defaultColor || '#0067C0');
      const start = els.taskStartInput.value;
      const end = els.taskEndInput.value;
      const completed = els.taskCompletedInput.checked;

      if (!title || !date || !start || !end) {
        els.taskFormError.textContent = 'Completá todos los campos obligatorios.';
        els.taskFormError.hidden = false;
        return;
      }

      if (timeToMinutes(end) <= timeToMinutes(start)) {
        els.taskFormError.textContent = 'La hora de fin debe ser posterior a la hora de inicio.';
        els.taskFormError.hidden = false;
        return;
      }

      const existingId = els.taskIdInput.value;
      if (existingId) {
        const idx = state.tasks.findIndex(t => t.id === existingId);
        if (idx !== -1) {
          state.tasks[idx] = { ...state.tasks[idx], title, date, category, color, start, end, completed };
        }
      } else {
        state.tasks.push({
          id: generateId(),
          title,
          date,
          category,
          color,
          start,
          end,
          completed
        });
      }

      currentMonday = getMondayOfWeek(date);
      activeMobileDate = date;
      saveState();
      closeTaskModal();
      renderAll();
    });

    els.deleteTaskBtn.addEventListener('click', () => {
      const id = els.taskIdInput.value;
      if (!id) return;
      state.tasks = state.tasks.filter(t => t.id !== id);
      saveState();
      closeTaskModal();
      renderAll();
      showToast('Bloque eliminado.');
    });

    els.openDupFromModalBtn.addEventListener('click', () => {
      const id = els.taskIdInput.value;
      if (id) openDupModal(id);
    });

    // Modal Duplicación Inteligente
    els.closeDupModalBtn.addEventListener('click', closeDupModal);
    els.cancelDupModalBtn.addEventListener('click', closeDupModal);
    els.dupModal.addEventListener('click', e => {
      if (e.target === els.dupModal) closeDupModal();
    });

    els.dupForm.querySelectorAll('input[name="dupMode"]').forEach(radio => {
      radio.addEventListener('change', () => {
        updateDupModeVisibility();
        updateDupPreview();
      });
    });

    els.dupWeekDaysSelector.addEventListener('change', updateDupPreview);
    els.dupWeeksCountInput.addEventListener('input', updateDupPreview);
    els.dupRangeStartInput.addEventListener('change', updateDupPreview);
    els.dupRangeEndInput.addEventListener('change', updateDupPreview);
    els.dupCustomDaysSelector.addEventListener('change', updateDupPreview);
    els.dupSkipIdentical.addEventListener('change', updateDupPreview);
    els.dupAsPending.addEventListener('change', updateDupPreview);

    els.quickWeeksChips.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        els.dupWeeksCountInput.value = btn.dataset.weeks;
        updateDupPreview();
      });
    });

    els.dupForm.addEventListener('submit', e => {
      e.preventDefault();
      const source = state.tasks.find(t => t.id === dupSourceTaskId);
      if (!source) return;

      const targetDates = computeDuplicationTargetDates();
      if (!targetDates.length) return;

      const asPending = els.dupAsPending.checked;
      for (const dateStr of targetDates) {
        state.tasks.push({
          id: generateId(),
          title: source.title,
          date: dateStr,
          start: source.start,
          end: source.end,
          category: source.category,
          color: source.color,
          completed: asPending ? false : Boolean(source.completed)
        });
      }

      saveState();
      closeDupModal();
      renderAll();
      showToast(`Se crearon ${targetDates.length} bloques duplicados.`);
    });

    // Atajos de teclado
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (!els.dupModal.hidden) closeDupModal();
        else if (!els.taskModal.hidden) closeTaskModal();
        else closeMobileSidebar();
      }
    });

    // Conectividad y PWA Install Prompt
    window.addEventListener('online', updateConnectivityBadge);
    window.addEventListener('offline', updateConnectivityBadge);

    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredInstallPrompt = e;
      els.installPwaBtn.hidden = false;
    });

    els.installPwaBtn.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      els.installPwaBtn.hidden = true;
    });

    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      els.installPwaBtn.hidden = true;
      showToast('Aplicación instalada en el dispositivo.');
    });
  }

  /* ========================================================================
     14. Registro del Service Worker y Arranque
     ======================================================================== */

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => {
          console.warn('Service Worker no registrado:', err);
        });
      });
    }
  }

  function init() {
    applyTheme(state.settings.theme);
    initWorkdaySelectors();
    initColorSwatches();
    updateConnectivityBadge();
    bindEvents();
    renderAll();
    registerServiceWorker();

    // Actualizar línea de hora actual cada minuto
    setInterval(() => {
      if (els.taskModal.hidden && els.dupModal.hidden) {
        renderAll();
      }
    }, 60000);
  }

  init();
})();