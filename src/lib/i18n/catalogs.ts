import frFR from './locales/fr-FR.json';
import htHT from './locales/ht-HT.json';

/** Per-app catalog map. Adding a locale = one import + one line here. */
export const defaultCatalog = frFR;

export const catalogs = {
	'fr-FR': frFR,
	'ht-HT': htHT satisfies Record<keyof typeof frFR, string>
};
