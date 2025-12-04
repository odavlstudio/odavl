// Plan Badge Component
// Displays organization plan with color coding

interface PlanBadgeProps {
  plan: string;
}

export function PlanBadge({ plan }: PlanBadgeProps) {
  const badgeStyles =
    plan === 'FREE'
      ? 'bg-gray-100 text-gray-800'
      : plan === 'PRO'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-purple-100 text-purple-800';

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeStyles}`}>
      {plan}
    </span>
  );
}
