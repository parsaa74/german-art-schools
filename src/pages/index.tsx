import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

const GermanyGlobe = dynamic(
  () => import('@/components/Map/GermanyGlobe').then(mod => mod.GermanyGlobe),
  { ssr: false }
);

export default function Home() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111111' }}>
      <GermanyGlobe />
    </div>
  );
} 