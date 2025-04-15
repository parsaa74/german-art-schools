import Map from '@/components/Map';
import { getDictionary } from '@/lib/dictionaries';
import { useSchoolStore } from '@/stores/schoolStore';

export default async function Home({ params }: { params: { lang: string } }) {
  await useSchoolStore.getState().initializeStore();
  
  const dict = await getDictionary(params.lang as 'en' | 'de');

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Map with 3D visualization */}
      <div className="flex-1 relative w-full h-full">
        <Map dict={dict} />
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'de' }];
}