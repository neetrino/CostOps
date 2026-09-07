/** Minimum USD increase before another alert = `thresholdUsd * (percent / 100)`. */
export function escalationStepUsd(thresholdUsd: number, percentOfThreshold: number): number {
  return thresholdUsd * (percentOfThreshold / 100);
}
