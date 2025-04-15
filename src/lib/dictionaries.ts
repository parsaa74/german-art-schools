import 'server-only';

type Dictionary = Record<string, any>;

const dictionaries = {
  en: () => import('@/dictionaries/en.json').then((module) => module.default),
  de: () => import('@/dictionaries/de.json').then((module) => module.default),
};

export const getDictionary = async (locale: string): Promise<Dictionary> => {
  try {
    // Validate the locale - only allow 'en' or 'de'
    const validLocale = locale && (locale === 'en' || locale === 'de') ? locale : 'en';
    
    // Make sure we're accessing a valid dictionary function
    if (!dictionaries[validLocale] || typeof dictionaries[validLocale] !== 'function') {
      console.warn(`Invalid locale: ${locale}, falling back to 'en'`);
      return await dictionaries.en();
    }
    
    return await dictionaries[validLocale]();
  } catch (error) {
    console.error(`Failed to load dictionary for locale: ${locale}`, error);
    // Fall back to English if the requested locale fails
    return await dictionaries.en();
  }
};