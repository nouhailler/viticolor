// Fonctions utilitaires partagées.

/** Index du jour — sert à la rotation quotidienne (Découverte du jour). */
export const dayN = (): number => Math.floor(Date.now() / 86400000);

/** Couleur de la pastille de certification (Bio = vert clair, sinon or). */
export const certColor = (c: string): string => (c === 'Bio' ? '#b8d49a' : '#d4b06a');

/** Normalisation insensible aux accents (NFD) pour la recherche. */
export const normalize = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Format nombre à la française (séparateur d'espace insécable). */
export const fr = (n: number): string => n.toLocaleString('fr-FR');

/** Date longue en français : « samedi 18 juillet ». */
export const dateLongue = (): string =>
  new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

/** Choisit l'élément du jour dans une liste (rotation quotidienne). */
export const duJour = <T>(list: T[]): T => list[dayN() % list.length];
