import dynamic from 'next/dynamic';

const Scene = dynamic(() => import('../components/map/Scene'), { ssr: false });

export default function Home() {
  return <Scene />;
} 