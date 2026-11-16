// Chapitre 4 (Preprocessing) : chiffres recopiés de l'article
// K. Tan, Z.-Q. Wang, D. Wang, « Neural Spectrospatial Filtering », IEEE/ACM TASLP 30, p. 605-621, 2022, DOI 10.1109/TASLP.2022.3145319.
// Les tableaux sont des dessins vectoriels dans le PDF : chaque valeur a été lue sur une image de la page rendue à 300 points par pouce
// (pdftoppm -r 300), puis contrôlée par les tableaux d'écarts de l'article (tableaux II, IX, X, XIV, qui sont calculés à partir de
// ceux-ci) : script scratchpad resultats/verif.ts.
//
// Convention : une ligne de tableau = un tableau de nombres DANS L'ORDRE DES COLONNES IMPRIMÉES, antenne par antenne
// (linear-2ch, puis linear-8ch, puis circular-7ch), et dans chaque antenne les métriques dans l'ordre de `metriques`.
// Le commentaire de chaque ligne donne le tableau, la page et le libellé exact de la ligne ; les colonnes sont données en tête de tableau.

export type Antenne = 'l2' | 'l8' | 'c7';
export const ANTENNES: { id: Antenne; papier: string; nom: string; court: string; C: number }[] = [
  { id: 'l2', papier: 'linear-2ch', nom: '2 micros, linéaire (10 cm)', court: '2 micros', C: 2 },
  { id: 'l8', papier: 'linear-8ch', nom: '8 micros, linéaire (pas de 5 cm)', court: '8 micros', C: 8 },
  { id: 'c7', papier: 'circular-7ch', nom: '7 micros, circulaire (rayon 4,25 cm)', court: '7 micros', C: 7 },
];
// géométries : section V-A et fig. 5, p. 610

export type Tableau = { nom: string; page: number; titre: string; metriques: string[]; lignes: Record<string, number[]> };

// TABLEAU I, p. 612 : « Comparisons of different approaches on speech dereverberation ».
// Colonnes : linear-2ch PESQ, SI-SNR (dB) | linear-8ch PESQ, SI-SNR | circular-7ch PESQ, SI-SNR.
export const T1: Tableau = {
  nom: 'I', page: 612, titre: 'déréverbération', metriques: ['PESQ', 'SI-SNR'],
  lignes: {
    'Unprocessed':                 [2.24, 0.22, 2.26, 0.42, 2.25, 0.30], // tableau I, ligne « Unprocessed »
    'Oracle DS':                   [2.35, 1.21, 2.53, 2.74, 2.40, 1.30], // tableau I, ligne « Oracle DS »
    'Oracle TI-MVDR':              [2.41, 4.42, 2.79, 10.73, 2.91, 13.94], // tableau I, ligne « Oracle TI-MVDR »
    'MB TI-MVDR (BLSTM)':          [2.43, 2.35, 2.73, 4.42, 2.76, 5.13], // tableau I, ligne « MB TI-MVDR (BLSTM) »
    'MB TI-MVDR (BLSTM) + PF':     [3.19, 4.37, 3.28, 5.59, 3.35, 6.27], // tableau I, ligne « + PF » sous MB TI-MVDR (BLSTM)
    'MB TI-MVDR (DC-CRN)':         [2.43, 2.36, 2.74, 4.59, 2.77, 5.35], // tableau I, ligne « MB TI-MVDR (DC-CRN) »
    'MB TI-MVDR (DC-CRN) + PF':    [3.22, 4.45, 3.24, 5.62, 3.29, 6.52], // tableau I, ligne « + PF » sous MB TI-MVDR (DC-CRN)
    'CSM TI-MVDR (BLSTM)':         [2.42, 3.72, 2.70, 7.65, 2.72, 7.74], // tableau I, ligne « CSM TI-MVDR (BLSTM) »
    'CSM TI-MVDR (BLSTM) + PF':    [3.41, 8.85, 3.38, 10.36, 3.34, 9.95], // tableau I, ligne « + PF » sous CSM TI-MVDR (BLSTM)
    'CSM TI-MVDR (DC-CRN)':        [2.41, 3.94, 2.70, 7.77, 2.74, 8.40], // tableau I, ligne « CSM TI-MVDR (DC-CRN) »
    'CSM TI-MVDR (DC-CRN) + PF':   [3.57, 10.47, 3.54, 11.66, 3.54, 11.50], // tableau I, ligne « + PF » sous CSM TI-MVDR (DC-CRN)
    'Oracle TV-MVDR':              [2.68, 7.52, 3.38, 15.06, 3.44, 15.44], // tableau I, ligne « Oracle TV-MVDR »
    'CSM TV-MVDR (BLSTM)':         [2.60, 5.15, 3.11, 9.09, 3.12, 8.74], // tableau I, ligne « CSM TV-MVDR (BLSTM) »
    'CSM TV-MVDR (BLSTM) + PF':    [3.27, 8.46, 3.23, 9.77, 3.24, 9.11], // tableau I, ligne « + PF » sous CSM TV-MVDR (BLSTM)
    'CSM TV-MVDR (DC-CRN)':        [2.61, 5.55, 3.11, 9.29, 3.14, 9.47], // tableau I, ligne « CSM TV-MVDR (DC-CRN) »
    'CSM TV-MVDR (DC-CRN) + PF':   [3.46, 10.11, 3.24, 10.74, 3.20, 10.54], // tableau I, ligne « + PF » sous CSM TV-MVDR (DC-CRN)
    'MC-CSM (BLSTM)':              [3.28, 7.61, 3.32, 8.13, 3.31, 8.32], // tableau I, ligne « MC-CSM (BLSTM) »
    'MC-CSM (DC-CRN)':             [3.55, 10.49, 3.63, 11.65, 3.63, 12.75], // tableau I, ligne « MC-CSM (DC-CRN) »
  },
};

// TABLEAU IV, p. 614 : « … speech enhancement in the presence of a point-source noise at 0 dB SNR ».
// Colonnes : linear-2ch STOI (%), PESQ, SI-SNR (dB) | linear-8ch STOI, PESQ, SI-SNR | circular-7ch STOI, PESQ, SI-SNR.
export const T4: Tableau = {
  nom: 'IV', page: 614, titre: 'rehaussement, bruit ponctuel à 0 dB', metriques: ['STOI', 'PESQ', 'SI-SNR'],
  lignes: {
    'Unprocessed':                 [64.74, 1.58, -5.25, 65.06, 1.58, -5.11, 64.89, 1.58, -5.19], // tableau IV, ligne « Unprocessed »
    'Oracle DS':                   [68.70, 1.68, -4.46, 75.01, 1.88, -3.18, 70.81, 1.75, -4.40], // tableau IV, ligne « Oracle DS »
    'Oracle TI-MVDR':              [75.30, 1.83, -0.45, 86.79, 2.28, 5.54, 90.92, 2.42, 8.66], // tableau IV, ligne « Oracle TI-MVDR »
    'MB TI-MVDR (BLSTM)':          [72.49, 1.80, -3.23, 81.09, 2.13, -1.79, 82.60, 2.18, -0.20], // tableau IV, ligne « MB TI-MVDR (BLSTM) »
    'MB TI-MVDR (BLSTM) + PF':     [85.47, 2.42, 1.60, 89.60, 2.74, 2.96, 90.27, 2.78, 4.17], // tableau IV, « + PF » sous MB TI-MVDR (BLSTM)
    'MB TI-MVDR (DC-CRN)':         [72.94, 1.81, -3.07, 81.56, 2.15, -1.62, 83.40, 2.21, 0.02], // tableau IV, ligne « MB TI-MVDR (DC-CRN) »
    'MB TI-MVDR (DC-CRN) + PF':    [87.04, 2.55, 2.24, 90.34, 2.86, 3.34, 91.15, 2.90, 4.61], // tableau IV, « + PF » sous MB TI-MVDR (DC-CRN)
    'CSM TI-MVDR (BLSTM)':         [74.42, 1.83, -0.94, 83.54, 2.18, 3.37, 85.01, 2.20, 3.73], // tableau IV, ligne « CSM TI-MVDR (BLSTM) »
    'CSM TI-MVDR (BLSTM) + PF':    [88.86, 2.60, 5.20, 93.51, 3.00, 6.88, 92.95, 2.98, 6.48], // tableau IV, « + PF » sous CSM TI-MVDR (BLSTM)
    'CSM TI-MVDR (DC-CRN)':        [74.95, 1.83, -0.69, 83.99, 2.18, 3.80, 85.90, 2.24, 4.46], // tableau IV, ligne « CSM TI-MVDR (DC-CRN) »
    'CSM TI-MVDR (DC-CRN) + PF':   [92.35, 2.85, 7.46, 95.66, 3.23, 9.21, 95.92, 3.22, 9.50], // tableau IV, « + PF » sous CSM TI-MVDR (DC-CRN)
    'Oracle TV-MVDR':              [81.60, 2.04, 1.45, 93.04, 2.78, 8.61, 94.42, 2.85, 7.88], // tableau IV, ligne « Oracle TV-MVDR »
    // ligne suivante : identique à « CSM TI-MVDR (BLSTM) » pour linear-2ch et circular-7ch, tel quel dans le PDF (coquille probable)
    'CSM TV-MVDR (BLSTM)':         [74.42, 1.83, -0.94, 87.39, 2.51, 4.77, 85.01, 2.20, 3.73], // tableau IV, ligne « CSM TV-MVDR (BLSTM) »
    'CSM TV-MVDR (BLSTM) + PF':    [88.42, 2.55, 4.98, 91.75, 2.82, 6.45, 91.02, 2.82, 5.88], // tableau IV, « + PF » sous CSM TV-MVDR (BLSTM)
    'CSM TV-MVDR (DC-CRN)':        [77.71, 1.95, 0.01, 87.87, 2.49, 5.30, 88.19, 2.50, 4.80], // tableau IV, ligne « CSM TV-MVDR (DC-CRN) »
    'CSM TV-MVDR (DC-CRN) + PF':   [91.39, 2.74, 7.02, 93.92, 3.00, 8.60, 93.83, 3.00, 8.51], // tableau IV, « + PF » sous CSM TV-MVDR (DC-CRN)
    'MC-CSM (BLSTM)':              [87.58, 2.48, 4.46, 88.43, 2.59, 4.34, 87.71, 2.50, 3.08], // tableau IV, ligne « MC-CSM (BLSTM) »
    'MC-CSM (DC-CRN)':             [91.74, 2.80, 7.00, 93.18, 2.96, 7.25, 92.91, 2.86, 6.96], // tableau IV, ligne « MC-CSM (DC-CRN) »
  },
};

// TABLEAU VII, p. 615 : « … speech enhancement in the presence of a quasi-diffuse noise at 0 dB SNR ».
// Colonnes : linear-2ch STOI (%), PESQ, SI-SNR (dB) | linear-8ch STOI, PESQ, SI-SNR | circular-7ch STOI, PESQ, SI-SNR.
export const T7: Tableau = {
  nom: 'VII', page: 615, titre: 'rehaussement, bruit quasi diffus à 0 dB', metriques: ['STOI', 'PESQ', 'SI-SNR'],
  lignes: {
    'Unprocessed':                 [64.47, 1.53, -5.16, 64.86, 1.54, -5.03, 64.55, 1.53, -5.10], // tableau VII, ligne « Unprocessed »
    'Oracle DS':                   [68.20, 1.63, -3.93, 74.42, 1.77, -1.86, 70.45, 1.68, -3.94], // tableau VII, ligne « Oracle DS »
    'Oracle TI-MVDR':              [72.31, 1.65, -1.98, 82.58, 1.92, 2.63, 85.42, 1.95, 4.23], // tableau VII, ligne « Oracle TI-MVDR »
    'MB TI-MVDR (BLSTM)':          [70.12, 1.66, -3.29, 78.35, 1.88, -0.55, 79.21, 1.91, 0.22], // tableau VII, ligne « MB TI-MVDR (BLSTM) »
    'MB TI-MVDR (BLSTM) + PF':     [83.79, 2.29, 1.05, 87.47, 2.48, 2.48, 88.83, 2.57, 3.79], // tableau VII, « + PF » sous MB TI-MVDR (BLSTM)
    'MB TI-MVDR (DC-CRN)':         [70.51, 1.66, -3.12, 78.69, 1.89, -0.36, 79.29, 1.88, 0.53], // tableau VII, ligne « MB TI-MVDR (DC-CRN) »
    'MB TI-MVDR (DC-CRN) + PF':    [85.74, 2.40, 1.60, 88.73, 2.60, 2.90, 89.77, 2.69, 4.25], // tableau VII, « + PF » sous MB TI-MVDR (DC-CRN)
    'CSM TI-MVDR (BLSTM)':         [71.39, 1.65, -2.33, 79.72, 1.82, 1.15, 80.68, 1.83, 1.47], // tableau VII, ligne « CSM TI-MVDR (BLSTM) »
    'CSM TI-MVDR (BLSTM) + PF':    [87.02, 2.51, 4.55, 91.68, 2.77, 6.19, 91.64, 2.77, 6.09], // tableau VII, « + PF » sous CSM TI-MVDR (BLSTM)
    'CSM TI-MVDR (DC-CRN)':        [71.83, 1.65, -2.19, 80.09, 1.81, 1.33, 81.33, 1.85, 1.79], // tableau VII, ligne « CSM TI-MVDR (DC-CRN) »
    'CSM TI-MVDR (DC-CRN) + PF':   [90.51, 2.72, 6.29, 94.08, 2.98, 8.09, 94.36, 3.01, 8.16], // tableau VII, « + PF » sous CSM TI-MVDR (DC-CRN)
    'Oracle TV-MVDR':              [79.27, 1.83, 1.40, 93.06, 2.46, 8.95, 94.23, 2.52, 9.57], // tableau VII, ligne « Oracle TV-MVDR »
    'CSM TV-MVDR (BLSTM)':         [74.18, 1.76, -0.42, 86.18, 2.27, 4.38, 85.63, 2.26, 4.21], // tableau VII, ligne « CSM TV-MVDR (BLSTM) »
    'CSM TV-MVDR (BLSTM) + PF':    [85.20, 2.40, 4.04, 89.04, 2.55, 5.47, 88.27, 2.50, 5.12], // tableau VII, « + PF » sous CSM TV-MVDR (BLSTM)
    'CSM TV-MVDR (DC-CRN)':        [75.18, 1.77, -0.16, 86.73, 2.24, 4.81, 86.50, 2.25, 4.77], // tableau VII, ligne « CSM TV-MVDR (DC-CRN) »
    'CSM TV-MVDR (DC-CRN) + PF':   [89.37, 2.64, 5.79, 91.75, 2.71, 7.61, 90.66, 2.53, 6.89], // tableau VII, « + PF » sous CSM TV-MVDR (DC-CRN)
    'MC-CSM (BLSTM)':              [86.68, 2.48, 4.14, 88.64, 2.58, 4.35, 88.96, 2.64, 6.39], // tableau VII, ligne « MC-CSM (BLSTM) »
    'MC-CSM (DC-CRN)':             [90.73, 2.70, 6.43, 93.27, 2.92, 7.85, 93.57, 2.90, 8.89], // tableau VII, ligne « MC-CSM (DC-CRN) »
  },
};

// TABLEAU XI, p. 616 : « … two-talker speaker separation in anechoic conditions ».
// Colonnes : linear-2ch ESTOI (%), PESQ, SI-SNR (dB), SDR (dB) | linear-8ch idem | circular-7ch idem ; dernière colonne « Training Criterion »
// (donnée ici dans la clé : « uPIT » ou « LBT » ; « - » pour les lignes sans réseau). Pas de post-filtre en séparation (p. 615-616).
export const T11: Tableau = {
  nom: 'XI', page: 616, titre: 'séparation de deux locuteurs, sans réverbération', metriques: ['ESTOI', 'PESQ', 'SI-SNR', 'SDR'],
  lignes: {
    'Unprocessed':                 [56.84, 1.89, 0.00, 0.08, 56.85, 1.89, 0.00, 0.08, 56.85, 1.89, 0.00, 0.08], // tableau XI, « Unprocessed »
    'Oracle DS':                   [61.18, 2.05, 1.50, 1.57, 68.97, 2.38, 4.46, 4.61, 62.06, 2.05, 1.13, 1.19], // tableau XI, « Oracle DS »
    'Oracle TI-MVDR':              [94.88, 3.70, 22.41, 22.91, 95.89, 3.88, 24.47, 25.65, 99.62, 4.38, 29.53, 31.10], // tableau XI, « Oracle TI-MVDR »
    'MB TI-MVDR (BLSTM)':          [84.02, 2.96, 10.43, 11.93, 82.61, 2.87, 8.52, 10.59, 86.20, 3.03, 11.28, 12.82], // tableau XI, « MB TI-MVDR (BLSTM) », uPIT
    'MB TI-MVDR (DC-CRN)':         [84.44, 3.01, 11.05, 12.54, 85.66, 3.05, 10.33, 12.49, 88.80, 3.21, 13.02, 14.70], // tableau XI, « MB TI-MVDR (DC-CRN) », uPIT
    'CSM TI-MVDR (BLSTM)':         [80.50, 2.79, 7.89, 9.95, 81.46, 3.32, 7.46, 12.05, 82.34, 3.30, 7.28, 11.68], // tableau XI, « CSM TI-MVDR (BLSTM) », uPIT
    'CSM TI-MVDR (DC-CRN)':        [84.89, 3.05, 13.41, 14.02, 86.81, 3.21, 13.81, 15.54, 84.39, 3.07, 12.82, 13.84], // tableau XI, « CSM TI-MVDR (DC-CRN) », uPIT
    'Oracle TV-MVDR':              [87.96, 3.24, 16.30, 16.41, 95.93, 3.95, 25.34, 26.38, 92.39, 3.62, 21.93, 22.18], // tableau XI, « Oracle TV-MVDR »
    'CSM TV-MVDR (BLSTM)':         [76.86, 2.71, 6.98, 8.76, 83.27, 3.29, 7.28, 11.58, 78.27, 3.07, 6.29, 9.90], // tableau XI, « CSM TV-MVDR (BLSTM) », uPIT
    'CSM TV-MVDR (DC-CRN)':        [79.12, 2.79, 9.88, 10.14, 85.33, 3.20, 13.04, 14.39, 79.76, 2.89, 10.49, 11.09], // tableau XI, « CSM TV-MVDR (DC-CRN) », uPIT
    'MC-CSM (DC-CRN) uPIT':        [97.32, 3.91, 23.27, 23.58, 96.92, 3.87, 23.54, 23.85, 98.28, 4.02, 26.36, 26.70], // tableau XI, 1re ligne « MC-CSM (DC-CRN) », uPIT
    'MC-CSM (DC-CRN) LBT':         [97.02, 3.88, 23.04, 23.41, 96.19, 3.86, 23.31, 23.70, 98.45, 4.05, 26.00, 26.33], // tableau XI, 2e ligne « MC-CSM (DC-CRN) », LBT
    'MC-CSM (BLSTM) LBT':          [86.72, 3.15, 8.12, 11.57, 87.17, 3.19, 6.92, 10.89, 87.60, 3.17, 7.63, 11.43], // tableau XI, « MC-CSM (BLSTM) », LBT
  },
};

// TABLEAU XII, p. 617 : « … two-talker speaker separation in reverberant conditions ». Mêmes colonnes que le tableau XI.
export const T12: Tableau = {
  nom: 'XII', page: 617, titre: 'séparation de deux locuteurs, avec réverbération', metriques: ['ESTOI', 'PESQ', 'SI-SNR', 'SDR'],
  lignes: {
    'Unprocessed':                 [37.45, 1.58, -6.73, -1.78, 37.45, 1.59, -6.74, -1.77, 37.65, 1.59, -6.68, -1.74], // tableau XII, « Unprocessed »
    'Oracle DS':                   [40.99, 1.69, -5.51, -0.88, 48.02, 1.89, -3.59, 0.85, 43.45, 1.74, -5.53, -0.95], // tableau XII, « Oracle DS »
    'Oracle TI-MVDR':              [47.63, 1.81, -2.60, 1.40, 63.88, 2.23, 3.71, 6.27, 68.80, 2.31, 5.96, 8.06], // tableau XII, « Oracle TI-MVDR »
    'MB TI-MVDR (BLSTM)':          [37.77, 1.61, -7.19, -1.77, 37.94, 1.59, -8.71, -1.78, 38.31, 1.62, -6.81, -1.71], // tableau XII, « MB TI-MVDR (BLSTM) », uPIT
    'MB TI-MVDR (DC-CRN)':         [37.80, 1.60, -7.18, -1.76, 37.87, 1.58, -8.76, -1.81, 38.35, 1.62, -6.82, -1.70], // tableau XII, « MB TI-MVDR (DC-CRN) », uPIT
    'CSM TI-MVDR (BLSTM)':         [40.53, 1.74, -5.42, 0.24, 40.77, 1.89, -2.87, 2.71, 41.91, 1.89, -3.49, 2.28], // tableau XII, « CSM TI-MVDR (BLSTM) », uPIT
    'CSM TI-MVDR (DC-CRN)':        [45.20, 1.79, -4.06, 1.00, 55.57, 2.05, -0.89, 4.14, 52.78, 1.99, -1.85, 3.47], // tableau XII, « CSM TI-MVDR (DC-CRN) », uPIT
    'Oracle TV-MVDR':              [56.80, 2.02, 0.46, 3.76, 79.23, 2.75, 8.31, 10.86, 79.71, 2.75, 7.95, 10.72], // tableau XII, « Oracle TV-MVDR »
    'CSM TV-MVDR (BLSTM)':         [40.70, 1.76, -4.68, 0.94, 54.91, 2.25, -1.44, 4.28, 50.00, 2.16, -2.14, 3.55], // tableau XII, « CSM TV-MVDR (BLSTM) », uPIT
    'CSM TV-MVDR (DC-CRN)':        [46.74, 1.84, -3.48, 1.61, 59.59, 2.26, -0.22, 5.02, 54.00, 2.10, -1.82, 3.51], // tableau XII, « CSM TV-MVDR (DC-CRN) », uPIT
    'MC-CSM (DC-CRN) uPIT':        [71.67, 2.53, 1.64, 5.69, 75.76, 2.70, 3.39, 7.59, 78.23, 2.76, 5.76, 9.32], // tableau XII, 1re ligne « MC-CSM (DC-CRN) », uPIT
    'MC-CSM (DC-CRN) LBT':         [72.32, 2.56, 2.03, 5.97, 75.10, 2.67, 3.36, 7.58, 78.71, 2.78, 5.87, 9.44], // tableau XII, 2e ligne « MC-CSM (DC-CRN) », LBT
    'MC-CSM (BLSTM) LBT':          [46.99, 1.87, -3.14, 1.40, 58.22, 2.16, -1.19, 3.06, 60.65, 2.24, 0.25, 3.96], // tableau XII, « MC-CSM (BLSTM) », LBT
  },
};

// TABLEAU II, p. 613 : gains (Δ) de la projection spectrale complexe sur un seul micro (1ch) et sur plusieurs, en déréverbération.
// Colonnes : 1ch ΔPESQ, ΔSI-SNR (dB) | linear-2ch ΔPESQ, ΔSI-SNR | linear-8ch idem | circular-7ch idem.
export const T2 = {
  'CSM (BLSTM)':  [0.95, 6.59, 1.04, 7.39, 1.06, 7.71, 1.06, 8.02], // tableau II, ligne « CSM (BLSTM) »
  'CSM (DC-CRN)': [1.16, 7.97, 1.31, 10.27, 1.37, 11.23, 1.38, 12.45], // tableau II, ligne « CSM (DC-CRN) »
};

// Coût, section VI-A, p. 612 : « the number of MAC operations is 168.8 billion for "CSM TI-MVDR (DC-CRN) + PF" and 18.9 billion for
// "MC-CSM (DC-CRN)" » ; « on a 4-second reverberant signal in the 8-channel condition » ; les formations de voies avec post-filtre
// « apply a DNN P+1 times, P times for mask or complex spectrum estimation in the P channels and once for post-filtering ».
// billion (anglais) = milliard = 10⁹.
export const COUT = { csmTiPf: 168.8, mcCsm: 18.9, secondes: 4, micros: 8 };

// Fig. 6, p. 613 : MC-CSM (DC-CRN) entraîné sur 2 micros à 10 cm, testé de 5 à 15 cm par pas de 1 cm (déréverbération).
// VALEURS LUES SUR LA FIGURE (graphique en barres, aucun tableau) : hauteurs des barres extraites du dessin vectoriel de la page
// (pdftocairo -svg, puis interpolation linéaire entre les lignes de grille ; écart de la grille à la droite d'interpolation < 0,006),
// script scratchpad resultats/fig6.py. Précision de lecture : environ 0,02 dB. À 10 cm, la lecture (1,31 ; 10,26) recoupe le tableau II
// (linear-2ch, CSM (DC-CRN) : 1,31 ; 10,27). Arrondies ici au centième.
export const FIG6 = {
  distances: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], // cm
  dPesq:   [1.22, 1.25, 1.26, 1.27, 1.29, 1.31, 1.28, 1.28, 1.27, 1.25, 1.25],
  dSiSnr:  [9.58, 9.73, 9.85, 9.90, 10.00, 10.26, 9.78, 9.46, 8.43, 7.89, 7.60], // dB
  entraine: 10,
};

/** valeur d'une case : tableau, libellé de ligne exact, antenne, métrique */
export function val(t: Tableau, ligne: string, a: Antenne, m: string): number {
  const row = t.lignes[ligne];
  if (!row) throw new Error(`tableau ${t.nom} : ligne inconnue « ${ligne} »`);
  const j = t.metriques.indexOf(m);
  if (j < 0) throw new Error(`tableau ${t.nom} : métrique inconnue « ${m} »`);
  const ia = ANTENNES.findIndex((x) => x.id === a);
  return row[ia * t.metriques.length + j];
}
