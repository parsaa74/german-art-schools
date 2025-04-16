import { useRouter } from 'next/router';
import en from '../translations/en.json';
import de from '../translations/de.json';

const translations = { en, de };

export function useTranslation() {
  const router = useRouter();
  const { locale } = router;
  const t = (key: string) => {
    const keys = key.split('.');
    return keys.reduce((obj: any, k: string) => obj?.[k], translations[locale as keyof typeof translations] || translations.en);
  };

  return { t, locale };
}