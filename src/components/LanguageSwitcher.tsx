'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function LanguageSwitcher({
  lang,
  label
}: {
  lang: string;
  label: string;
}) {
  const pathName = usePathname();
  const [mounted, setMounted] = useState(false);

  // Only show component after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const redirectedPathName = (locale: string) => {
    if (!pathName) return '/';
    const segments = pathName.split('/');
    segments[1] = locale;
    return segments.join('/');
  };

  const newLocale = lang === 'en' ? 'de' : 'en';

  const containerClass = "fixed top-4 right-4 z-50";
  const buttonStyle = {
    backdropFilter: 'blur(8px)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)'
  };

  // Return the same structure for both server and client
  // Just don't render the actual button content until mounted
  return (
    <div className={containerClass}>
      {mounted ? (
        <Button
          variant="outline"
          size="sm"
          asChild
          className="relative overflow-hidden group"
          style={buttonStyle}
        >
          <Link href={redirectedPathName(newLocale)} className="px-3 py-1 flex items-center gap-2">
            <span className="relative z-10">{label}</span>
            <span className="relative z-10 text-xs opacity-60">{newLocale.toUpperCase()}</span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-blue-600/20"
              initial={{ x: '-100%' }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
          </Link>
        </Button>
      ) : (
        // Empty container during SSR and initial hydration
        // Same structure but no content
        <div aria-hidden="true" />
      )}
    </div>
  );
}