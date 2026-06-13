import {
  applyQuestDelta,
  buildQuestTitle,
  createInitialQuestProgress,
  sanitizeLevelQuests,
  type QuestProgress,
  type ResolveQuestDelta,
} from './quests'

const emptyDelta = (): ResolveQuestDelta => ({
  clearedByColor: {},
  clearedSpecialByColor: {},
  clearedSpecialByKind: {},
  clearedSpecialCombined: {},
  clearedBlockers: 0,
})

describe('quests', () => {
  test('sanitizeLevelQuests clamps targets and limits count', () => {
    const quests = sanitizeLevelQuests([
      {
        id: 'q1',
        title: 'Test',
        type: 'clearColor',
        targetCount: 5000,
        color: 'red',
        reward: { flatScore: 100, scoreMultiplier: 3 },
      },
      {
        id: 'q2',
        title: 'Block',
        type: 'clearBlockers',
        targetCount: 0,
      },
      {
        id: 'q3',
        title: 'A',
        type: 'clearColor',
        targetCount: 1,
      },
      {
        id: 'q4',
        title: 'B',
        type: 'clearColor',
        targetCount: 1,
      },
      {
        id: 'q5',
        title: 'C',
        type: 'clearColor',
        targetCount: 1,
      },
    ])

    expect(quests).toHaveLength(4)
    expect(quests[0]?.targetCount).toBe(999)
    expect(quests[0]?.reward?.scoreMultiplier).toBe(2)
    expect(quests[1]?.targetCount).toBe(1)
  })

  test('buildQuestTitle generates readable labels', () => {
    expect(
      buildQuestTitle({
        type: 'clearColor',
        color: 'green',
        targetCount: 15,
      })
    ).toBe('Очистить 15 зелёных')
    expect(
      buildQuestTitle({
        type: 'clearSpecialColor',
        specialKind: 'bomb',
        targetCount: 2,
      })
    ).toBe('Активировать 2 бомб')
  })

  test('applyQuestDelta tracks clearColor and flat reward', () => {
    const progress = createInitialQuestProgress([
      {
        id: 'c1',
        title: 'Red',
        type: 'clearColor',
        color: 'red',
        targetCount: 3,
        reward: { flatScore: 50 },
      },
    ])

    applyQuestDelta(
      progress,
      {
        ...emptyDelta(),
        clearedByColor: { red: 2, blue: 5 },
      },
      1
    )
    expect(progress.quests[0]?.progress).toBe(2)
    expect(progress.pendingFlatScoreReward).toBe(0)

    applyQuestDelta(
      progress,
      {
        ...emptyDelta(),
        clearedByColor: { red: 1 },
      },
      2
    )
    expect(progress.quests[0]?.completed).toBe(true)
    expect(progress.pendingFlatScoreReward).toBe(50)
  })

  test('applyQuestDelta tracks blockers and special activations', () => {
    const progress = createInitialQuestProgress([
      {
        id: 'b1',
        title: 'Blockers',
        type: 'clearBlockers',
        targetCount: 2,
        reward: { flatScore: 10 },
      },
      {
        id: 's1',
        title: 'Bombs',
        type: 'clearSpecialColor',
        specialKind: 'bomb',
        targetCount: 1,
        reward: { scoreMultiplier: 1.2 },
      },
    ])

    applyQuestDelta(
      progress,
      {
        ...emptyDelta(),
        clearedBlockers: 2,
        clearedSpecialByKind: { bomb: 1 },
      },
      3
    )

    expect(progress.quests[0]?.completed).toBe(true)
    expect(progress.quests[1]?.completed).toBe(true)
    expect(progress.completedCount).toBe(2)
    expect(progress.activeScoreMultiplier).toBeCloseTo(1.2)
  })

  test('composite quest completes when all parts are done', () => {
    const progress = createInitialQuestProgress([
      {
        id: 'combo',
        title: 'Combo',
        type: 'composite',
        parts: [
          {
            id: 'p1',
            title: 'Red',
            type: 'clearColor',
            color: 'red',
            targetCount: 2,
          },
          {
            id: 'p2',
            title: 'Block',
            type: 'clearBlockers',
            targetCount: 1,
          },
        ],
        reward: { flatScore: 200 },
      },
    ])

    applyQuestDelta(
      progress,
      {
        ...emptyDelta(),
        clearedByColor: { red: 2 },
      },
      1
    )
    expect(progress.quests[0]?.completed).toBe(false)
    expect(progress.quests[0]?.progress).toBe(1)

    applyQuestDelta(
      progress,
      {
        ...emptyDelta(),
        clearedBlockers: 1,
      },
      2
    )

    const combo = progress.quests[0]
    expect(combo?.completed).toBe(true)
    expect(combo?.progress).toBe(2)
    expect(combo?.target).toBe(2)
    expect(progress.pendingFlatScoreReward).toBe(200)
  })

  test('clearSpecialColor respects color+kind combined key', () => {
    const progress: QuestProgress = createInitialQuestProgress([
      {
        id: 'mix',
        title: 'Mix',
        type: 'clearSpecialColor',
        color: 'red',
        specialKind: 'bomb',
        targetCount: 1,
      },
    ])

    applyQuestDelta(
      progress,
      {
        ...emptyDelta(),
        clearedSpecialByKind: { bomb: 2 },
        clearedSpecialCombined: { 'blue:bomb': 2 },
      },
      1
    )
    expect(progress.quests[0]?.completed).toBe(false)

    applyQuestDelta(
      progress,
      {
        ...emptyDelta(),
        clearedSpecialCombined: { 'red:bomb': 1 },
      },
      2
    )
    expect(progress.quests[0]?.completed).toBe(true)
  })
})
