import { maybeUpdateHighScore } from '../systems/highscore'
import {
  updateDailyRecord,
  updatePlayerRecord,
} from '../systems/records'

export function syncRecordsFromScore(
  score: number
): {
  playerRecord: number
  dailyRecord: number
} {
  const playerRecord = updatePlayerRecord(score)
  const dailyRecord = updateDailyRecord(score)
  maybeUpdateHighScore(score)
  return { playerRecord, dailyRecord }
}
