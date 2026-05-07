const marks = {
  gameStart: 'match3:session:start',
  gameEnd: 'match3:session:end',
} as const

// Хранилище для метрик (опционально)
let longTasksCount = 0
let maxLongTaskDuration = 0

/**
 * Отметить начало игровой сессии
 */
export function markGameStart(): void {
  performance.mark(marks.gameStart)
  console.log(
    '[Performance] Game session started'
  )
}

/**
 * Отметить конец игровой сессии и измерить длительность
 * @returns длительность сессии в мс или null
 */
export function markGameEndAndMeasure():
  | number
  | null {
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

  // Очищаем метки, чтобы не накапливались
  performance.clearMarks(marks.gameStart)
  performance.clearMarks(marks.gameEnd)
  performance.clearMeasures('match3-session')

  const duration = last?.duration ?? null
  if (duration !== null) {
    console.log(
      `[Performance] Game session duration: ${duration.toFixed(
        2
      )}ms`
    )
  }

  return duration
}

/**
 * Наблюдать за Long Tasks (>50ms)
 * @param onLongTask колбэк, вызываемый при обнаружении долгой задачи
 * @returns функция для отписки
 */
export function observeLongTasks(
  onLongTask: (duration: number) => void
): () => void {
  if (
    typeof PerformanceObserver === 'undefined'
  ) {
    console.warn(
      '[Performance] PerformanceObserver not supported'
    )
    // Исправлено: добавлена заглушка вместо пустой стрелочной функции
    return () => {
      // noop
    }
  }

  const obs = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 50) {
        onLongTask(entry.duration)
        longTasksCount++
        maxLongTaskDuration = Math.max(
          maxLongTaskDuration,
          entry.duration
        )
      }
    }
  })

  obs.observe({
    type: 'longtask',
    buffered: true,
  })
  console.log(
    '[Performance] Long tasks observer started'
  )

  return () => {
    obs.disconnect()
    console.log(
      `[Performance] Long tasks observer stopped. Total: ${longTasksCount}, Max: ${maxLongTaskDuration.toFixed(
        2
      )}ms`
    )
  }
}

/**
 * Получить текущий heap size (только в Chrome)
 * @returns used JS heap size в байтах или null
 */
export function getHeapSize(): number | null {
  // Исправлено: убраны any, добавлено правильное приведение типа
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

/**
 * Логировать heap size в консоль (для отладки)
 */
export function logHeapSize(): void {
  const heap = getHeapSize()
  if (heap !== null) {
    console.log(
      `[Performance] Used JS heap size: ${(
        heap /
        1024 /
        1024
      ).toFixed(2)} MB`
    )
  } else {
    console.log(
      '[Performance] Heap size not available (non-Chrome browser)'
    )
  }
}

/**
 * Запустить мониторинг heap (выводит в консоль каждые 30 секунд)
 * @returns функция для остановки
 */
export function startHeapMonitoring(
  intervalMs = 30000
): () => void {
  const intervalId = setInterval(() => {
    logHeapSize()
  }, intervalMs)

  return () => {
    clearInterval(intervalId)
    console.log(
      '[Performance] Heap monitoring stopped'
    )
  }
}

/**
 * Запустить полный мониторинг производительности для игровой сессии
 * @returns объект с функциями для остановки
 */
export function startPerformanceMonitoring() {
  const heapStop = startHeapMonitoring(30000)
  const longTasksStop = observeLongTasks(
    duration => {
      console.warn(
        `[Performance] ⚠️ Long task detected: ${duration.toFixed(
          2
        )}ms`
      )
    }
  )

  return {
    stop: () => {
      heapStop()
      longTasksStop()
    },
  }
}
