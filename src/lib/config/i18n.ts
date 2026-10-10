// i18n configuration (per app). Template default is en-US;
// EduBac default is fr-FR with ht-HT (Haitian Creole).
export const SUPPORTED_LOCALES = [
	{ code: 'fr-FR', label: 'Français', flag: '/lg-fr.svg' },
	{ code: 'ht-HT', label: 'Kreyòl ayisyen', flag: '/lg-ht.svg' }
] as const;

export type LocaleCode = (typeof SUPPORTED_LOCALES)[number]['code'];

export const DEFAULT_LOCALE: LocaleCode = 'fr-FR';

export const STORAGE_KEY = 'edubac.locale';
