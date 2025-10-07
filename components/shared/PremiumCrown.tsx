import { Crown } from 'lucide-react';
import React from 'react';

/**
 * PremiumCrown
 * Unified crown icon highlighting logic.
 */
export interface PremiumCrownProps {
  active: boolean;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  activeColor?: string;
  inactiveColor?: string;
  glow?: boolean;
  title?: string;
  ariaLabel?: string;
}

export const PremiumCrown: React.FC<PremiumCrownProps> = ({
  active,
  size = 14,
  className,
  style,
  activeColor = '#f59e0b', // amber-500
  inactiveColor = '#94a3b8', // slate-400
  glow = true,
  title,
  ariaLabel,
}) => {
  return (
    <span
      role="img"
      aria-label={ariaLabel || (active ? 'Premium active' : 'Premium required')}
      title={title || (active ? 'Premium features unlocked' : 'Subscription required')}
      style={{ lineHeight: 0, display: 'inline-flex' }}
      className={className}
    >
      <Crown
        size={size}
        style={{
          color: active ? activeColor : inactiveColor,
          filter: active && glow ? 'drop-shadow(0 0 2px rgba(245,158,11,0.6))' : undefined,
          transition: 'color 0.2s',
          ...style,
        }}
      />
    </span>
  );
};

export default PremiumCrown;
