import LanguageSwitcher from '@/components/LanguageSwitcher';
import { getDictionary } from '@/lib/dictionaries';
import PageTransition from '@/components/PageTransition';
import type { Metadata } from 'next';

// Import global styles
import '@/styles/accessibility.css';

// Generate metadata with dynamic language
export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  return {
    title: 'German Art Schools Map',
    description: 'Interactive map of art schools in Germany - Explore the rich artistic education landscape',
    // Set html lang attribute dynamically
    other: {
      'lang': params.lang,
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { lang: string }
}) {
  const dict = await getDictionary(params.lang as 'en' | 'de');

  // Make sure we have a consistent label text for each language
  const switchLabel = params.lang === 'en'
    ? dict.languageSwitcher?.switchTo || 'Switch to'
    : dict.languageSwitcher?.switchTo || 'Wechseln zu';

  return (
    <>
      <LanguageSwitcher
        lang={params.lang}
        label={switchLabel}
      />
      {/* <PageTransition> */}
        <div className="flex-grow min-h-screen flex flex-col">
          {children}
        </div>
      {/* </PageTransition> */}
    </>
  )
}