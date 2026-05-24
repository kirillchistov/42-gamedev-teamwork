/** Node 18+ / DOM: для ts-jest при старых lib без AbortSignal.timeout */
interface AbortSignal {
  static timeout(
    milliseconds: number
  ): AbortSignal
}
