// Retention cohort analysis
export function calculateRetention(cohort: Date, users: any[]) {
  const day0 = users.filter(u => u.signupDate === cohort).length;
  const day7 = users.filter(u => u.signupDate === cohort && u.lastActive >= addDays(cohort, 7)).length;
  const day30 = users.filter(u => u.signupDate === cohort && u.lastActive >= addDays(cohort, 30)).length;
  
  return {
    day0,
    day7: (day7 / day0) * 100,
    day30: (day30 / day0) * 100
  };
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
