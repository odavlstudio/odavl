// ODAVL-WAVE-X7-INJECT: Smart Tooltip - CSS-based Hover with Animations
// @odavl-governance: UX-POLISH-SAFE mode active

interface SmartTooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function SmartTooltip({
  children,
  content,
  position = 'top'
}: SmartTooltipProps) {
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2', 
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <span className="relative inline-block group">
      {children}
      <span 
        className={`absolute invisible opacity-0 z-50 px-2 py-1 text-xs bg-gray-900 text-white rounded shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100 pointer-events-none ${positions[position]}`}
        role="tooltip"
      >
        {content}
      </span>
    </span>
  );
}