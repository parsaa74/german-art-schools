'use client'; // Add this directive

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSchoolStore, type SchoolStore } from '@/stores/schoolStore'; // Import the store and its type

// Correctly import the named export 'Scene'
const Scene = dynamic(() => import('../components/map/Scene').then((mod) => mod.Scene), { ssr: false });

export default function Home() {
  // Add explicit type for the state parameter
  const initializeStore = useSchoolStore((state: SchoolStore) => state.initializeStore);

  useEffect(() => {
    initializeStore(); // Call the initialization function on mount
  }, [initializeStore]); // Dependency array ensures it runs once

  return <Scene />;
}
