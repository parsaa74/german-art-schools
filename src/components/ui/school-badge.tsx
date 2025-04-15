import React from 'react';
import { Badge } from './badge';
import { useParams } from 'next/navigation';

export type SchoolType = 'university' | 'academy' | 'college';

interface SchoolBadgeProps {
  type: SchoolType;
  className?: string;
  lang?: string;
}

const typeLabels: Record<SchoolType, Record<string, string>> = {
  university: {
    en: 'University',
    de: 'Universität'
  },
  academy: {
    en: 'Academy',
    de: 'Akademie'
  },
  college: {
    en: 'College',
    de: 'Hochschule'
  }
};

export const SchoolBadge = React.forwardRef<HTMLDivElement, SchoolBadgeProps>(
  ({ type, className, lang }, ref) => {
    // Get language from URL if not provided as prop
    const params = useParams();
    const currentLang = lang || (params?.lang as string) || 'en';
    return (
      <Badge ref={ref} variant={type} className={className}>
        {typeLabels[type][currentLang as 'en' | 'de'] || typeLabels[type]['en']}
      </Badge>
    );
  }
);

SchoolBadge.displayName = 'SchoolBadge';