import React from 'react';
import { Badge } from './badge';

export type SchoolType = 'university' | 'academy' | 'college';

interface SchoolBadgeProps {
  type: SchoolType;
  className?: string;
}

const typeLabels: Record<SchoolType, string> = {
  university: 'University',
  academy: 'Academy',
  college: 'College'
};

export const SchoolBadge = React.forwardRef<HTMLDivElement, SchoolBadgeProps>(
  ({ type, className }, ref) => {
    return (
      <Badge ref={ref} variant={type} className={className}>
        {typeLabels[type]}
      </Badge>
    );
  }
);

SchoolBadge.displayName = 'SchoolBadge'; 