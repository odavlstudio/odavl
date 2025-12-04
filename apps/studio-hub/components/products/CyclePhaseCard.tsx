/**
 * ODAVL Cycle Phase Card Component
 * Reusable card component for O-D-A-V-L cycle phases
 */

interface CyclePhaseCardProps {
  phase: string;
  letter: string;
  title: string;
  description: string;
  feature1: string;
  feature2: string;
  bgGradient: string;
  borderColor: string;
  hoverBorderColor: string;
  letterBg: string;
  iconColor: string;
  showArrow?: boolean;
}

export function CyclePhaseCard({
  phase,
  letter,
  title,
  description,
  feature1,
  feature2,
  bgGradient,
  borderColor,
  hoverBorderColor,
  letterBg,
  iconColor,
  showArrow = true,
}: CyclePhaseCardProps) {
  return (
    <div className="relative">
      <div
        className={`${bgGradient} rounded-xl p-6 border-2 ${borderColor} ${hoverBorderColor} transition-all hover:shadow-lg h-full`}
      >
        <div className={`w-16 h-16 ${letterBg} rounded-full flex items-center justify-center mb-4 mx-auto`}>
          <span className="text-white font-bold text-2xl">{letter}</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">{title}</h3>
        <p className="text-sm text-gray-600 text-center">{description}</p>
        <ul className="mt-4 space-y-2">
          <li className="flex items-center gap-2 text-xs text-gray-700">
            <svg className={`w-4 h-4 ${iconColor} flex-shrink-0`} fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{feature1}</span>
          </li>
          <li className="flex items-center gap-2 text-xs text-gray-700">
            <svg className={`w-4 h-4 ${iconColor} flex-shrink-0`} fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{feature2}</span>
          </li>
        </ul>
      </div>
      {showArrow && (
        <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
          <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
