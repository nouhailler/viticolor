/**
 * ─── Reconnaissance d'étiquette (OCR réel) ───
 *
 * Tesseract.js tourne entièrement dans le navigateur. Le module (et le modèle
 * de langue français) est chargé à la demande au premier scan — connexion
 * requise cette première fois, puis mis en cache par le navigateur.
 */
export async function ocrLabel(dataUrl: string, onProgress?: (pct: number) => void): Promise<string> {
  const Tesseract = (await import('tesseract.js')).default;
  const res = await Tesseract.recognize(dataUrl, 'fra', {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text') onProgress?.(Math.round(m.progress * 100));
    },
  });
  return res.data.text ?? '';
}
