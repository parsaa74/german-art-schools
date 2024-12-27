import React from 'react';
import { Badge } from './badge';

export type SchoolType = 'art' | 'music' | 'film' | 'design' | 'theater' | 'dance' | 'media';

interface SchoolBadgeProps {
  type: SchoolType;
  className?: string;
}

const typeLabels: Record<SchoolType, string> = {
  art: 'Art',
  music: 'Music',
  film: 'Film',
  design: 'Design',
  theater: 'Theater',
  dance: 'Dance',
  media: 'Media'
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