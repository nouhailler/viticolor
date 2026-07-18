import { SCAN_DEMO } from '../data';
import type { ScanDemo } from '../types';

/**
 * ─── Point d'extension : reconnaissance d'étiquette (OCR) ───
 *
 * Dans cette version, la reconnaissance est un *stub* : elle renvoie la fiche
 * de démonstration (Domaine Jamet, Côte-Rôtie 2020) après un court délai
 * simulant le traitement.
 *
 * Pour brancher une vraie reconnaissance d'étiquette, remplacez le corps de
 * `recognizeLabel` par un appel à votre moteur OCR / service de reconnaissance
 * (ex. Tesseract.js en local, ou une API vision côté serveur). La fonction
 * reçoit une image capturée (dataURL de la trame vidéo) et doit résoudre un
 * objet `ScanDemo`.
 */
export async function recognizeLabel(_frameDataUrl?: string): Promise<ScanDemo> {
  // TODO(extension) : appeler ici le moteur OCR réel avec `_frameDataUrl`.
  await new Promise((r) => setTimeout(r, 450));
  return SCAN_DEMO;
}
