// K-factor (viral coefficient) calculator
export function calculateKFactor(invites: number, conversions: number): number {
  return invites * (conversions / invites);
}

export function predictGrowth(currentUsers: number, kFactor: number, weeks: number): number[] {
  const growth = [currentUsers];
  for (let i = 0; i < weeks; i++) {
    growth.push(growth[i] * (1 + kFactor));
  }
  return growth;
}
