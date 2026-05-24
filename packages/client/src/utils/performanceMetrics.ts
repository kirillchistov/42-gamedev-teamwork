// 7.5 chores: Performance API — mark/measure, longtask observer с cleanup;
// агрегированный отчёт вместо warn на каждую задачу; пауза при overlay/вкладке.

const PERF_PREFIX = '[Performance]'

const marks = {
  gameStart: 'match3:session:start',
  gameEnd: 'match3:session:end',
} as const

/** Событие из Match3Screen: игра на паузе — не считаем long tasks. */
export const MATCH3_PERF_PAUSE_EVENT =
  'match3:performance-pause'

export type Match3PerfPauseDetail = {
  paused: boolean
}

export type PerformanceSessionSummary = {
  longTasksCount: number
  maxLongTaskMs: number
  heapMb: number | null
}

export type PerformanceMonitoringHandle = {
  stop: () => void
  setPaused: (paused: boolean) => void
  getSummary: () => PerformanceSessionSummary
  flushSummary: () => void
}

const LONG_TASK_THRESHOLD_MS = 50
/** После снятия паузы / возврата на вкладку — не шумим N мс (React, canvas, DevTools). */
const RESUME_GRACE_MS = 2500
const HEAP_LOG_INTERVAL_MS = 30_000

let longTasksCount = 0
let maxLongTaskDuration = 0

function isPerfVerbose(): boolean {
  return (
    typeof import.meta !== 'undefined' &&
    import.meta.env?.DEV === true &&
    import.meta.env?.VITE_PERF_VERBOSE === '1'
  )
}

function logDev(message: string): void {
  if (
    typeof import.meta !== 'undefined' &&
    import.meta.env?.DEV
  ) {
    console.log(`${PERF_PREFIX} ${message}`)
  }
}

function formatSummary(
  count: number,
  maxMs: number,
  heapMb: number | null
): string {
  const safeCount = Number.isFinite(count)
    ? count
    : 0
  const safeMax = Number.isFinite(maxMs)
    ? maxMs
    : 0
  const heapPart =
    heapMb !== null && Number.isFinite(heapMb)
      ? `, heap ${heapMb.toFixed(2)} MB`
      : ''
  return `long tasks: ${safeCount} (max ${safeMax.toFixed(
    2
  )} ms${heapPart})`
}

/**
 * Отметить начало игровой сессии
 */
export function markGameStart(): void {
  if (
    typeof performance === 'undefined' ||
    typeof performance.mark !== 'function'
  ) {
    return
  }
  performance.mark(marks.gameStart)
  logDev('Game session started')
}

/**
 * Отметить конец игровой сессии и измерить длительность
 * @returns длительность сессии в мс или null
 */
export function markGameEndAndMeasure():
  | number
  | null {
  if (
    typeof performance === 'undefined' ||
    typeof performance.mark !== 'function' ||
    typeof performance.measure !== 'function' ||
    typeof performance.getEntriesByName !==
      'function'
  ) {
    return null
  }
  try {
    performance.mark(marks.gameEnd)
    performance.measure(
      'match3-session',
      marks.gameStart,
      marks.gameEnd
    )
    const list = performance.getEntriesByName(
      'match3-session'
    )
    const last = list[list.length - 1]

    performance.clearMarks(marks.gameStart)
    performance.clearMarks(marks.gameEnd)
    performance.clearMeasures('match3-session')

    const duration = last?.duration ?? null
    if (duration !== null) {
      logDev(
        `Game session duration: ${duration.toFixed(
          2
        )}ms`
      )
    }

    return duration
  } catch (e) {
    console.warn(
      `${PERF_PREFIX} markGameEndAndMeasure failed`,
      e
    )
    try {
      performance.clearMarks(marks.gameStart)
      performance.clearMarks(marks.gameEnd)
      performance.clearMeasures('match3-session')
    } catch {
      /* noop */
    }
    return null
  }
}

/**
 * Наблюдать за Long Tasks (>50ms)
 * @returns функция для отписки
 */
export function observeLongTasks(
  onLongTask: (duration: number) => void,
  options?: {
    /** Игнорировать задачи до этого timestamp (мс). */
    ignoreUntilMs?: () => number
    isPaused?: () => boolean
  }
): () => void {
  if (
    typeof PerformanceObserver === 'undefined'
  ) {
    console.warn(
      `${PERF_PREFIX} PerformanceObserver not supported`
    )
    return () => {
      /* noop */
    }
  }

  longTasksCount = 0
  maxLongTaskDuration = 0

  const obs = new PerformanceObserver(list => {
    if (options?.isPaused?.()) {
      return
    }
    const ignoreUntil =
      options?.ignoreUntilMs?.() ?? 0
    const now = performance.now()

    for (const entry of list.getEntries()) {
      if (
        entry.duration <= LONG_TASK_THRESHOLD_MS
      ) {
        continue
      }
      if (now < ignoreUntil) {
        continue
      }
      onLongTask(entry.duration)
      longTasksCount++
      maxLongTaskDuration = Math.max(
        maxLongTaskDuration,
        entry.duration
      )
    }
  })

  try {
    obs.observe({
      type: 'longtask',
      // buffered: true отдаёт все long tasks с загрузки страницы — ложный «шторм» в консоли.
      buffered: false,
    })
  } catch (e) {
    console.warn(
      `${PERF_PREFIX} longtask observe failed or unsupported`,
      e
    )
    return () => {
      /* noop */
    }
  }

  logDev('Long tasks observer started')

  return () => {
    obs.disconnect()
    logDev(
      `Long tasks observer stopped. ${formatSummary(
        longTasksCount,
        maxLongTaskDuration,
        null
      )}`
    )
  }
}

/**
 * Получить текущий heap size (только в Chrome)
 */
export function getHeapSize(): number | null {
  if (typeof performance === 'undefined') {
    return null
  }
  const memory = (
    performance as unknown as {
      memory?: { usedJSHeapSize: number }
    }
  ).memory
  if (memory) {
    return memory.usedJSHeapSize
  }
  return null
}

export function getHeapSizeMb(): number | null {
  const heap = getHeapSize()
  return heap !== null ? heap / 1024 / 1024 : null
}

/**
 * Логировать heap size в консоль (для отладки)
 */
export function logHeapSize(): void {
  const mb = getHeapSizeMb()
  if (mb !== null) {
    logDev(
      `Used JS heap size: ${mb.toFixed(2)} MB`
    )
  } else if (isPerfVerbose()) {
    logDev(
      'Heap size not available (non-Chrome browser)'
    )
  }
}

/**
 * Запустить мониторинг heap (выводит в консоль каждые 30 секунд)
 */
export function startHeapMonitoring(
  intervalMs = HEAP_LOG_INTERVAL_MS,
  isPaused?: () => boolean
): () => void {
  const intervalId = window.setInterval(() => {
    if (isPaused?.()) {
      return
    }
    logHeapSize()
  }, intervalMs)

  return () => {
    window.clearInterval(intervalId)
    logDev('Heap monitoring stopped')
  }
}

function buildSummary(): PerformanceSessionSummary {
  return {
    longTasksCount,
    maxLongTaskMs: maxLongTaskDuration,
    heapMb: getHeapSizeMb(),
  }
}

/**
 * Полный мониторинг игровой сессии: long tasks (агрегация) + heap.
 * В консоли — сводка при stop/flush, не warn на каждую задачу.
 * Стек installHook.js в DevTools — инструментирование React DevTools, не баг приложения.
 */
export function startPerformanceMonitoring(): PerformanceMonitoringHandle {
  let paused = false
  let ignoreUntilMs = 0

  const bumpResumeGrace = () => {
    ignoreUntilMs =
      performance.now() + RESUME_GRACE_MS
  }

  const isPaused = () => paused

  const onLongTask = (duration: number) => {
    if (isPerfVerbose()) {
      console.debug(
        `${PERF_PREFIX} Long task ${duration.toFixed(
          2
        )} ms`
      )
    }
  }

  const heapStop = startHeapMonitoring(
    HEAP_LOG_INTERVAL_MS,
    isPaused
  )
  const longTasksStop = observeLongTasks(
    onLongTask,
    {
      isPaused,
      ignoreUntilMs: () => ignoreUntilMs,
    }
  )

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      paused = true
      return
    }
    paused = false
    bumpResumeGrace()
  }

  const onMatch3Pause = (event: Event) => {
    const detail = (
      event as CustomEvent<Match3PerfPauseDetail>
    ).detail
    if (detail?.paused) {
      paused = true
      return
    }
    paused = false
    bumpResumeGrace()
  }

  document.addEventListener(
    'visibilitychange',
    onVisibility
  )
  window.addEventListener(
    MATCH3_PERF_PAUSE_EVENT,
    onMatch3Pause
  )

  return {
    setPaused(next: boolean) {
      if (next) {
        paused = true
        return
      }
      paused = false
      bumpResumeGrace()
    },
    getSummary: buildSummary,
    flushSummary() {
      const s = buildSummary()
      if (
        s.longTasksCount === 0 &&
        s.heapMb === null
      ) {
        return
      }
      console.info(
        `${PERF_PREFIX} Session summary — ${formatSummary(
          s.longTasksCount,
          s.maxLongTaskMs,
          s.heapMb
        )}`
      )
    },
    stop() {
      document.removeEventListener(
        'visibilitychange',
        onVisibility
      )
      window.removeEventListener(
        MATCH3_PERF_PAUSE_EVENT,
        onMatch3Pause
      )
      heapStop()
      longTasksStop()
    },
  }
}
