/**
 * Password Strength Indicator Component
 */

interface PasswordStrengthProps {
  score: number;
  feedback: string[];
}

export default function PasswordStrength({ score, feedback }: PasswordStrengthProps) {
  const getStrengthColor = () => {
    if (score >= 5) return 'bg-green-500';
    if (score >= 4) return 'bg-yellow-500';
    if (score >= 3) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStrengthText = () => {
    if (score >= 5) return 'Strong';
    if (score >= 4) return 'Good';
    if (score >= 3) return 'Fair';
    return 'Weak';
  };

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < score ? getStrengthColor() : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-600">
          Strength: <span className="font-medium">{getStrengthText()}</span>
        </span>
      </div>
      {feedback.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-gray-600">
          {feedback.map((item, i) => (
            <li key={i} className="flex items-center gap-1">
              <span className="text-red-500">•</span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
