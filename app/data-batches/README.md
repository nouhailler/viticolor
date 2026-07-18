# Lots de vins à ingérer

Dépose ici les gros lots de vins (texte brut, gabarit étiqueté), un fichier par lot.
Le format « scrapé » (octets UTF-8 échappés `\C3\A9`, tags `[estimé]`, `non indiqué`,
préfixe `AOP`, millésimes multiples) est géré automatiquement.

Ingestion :

```bash
node scripts/ingest-wines.mjs data-batches/<mon-lot>.txt
```

Le script décode, normalise, comble la température manquante, déduplique (par id),
canonicalise les producteurs, met à jour `src/data/wines.json` et imprime un rapport
(ajoutés / doublons / ignorés / champs comblés / à vérifier).

Ces fichiers de lots ne sont pas embarqués dans l'app (données brutes de travail).
