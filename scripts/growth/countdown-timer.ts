// Countdown timer for launch date (March 15, 2025)
export function getTimeRemaining() {
  const launchDate = new Date('2025-03-15T09:00:00-07:00');
  const now = new Date();
  const diff = launchDate.getTime() - now.getTime();
  
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000)
  };
}
