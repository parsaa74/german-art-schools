'use client';

import dynamic from 'next/dynamic';

// Dynamic import for the Scene component
const Scene = dynamic(() => import('./map/Scene').then(mod => mod.Scene), { ssr: false });

interface MapProps {
  dict?: any;
  lang?: string;
}

export default function Map({ dict, lang }: MapProps) {
  return (
    <div className="w-full h-full">
      <Scene dict={dict} lang={lang} />
    </div>
  );
}
