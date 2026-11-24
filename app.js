(() => {
  'use strict';

  /* ========================================================================
     1. Constantes y Configuración Fluent 2
     ======================================================================== */

  const STORAGE_KEY = 'fluent_planner_state_v1';
  const PIXELS_PER_HOUR = 60;
  const DEFAULT_FREE_SLOT_COLOR = '#008575';
  const MAX_HISTORY_STEPS = 50;

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

  const COUNTRY_LABELS = {
    AR: 'Argentina',
    UY: 'Uruguay',
    CL: 'Chile',
    BR: 'Brasil',
    CO: 'Colombia',
    MX: 'México',
    PE: 'Perú',
    ES: 'España',
    US: 'Estados Unidos'
  };

  // Respaldo inicial oficial de Argentina (Ley 27.399 / Jefatura de Gabinete) para funcionamiento offline inmediato
  const FALLBACK_AR_HOLIDAYS = {
    2026: [
      { date: '2026-01-01', name: 'Año Nuevo', type: 'inamovible' },
      { date: '2026-02-16', name: 'Carnaval', type: 'inamovible' },
      { date: '2026-02-17', name: 'Carnaval', type: 'inamovible' },
      { date: '2026-03-23', name: 'Feriado con fines turísticos', type: 'puente' },
      { date: '2026-03-24', name: 'Día Nacional de la Memoria por la Verdad y la Justicia', type: 'inamovible' },
      { date: '2026-04-02', name: 'Día del Veterano y de los Caídos en la Guerra de Malvinas', type: 'inamovible' },
      { date: '2026-04-03', name: 'Viernes Santo', type: 'inamovible' },
      { date: '2026-05-01', name: 'Día del Trabajador', type: 'inamovible' },
      { date: '2026-05-25', name: 'Día de la Revolución de Mayo', type: 'inamovible' },
      { date: '2026-06-15', name: 'Paso a la Inmortalidad del Gral. Martín Miguel de Güemes', type: 'trasladable' },
      { date: '2026-06-20', name: 'Paso a la Inmortalidad del Gral. Manuel Belgrano', type: 'inamovible' },
      { date: '2026-07-09', name: 'Día de la Independencia', type: 'inamovible' },
      { date: '2026-07-10', name: 'Feriado con fines turísticos', type: 'puente' },
      { date: '2026-08-17', name: 'Paso a la Inmortalidad del Gral. José de San Martín', type: 'trasladable' },
      { date: '2026-10-12', name: 'Día del Respeto a la Diversidad Cultural', type: 'trasladable' },
      { date: '2026-11-23', name: 'Día de la Soberanía Nacional', type: 'trasladable' },
      { date: '2026-12-07', name: 'Feriado con fines turísticos', type: 'puente' },
      { date: '2026-12-08', name: 'Inmaculada Concepción de María', type: 'inamovible' },
      { date: '2026-12-25', name: 'Navidad', type: 'inamovible' }
    ],
    2027: [
      { date: '2027-01-01', name: 'Año Nuevo', type: 'inamovible' },
      { date: '2027-02-08', name: 'Carnaval', type: 'inamovible' },
      { date: '2027-02-09', name: 'Carnaval', type: 'inamovible' },
      { date: '2027-03-24', name: 'Día Nacional de la Memoria por la Verdad y la Justicia', type: 'inamovible' },
      { date: '2027-03-26', name: 'Viernes Santo', type: 'inamovible' },
      { date: '2027-04-02', name: 'Día del Veterano y de los Caídos en la Guerra de Malvinas', type: 'inamovible' },
      { date: '2027-05-01', name: 'Día del Trabajador', type: 'inamovible' },
      { date: '2027-05-25', name: 'Día de la Revolución de Mayo', type: 'inamovible' },
      { date: '2027-06-17', name: 'Paso a la Inmortalidad del Gral. Martín Miguel de Güemes', type: 'trasladable' },
      { date: '2027-06-20', name: 'Paso a la Inmortalidad del Gral. Manuel Belgrano', type: 'inamovible' },
      { date: '2027-07-09', name: 'Día de la Independencia', type: 'inamovible' },
      { date: '2027-08-16', name: 'Paso a la Inmortalidad del Gral. José de San Martín', type: 'trasladable' },
      { date: '2027-10-11', name: 'Día del Respeto a la Diversidad Cultural', type: 'trasladable' },
      { date: '2027-11-22', name: 'Día de la Soberanía Nacional', type: 'trasladable' },
      { date: '2027-12-08', name: 'Inmaculada Concepción de María', type: 'inamovible' },
      { date: '2027-12-25', name: 'Navidad', type: 'inamovible' }
    ]
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
     3. Estado Global, Historial Undo/Redo y Persistencia
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
      freeSlotColor: DEFAULT_FREE_SLOT_COLOR,
      showHolidays: true,
      holidayCountry: 'AR',
      sidebarOpen: true
    },
    tasks: [],
    goalsByWeek: {},
    notesByWeek: {},
    holidaysCache: {}
  };

  let state = loadState();
  let currentMonday = initialMonday;
  let activeMobileDate = todayStr;
  let dupSourceTaskId = null;
  let notesSaveTimer = null;
  let notesBeforeEditSnapshot = null;
  let deferredInstallPrompt = null;
  let isSyncingHolidays = false;

  // Pilas de historial para Deshacer / Rehacer
  const undoStack = [];
  const redoStack = [];

  function cloneUserData(sourceState = state) {
    return JSON.parse(JSON.stringify({
      settings: sourceState.settings,
      tasks: sourceState.tasks,
      goalsByWeek: sourceState.goalsByWeek,
      notesByWeek: sourceState.notesByWeek
    }));
  }

  function pushUndoSnapshot(label) {
    undoStack.push({
      label,
      data: cloneUserData(state)
    });
    if (undoStack.length > MAX_HISTORY_STEPS) {
      undoStack.shift();
    }
    redoStack.length = 0;
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    if (!els.undoBtn || !els.redoBtn) return;

    if (undoStack.length > 0) {
      const top = undoStack[undoStack.length - 1];
      els.undoBtn.disabled = false;
      els.undoBtn.title = `Deshacer: ${top.label} (Ctrl+Z)`;
    } else {
      els.undoBtn.disabled = true;
      els.undoBtn.title = 'Deshacer (Ctrl+Z)';
    }

    if (redoStack.length > 0) {
      const top = redoStack[redoStack.length - 1];
      els.redoBtn.disabled = false;
      els.redoBtn.title = `Rehacer: ${top.label} (Ctrl+Y)`;
    } else {
      els.redoBtn.disabled = true;
      els.redoBtn.title = 'Rehacer (Ctrl+Y)';
    }
  }

  function performUndo() {
    if (!undoStack.length) return;
    const entry = undoStack.pop();
    redoStack.push({
      label: entry.label,
      data: cloneUserData(state)
    });

    restoreSnapshotData(entry.data);
    updateHistoryButtons();
    showToast(`Deshecho: ${entry.label}`);
  }

  function performRedo() {
    if (!redoStack.length) return;
    const entry = redoStack.pop();
    undoStack.push({
      label: entry.label,
      data: cloneUserData(state)
    });

    restoreSnapshotData(entry.data);
    updateHistoryButtons();
    showToast(`Rehecho: ${entry.label}`);
  }

  function restoreSnapshotData(snapshotData) {
    const preservedHolidays = state.holidaysCache || {};
    state = sanitizeImportedState({
      ...snapshotData,
      holidaysCache: preservedHolidays
    });
    saveState();
    applyTheme(state.settings.theme);
    applyFreeSlotColor(state.settings.freeSlotColor);
    initWorkdaySelectors();
    renderAll();
  }

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
      },
      holidaysCache: {
        AR_2026: {
          fetchedAt: null,
          source: 'Calendario Oficial AR (preinstalado)',
          items: FALLBACK_AR_HOLIDAYS[2026]
        },
        AR_2027: {
          fetchedAt: null,
          source: 'Calendario Oficial AR (preinstalado)',
          items: FALLBACK_AR_HOLIDAYS[2027]
        }
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
    const freeSlotColor = normalizeHex(raw?.settings?.freeSlotColor, DEFAULT_FREE_SLOT_COLOR);
    const holidayCountry = COUNTRY_LABELS[raw?.settings?.holidayCountry] ? raw.settings.holidayCountry : 'AR';

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
    const holidaysCache = (raw?.holidaysCache && typeof raw.holidaysCache === 'object') ? raw.holidaysCache : {};

    if (!holidaysCache.AR_2026) {
      holidaysCache.AR_2026 = {
        fetchedAt: null,
        source: 'Calendario Oficial AR (preinstalado)',
        items: FALLBACK_AR_HOLIDAYS[2026]
      };
    }

    return {
      settings: {
        theme: safeTheme,
        workStart,
        workEnd,
        showFreeSlots: raw?.settings?.showFreeSlots !== undefined ? Boolean(raw.settings.showFreeSlots) : true,
        freeSlotColor,
        showHolidays: raw?.settings?.showHolidays !== undefined ? Boolean(raw.settings.showHolidays) : true,
        holidayCountry,
        sidebarOpen: raw?.settings?.sidebarOpen !== undefined ? Boolean(raw.settings.sidebarOpen) : true
      },
      tasks,
      goalsByWeek,
      notesByWeek,
      holidaysCache
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
    freeSlotColorBtn: document.getElementById('freeSlotColorBtn'),
    freeSlotColorDot: document.getElementById('freeSlotColorDot'),
    freeSlotColorFlyout: document.getElementById('freeSlotColorFlyout'),
    freeSlotSwatches: document.getElementById('freeSlotSwatches'),
    freeSlotCustomColorInput: document.getElementById('freeSlotCustomColorInput'),
    freeSlotHexReadout: document.getElementById('freeSlotHexReadout'),
    resetFreeSlotColorBtn: document.getElementById('resetFreeSlotColorBtn'),

    toggleHolidays: document.getElementById('toggleHolidays'),
    holidayConfigBtn: document.getElementById('holidayConfigBtn'),
    holidayCountryBadge: document.getElementById('holidayCountryBadge'),
    holidayFlyout: document.getElementById('holidayFlyout'),
    holidayYearBadge: document.getElementById('holidayYearBadge'),
    holidayCountrySelect: document.getElementById('holidayCountrySelect'),
    holidaySyncStatus: document.getElementById('holidaySyncStatus'),
    syncHolidaysBtn: document.getElementById('syncHolidaysBtn'),

    undoBtn: document.getElementById('undoBtn'),
    redoBtn: document.getElementById('redoBtn'),
    newTaskBtn: document.getElementById('newTaskBtn'),

    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    importFileInput: document.getElementById('importFileInput'),
    sidebarToggleBtn: document.getElementById('sidebarToggleBtn'),

    metricBlocks: document.getElementById('metricBlocks'),
    metricCompleted: document.getElementById('metricCompleted'),
    metricPlanned: document.getElementById('metricPlanned'),
    metricFree: document.getElementById('metricFree'),
    metricHolidayDivider: document.getElementById('metricHolidayDivider'),
    metricHolidayChip: document.getElementById('metricHolidayChip'),
    metricHolidays: document.getElementById('metricHolidays'),

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
     5. Tema Claro / Oscuro y Color de Huecos Libres
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

  function applyFreeSlotColor(hex) {
    const normalized = normalizeHex(hex, DEFAULT_FREE_SLOT_COLOR);
    state.settings.freeSlotColor = normalized;
    document.documentElement.style.setProperty('--free-slot-accent', normalized);
    if (els.freeSlotColorDot) {
      els.freeSlotColorDot.style.backgroundColor = normalized;
    }
    if (els.freeSlotCustomColorInput) {
      els.freeSlotCustomColorInput.value = normalized;
    }
    if (els.freeSlotHexReadout) {
      els.freeSlotHexReadout.textContent = normalized;
    }
    if (els.freeSlotSwatches) {
      els.freeSlotSwatches.querySelectorAll('.swatch-btn').forEach(btn => {
        btn.classList.toggle('is-selected', btn.dataset.hex === normalized);
      });
    }
  }

  function initFreeSlotColorSwatches() {
    els.freeSlotSwatches.innerHTML = '';
    FLUENT_SWATCHES.forEach(swatch => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'swatch-btn';
      btn.style.setProperty('--swatch-color', swatch.hex);
      btn.dataset.hex = swatch.hex;
      btn.title = `${swatch.name} (${swatch.hex})`;
      btn.setAttribute('aria-label', `${swatch.name} ${swatch.hex}`);
      btn.addEventListener('click', () => {
        if (state.settings.freeSlotColor === swatch.hex) return;
        pushUndoSnapshot('Color de huecos libres');
        applyFreeSlotColor(swatch.hex);
        saveState();
      });
      els.freeSlotSwatches.appendChild(btn);
    });
  }

  /* ========================================================================
     6. Feriados y Fechas Festivas Nacionales (Datos Oficiales + Caché Offline)
     ======================================================================== */

  function getHolidaysMapForDates(weekDates) {
    const map = {};
    if (!state.settings.showHolidays) return map;

    const country = state.settings.holidayCountry || 'AR';
    for (const dateStr of weekDates) {
      const year = dateStr.slice(0, 4);
      const entry = state.holidaysCache[`${country}_${year}`];
      if (entry && Array.isArray(entry.items)) {
        const matches = entry.items.filter(h => h.date === dateStr);
        if (matches.length) {
          map[dateStr] = matches;
        }
      }
    }
    return map;
  }

  function updateHolidayFlyoutStatus() {
    const country = state.settings.holidayCountry || 'AR';
    const year = parseLocalDate(currentMonday).getFullYear();
    const cacheKey = `${country}_${year}`;
    const entry = state.holidaysCache[cacheKey];

    els.holidayCountryBadge.textContent = country;
    els.holidayCountrySelect.value = country;
    els.holidayYearBadge.textContent = String(year);
    els.toggleHolidays.checked = Boolean(state.settings.showHolidays);

    if (isSyncingHolidays) {
      els.holidaySyncStatus.textContent = `Consultando fuente oficial para ${COUNTRY_LABELS[country] || country} (${year})...`;
      return;
    }

    if (entry && Array.isArray(entry.items)) {
      const count = entry.items.length;
      if (entry.fetchedAt) {
        const dt = new Date(entry.fetchedAt);
        const dateFmt = `${formatLocalDate(dt)} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
        els.holidaySyncStatus.innerHTML = `<strong>${count} feriados</strong> cargados.<br>Fuente: ${escapeHtml(entry.source)} · ${dateFmt}`;
      } else {
        els.holidaySyncStatus.innerHTML = `<strong>${count} feriados</strong> disponibles.<br>Fuente: ${escapeHtml(entry.source)}`;
      }
    } else {
      els.holidaySyncStatus.textContent = navigator.onLine
        ? `Sin datos cacheados para ${COUNTRY_LABELS[country] || country} ${year}. Pulsá actualizar.`
        : `Sin conexión y sin datos previos para ${COUNTRY_LABELS[country] || country} ${year}.`;
    }
  }

  async function fetchOfficialHolidaysForYear(country, year, { force = false, silent = false } = {}) {
    const cacheKey = `${country}_${year}`;
    const existing = state.holidaysCache[cacheKey];

    // Si ya está sincronizado hace menos de 7 días y no se forzó actualización, usar caché local
    if (!force && existing && existing.fetchedAt) {
      const ageMs = Date.now() - new Date(existing.fetchedAt).getTime();
      if (ageMs < 7 * 24 * 3600 * 1000 && Array.isArray(existing.items) && existing.items.length > 0) {
        updateHolidayFlyoutStatus();
        return true;
      }
    }

    if (!navigator.onLine) {
      if (!silent) {
        showToast('Sin conexión a internet. Se mantienen los feriados guardados localmente.');
      }
      updateHolidayFlyoutStatus();
      return false;
    }

    isSyncingHolidays = true;
    els.syncHolidaysBtn.disabled = true;
    updateHolidayFlyoutStatus();

    try {
      let normalizedItems = [];
      let sourceLabel = 'Nager.Date Official API';

      if (country === 'AR') {
        try {
          const resAr = await fetch(`https://api.argentinadatos.com/v1/feriados/${year}`, { cache: 'no-store' });
          if (!resAr.ok) throw new Error(`HTTP ${resAr.status}`);
          const dataAr = await resAr.json();
          if (Array.isArray(dataAr) && dataAr.length > 0) {
            normalizedItems = dataAr.map(item => ({
              date: item.fecha,
              name: item.nombre,
              type: item.tipo || 'oficial'
            }));
            sourceLabel = 'ArgentinaDatos · Min. del Interior';
          }
        } catch (arErr) {
          console.warn('Fallback a Nager.Date para AR:', arErr);
        }
      }

      if (normalizedItems.length === 0) {
        const resNager = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`, { cache: 'no-store' });
        if (!resNager.ok) throw new Error(`HTTP ${resNager.status}`);
        const dataNager = await resNager.json();
        if (Array.isArray(dataNager)) {
          normalizedItems = dataNager.map(item => ({
            date: item.date,
            name: item.localName || item.name,
            type: Array.isArray(item.types) && item.types.length ? item.types[0] : 'oficial'
          }));
          sourceLabel = `Nager.Date Oficial (${country})`;
        }
      }

      if (normalizedItems.length > 0) {
        state.holidaysCache[cacheKey] = {
          fetchedAt: new Date().toISOString(),
          source: sourceLabel,
          items: normalizedItems
        };
        saveState();
        renderAll();
        if (!silent) {
          showToast(`Feriados oficiales ${year} (${country}) actualizados.`);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Error actualizando feriados oficiales:', err);
      if (!silent) {
        showToast('No se pudieron descargar los feriados oficiales ahora.');
      }
      return false;
    } finally {
      isSyncingHolidays = false;
      els.syncHolidaysBtn.disabled = false;
      updateHolidayFlyoutStatus();
    }
  }

  function ensureWeekHolidaysSynced(weekDates, { silent = true } = {}) {
    if (!state.settings.showHolidays) return;
    const country = state.settings.holidayCountry || 'AR';
    const years = Array.from(new Set(weekDates.map(d => Number(d.slice(0, 4)))));
    years.forEach(y => {
      fetchOfficialHolidaysForYear(country, y, { force: false, silent });
    });
  }

  /* ========================================================================
     7. Inicialización de Selectores de Jornada y Swatches de Actividad
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
    els.toggleHolidays.checked = state.settings.showHolidays;
    els.holidayCountryBadge.textContent = state.settings.holidayCountry || 'AR';
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
     8. Cálculo de Huecos Libres y Solapamientos
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
     9. Renderizado Principal (Grilla, Métricas, Tira Móvil, Sidebar)
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
    const holidaysMap = getHolidaysMapForDates(weekDates);

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

    const holidayDaysCount = Object.keys(holidaysMap).length;
    if (state.settings.showHolidays && holidayDaysCount > 0) {
      els.metricHolidayDivider.hidden = false;
      els.metricHolidayChip.hidden = false;
      els.metricHolidays.textContent = String(holidayDaysCount);
    } else {
      els.metricHolidayDivider.hidden = true;
      els.metricHolidayChip.hidden = true;
    }

    renderMobileDayStrip(weekDates, tasksByDate, holidaysMap);
    renderGrid(weekDates, tasksByDate, freeSlotsByDate, holidaysMap, displayStartHour, displayEndHour);
    renderSidebar(isoInfo.code);
    updateHolidayFlyoutStatus();
  }

  function renderMobileDayStrip(weekDates, tasksByDate, holidaysMap) {
    const today = getTodayStr();
    els.mobileDayStrip.innerHTML = '';

    weekDates.forEach((dateStr, idx) => {
      const d = parseLocalDate(dateStr);
      const dayHolidays = holidaysMap[dateStr] || [];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mobile-day-btn';
      if (dateStr === today) btn.classList.add('is-today');
      if (dayHolidays.length) btn.classList.add('is-holiday');
      if (dateStr === activeMobileDate) btn.classList.add('is-active');

      const count = tasksByDate[dateStr]?.length || 0;
      const holidayTitle = dayHolidays.length ? ` · Feriado: ${dayHolidays.map(h => h.name).join(' / ')}` : '';
      btn.innerHTML = `
        <span class="m-day-name">${WEEKDAY_NAMES_SHORT[idx]}</span>
        <span class="m-day-num">${d.getDate()}</span>
      `;
      btn.title = `${WEEKDAY_NAMES_SHORT[idx]} ${d.getDate()} (${count} bloques)${holidayTitle}`;
      btn.addEventListener('click', () => {
        activeMobileDate = dateStr;
        renderAll();
      });
      els.mobileDayStrip.appendChild(btn);
    });
  }

  function renderGrid(weekDates, tasksByDate, freeSlotsByDate, holidaysMap, displayStartHour, displayEndHour) {
    const today = getTodayStr();
    const totalHours = Math.max(1, displayEndHour - displayStartHour);
    const totalHeightPx = totalHours * PIXELS_PER_HOUR;

    // 1. Encabezados de días
    els.gridHeaders.innerHTML = '<div class="corner-cell mono">HORA</div>';
    weekDates.forEach((dateStr, idx) => {
      const d = parseLocalDate(dateStr);
      const isToday = dateStr === today;
      const dayHolidays = holidaysMap[dateStr] || [];
      const freeMins = (freeSlotsByDate[dateStr] || []).reduce((acc, s) => acc + s.duration, 0);

      const header = document.createElement('div');
      header.className = 'day-header';
      if (isToday) header.classList.add('is-today');
      if (dayHolidays.length) header.classList.add('is-holiday');
      if (dateStr === activeMobileDate) header.classList.add('is-mobile-active');

      const holidayHtml = dayHolidays.length
        ? `<div class="holiday-pill" title="${escapeHtml(dayHolidays.map(h => `${h.name} (${h.type})`).join(' · '))}">${escapeHtml(dayHolidays.map(h => h.name).join(' / '))}</div>`
        : '';

      header.innerHTML = `
        <div class="day-header-top">
          <span class="day-name">${WEEKDAY_NAMES_SHORT[idx]} ${d.getDate()}</span>
          ${isToday ? '<span class="today-badge">HOY</span>' : ''}
        </div>
        ${holidayHtml}
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
      const dayHolidays = holidaysMap[dateStr] || [];
      const col = document.createElement('div');
      col.className = 'day-column';
      col.style.height = `${totalHeightPx}px`;
      if (dateStr === today) col.classList.add('is-today');
      if (dayHolidays.length) col.classList.add('is-holiday');
      if (dateStr === activeMobileDate) col.classList.add('is-mobile-active');

      // Celdas por hora
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

      // Bloques de actividad
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
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ========================================================================
     10. Panel Lateral: Objetivos Semanales y Notas con Autoguardado
     ======================================================================== */

  function renderSidebar(isoCode) {
    els.sidebarWeekCode.textContent = isoCode;

    els.sidebar.classList.toggle('is-collapsed', !state.settings.sidebarOpen);
    els.sidebarToggleBtn.setAttribute('aria-expanded', String(state.settings.sidebarOpen));

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
          pushUndoSnapshot(goal.completed ? 'Reabrir objetivo' : 'Completar objetivo');
          goal.completed = !goal.completed;
          saveState();
          renderSidebar(isoCode);
        });

        li.querySelector('.goal-delete-btn').addEventListener('click', () => {
          pushUndoSnapshot('Eliminar objetivo');
          state.goalsByWeek[isoCode] = (state.goalsByWeek[isoCode] || []).filter(g => g.id !== goal.id);
          saveState();
          renderSidebar(isoCode);
        });

        els.goalsList.appendChild(li);
      });
    }

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
    const prevText = state.notesByWeek[isoCode] || '';
    const text = els.weeklyNotesInput.value;

    if (notesBeforeEditSnapshot && prevText !== text) {
      undoStack.push({
        label: 'Editar notas semanales',
        data: notesBeforeEditSnapshot
      });
      if (undoStack.length > MAX_HISTORY_STEPS) undoStack.shift();
      redoStack.length = 0;
      updateHistoryButtons();
      notesBeforeEditSnapshot = cloneUserData(state);
    }

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
     11. Modal CRUD de Bloques Horarios
     ======================================================================== */

  function openTaskModal({ task = null, date = null, start = null, end = null } = {}) {
    closeAllFlyouts();
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
    pushUndoSnapshot(target.completed ? `Marcar pendiente "${target.title}"` : `Completar "${target.title}"`);
    target.completed = !target.completed;
    saveState();
    renderAll();
  }

  /* ========================================================================
     12. Sistema Avanzado de Duplicación Inteligente (4 Modos)
     ======================================================================== */

  function openDupModal(taskId) {
    const source = state.tasks.find(t => t.id === taskId);
    if (!source) return;

    closeAllFlyouts();
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

    const defaultRadio = els.dupForm.querySelector('input[name="dupMode"][value="weekDays"]');
    if (defaultRadio) defaultRadio.checked = true;

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

    const sourceYear = parseLocalDate(source.date).getFullYear();
    els.restOfYearHint.textContent = `Se replicará cada ${WEEKDAY_NAMES_SHORT[sourceWeekdayIdx]} desde ${addDays(source.date, 7)} hasta el 31 de diciembre de ${sourceYear}.`;

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

    const uniqueDates = Array.from(new Set(rawDates)).sort();

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
     13. Flyouts Posicionados, Exportación/Importación JSON, Conectividad y Toast
     ======================================================================== */

  function toggleFlyout(flyoutEl, anchorEl) {
    const isHidden = flyoutEl.hidden;
    closeAllFlyouts();
    if (!isHidden) return;

    flyoutEl.hidden = false;
    anchorEl.setAttribute('aria-expanded', 'true');

    const rect = anchorEl.getBoundingClientRect();
    const flyoutWidth = flyoutEl.offsetWidth || 300;
    const left = Math.max(10, Math.min(window.innerWidth - flyoutWidth - 10, rect.left));
    const top = Math.min(window.innerHeight - flyoutEl.offsetHeight - 10, rect.bottom + 6);

    flyoutEl.style.left = `${left}px`;
    flyoutEl.style.top = `${top}px`;
  }

  function closeAllFlyouts() {
    els.freeSlotColorFlyout.hidden = true;
    els.freeSlotColorBtn.setAttribute('aria-expanded', 'false');
    els.holidayFlyout.hidden = true;
    els.holidayConfigBtn.setAttribute('aria-expanded', 'false');
  }

  function exportBackupJson() {
    flushWeeklyNotesSave();
    const payload = {
      app: 'Planificador Semanal Fluent',
      version: 2,
      exportedAt: new Date().toISOString(),
      settings: state.settings,
      tasks: state.tasks,
      goalsByWeek: state.goalsByWeek,
      notesByWeek: state.notesByWeek,
      holidaysCache: state.holidaysCache
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

        pushUndoSnapshot('Importar respaldo JSON');
        state = sanitized;
        saveState();
        applyTheme(state.settings.theme);
        applyFreeSlotColor(state.settings.freeSlotColor);
        initWorkdaySelectors();
        renderAll();
        ensureWeekHolidaysSynced(getWeekDates(currentMonday), { silent: true });
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
     14. Registro de Eventos
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
      ensureWeekHolidaysSynced(getWeekDates(currentMonday), { silent: true });
    });

    els.nextWeekBtn.addEventListener('click', () => {
      currentMonday = addDays(currentMonday, 7);
      activeMobileDate = currentMonday;
      renderAll();
      ensureWeekHolidaysSynced(getWeekDates(currentMonday), { silent: true });
    });

    els.todayBtn.addEventListener('click', () => {
      const today = getTodayStr();
      currentMonday = getMondayOfWeek(today);
      activeMobileDate = today;
      renderAll();
      ensureWeekHolidaysSynced(getWeekDates(currentMonday), { silent: true });
    });

    els.dateJumpInput.addEventListener('change', () => {
      const chosen = els.dateJumpInput.value;
      if (!chosen) return;
      currentMonday = getMondayOfWeek(chosen);
      activeMobileDate = chosen;
      renderAll();
      ensureWeekHolidaysSynced(getWeekDates(currentMonday), { silent: true });
    });

    // Jornada
    els.workStartSelect.addEventListener('change', () => {
      pushUndoSnapshot('Cambiar inicio de jornada');
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
      pushUndoSnapshot('Cambiar fin de jornada');
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

    // Huecos libres + Color
    els.toggleFreeSlots.addEventListener('change', () => {
      state.settings.showFreeSlots = els.toggleFreeSlots.checked;
      saveState();
      renderAll();
    });

    els.freeSlotColorBtn.addEventListener('click', e => {
      e.stopPropagation();
      toggleFlyout(els.freeSlotColorFlyout, els.freeSlotColorBtn);
    });

    els.freeSlotCustomColorInput.addEventListener('change', e => {
      pushUndoSnapshot('Color de huecos libres');
      applyFreeSlotColor(e.target.value);
      saveState();
    });

    els.freeSlotCustomColorInput.addEventListener('input', e => {
      applyFreeSlotColor(e.target.value);
    });

    els.resetFreeSlotColorBtn.addEventListener('click', () => {
      if (state.settings.freeSlotColor === DEFAULT_FREE_SLOT_COLOR) return;
      pushUndoSnapshot('Restaurar color de huecos libres');
      applyFreeSlotColor(DEFAULT_FREE_SLOT_COLOR);
      saveState();
    });

    // Feriados nacionales oficiales
    els.toggleHolidays.addEventListener('change', () => {
      state.settings.showHolidays = els.toggleHolidays.checked;
      saveState();
      renderAll();
      if (state.settings.showHolidays) {
        ensureWeekHolidaysSynced(getWeekDates(currentMonday), { silent: true });
      }
    });

    els.holidayConfigBtn.addEventListener('click', e => {
      e.stopPropagation();
      updateHolidayFlyoutStatus();
      toggleFlyout(els.holidayFlyout, els.holidayConfigBtn);
    });

    els.holidayCountrySelect.addEventListener('change', () => {
      const country = els.holidayCountrySelect.value;
      state.settings.holidayCountry = country;
      saveState();
      renderAll();
      const years = Array.from(new Set(getWeekDates(currentMonday).map(d => Number(d.slice(0, 4)))));
      years.forEach(y => fetchOfficialHolidaysForYear(country, y, { force: false, silent: false }));
    });

    els.syncHolidaysBtn.addEventListener('click', () => {
      const country = state.settings.holidayCountry || 'AR';
      const years = Array.from(new Set(getWeekDates(currentMonday).map(d => Number(d.slice(0, 4)))));
      years.forEach((y, idx) => fetchOfficialHolidaysForYear(country, y, { force: true, silent: idx > 0 }));
    });

    // Cerrar flyouts al hacer clic fuera
    document.addEventListener('click', e => {
      if (!els.freeSlotColorFlyout.hidden && !els.freeSlotColorFlyout.contains(e.target) && !els.freeSlotColorBtn.contains(e.target)) {
        closeAllFlyouts();
      }
      if (!els.holidayFlyout.hidden && !els.holidayFlyout.contains(e.target) && !els.holidayConfigBtn.contains(e.target)) {
        closeAllFlyouts();
      }
    });

    // Deshacer / Rehacer
    els.undoBtn.addEventListener('click', performUndo);
    els.redoBtn.addEventListener('click', performRedo);

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
      pushUndoSnapshot('Añadir objetivo semanal');
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
    els.weeklyNotesInput.addEventListener('focus', () => {
      notesBeforeEditSnapshot = cloneUserData(state);
    });

    els.weeklyNotesInput.addEventListener('input', () => {
      els.notesSaveStatus.classList.add('is-saving');
      els.notesSaveStatus.textContent = 'Guardando...';
      if (notesSaveTimer) clearTimeout(notesSaveTimer);
      notesSaveTimer = setTimeout(flushWeeklyNotesSave, 220);
    });

    els.weeklyNotesInput.addEventListener('blur', () => {
      flushWeeklyNotesSave();
      notesBeforeEditSnapshot = null;
    });

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
          pushUndoSnapshot(`Editar "${title}"`);
          state.tasks[idx] = { ...state.tasks[idx], title, date, category, color, start, end, completed };
        }
      } else {
        pushUndoSnapshot(`Crear "${title}"`);
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
      ensureWeekHolidaysSynced(getWeekDates(currentMonday), { silent: true });
    });

    els.deleteTaskBtn.addEventListener('click', () => {
      const id = els.taskIdInput.value;
      if (!id) return;
      const target = state.tasks.find(t => t.id === id);
      pushUndoSnapshot(target ? `Eliminar "${target.title}"` : 'Eliminar bloque');
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

      pushUndoSnapshot(`Duplicar "${source.title}" (${targetDates.length})`);

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

    // Atajos de teclado (Escape, Ctrl+Z, Ctrl+Y / Ctrl+Shift+Z)
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (!els.dupModal.hidden) closeDupModal();
        else if (!els.taskModal.hidden) closeTaskModal();
        else if (!els.freeSlotColorFlyout.hidden || !els.holidayFlyout.hidden) closeAllFlyouts();
        else closeMobileSidebar();
        return;
      }

      const activeTag = document.activeElement?.tagName;
      const isEditingText = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';
      if (isEditingText) return;

      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 'z' && !e.shiftKey) {
          e.preventDefault();
          performUndo();
        } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
          e.preventDefault();
          performRedo();
        }
      }
    });

    // Conectividad y PWA Install Prompt
    window.addEventListener('online', () => {
      updateConnectivityBadge();
      ensureWeekHolidaysSynced(getWeekDates(currentMonday), { silent: true });
    });
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
     15. Registro del Service Worker y Arranque
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
    initFreeSlotColorSwatches();
    applyFreeSlotColor(state.settings.freeSlotColor);
    initWorkdaySelectors();
    initColorSwatches();
    updateConnectivityBadge();
    updateHistoryButtons();
    bindEvents();
    renderAll();
    ensureWeekHolidaysSynced(getWeekDates(currentMonday), { silent: true });
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