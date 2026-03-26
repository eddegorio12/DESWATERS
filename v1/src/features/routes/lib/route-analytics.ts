export function roundMetric(value: number) {
  return Math.round(value * 100) / 100;
}

export function percentage(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return 0;
  }

  return roundMetric((numerator / denominator) * 100);
}

export function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return roundMetric(values.reduce((sum, value) => sum + value, 0) / values.length);
}
