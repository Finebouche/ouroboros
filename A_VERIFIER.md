# Points à vérifier

Affirmations écrites dans les cours mais pas encore vérifiées dans une source. Un agent qui vérifie un point le retire de cette liste (et corrige le cours si besoin) ; un agent qui écrit une affirmation non vérifiée l'ajoute ici.

Dernière vérification complète : 4 novembre 2026 ; les 196 références du site ont été contrôlées automatiquement (Crossref, DataCite, arXiv, statut HTTP) : titres, années et auteurs conformes. Les points confirmés (source primaire, code ou simulation) ont été retirés et le cours corrigé ; restent ceux ci-dessous.

## Post-Transformer

- Rien de signalé pour l'instant.

## RL

- Rien de signalé pour l'instant.

## Reservoir computing

- **Chapitre 1** :
  - Section 3 : « la mémoire est bornée par la taille du réservoir » (capacité mémoire ≤ N pour une entrée i.i.d., Jaeger 2001, rapport technique GMD 152 *Short term memory in echo state networks*) : source non relue, identifiant non contrôlé, absente des références.
  - Section 5 (composant `CoverJl`) : position générale presque sûre des états d'un réservoir statique, déduite pour ce cours des lemmes 4.3-4.4 de Nguyen et Hein (2017) (numérotation PMLR non vérifiée) ; réservoir récurrent : aucun résultat trouvé, réserve gardée dans le composant.
- **Chapitre 2** :
  - Chiffres « sur les données du projet » : 561 et 44 viennent d'un log de script cité par l'utilisateur, non relu.
  - Figure Ohkubo et Inubushi : entrée à chaque pas Δt = 0,02 et cible 0,2 plus loin, déduits de leur figure 2 et de leur programme ; le texte de l'article se lit aussi comme un échantillonnage tous les τ.
  - Figure Ohkubo et Inubushi (`lorenz.ts`, `TUNED`) : plusieurs réglages retenus sont au bord de la grille de `tune()` (échelle de $W$ 0,3, de $W_{in}$ 0,2, $\alpha = 10^{-10}$) ; l'optimum peut se trouver au-delà, grille non élargie.
  - Section 4 : développement de l'acronyme FORCE (*First-Order Reduced and Controlled Error*) non relu dans Sussillo et Abbott (2009).
  - Section 5 : « l'ordre 2 économise surtout des neurones (leur figure 3b) » (erreurs presque égales à nombre de poids égal dans l'article) : lecture de la figure 3b d'Ohkubo et Inubushi non refaite.
- **Chapitre 11, banc de poissons** :
  - Sans source (choix de dessin) : rotation interne d'une boule d'appât, rayon de la vacuole, frontière entre banc lâche et essaim, forme globale d'un essaim.
  - Coin (V) d'un banc entier : le V dessiné a la pointe en avant, l'inverse de la parabole des thons (Partridge et al., 1983) ; banc entier en file indienne : non trouvé (résumé de Gerlotto et al. 2003 introuvable).
  - Extinction des mélanges sans horloge commune : explication partielle (voir le texte du chapitre).

## Robotique

- **Chapitre unique « vue d'ensemble »** : outils non exécutés (GPU NVIDIA, servomoteur ou clés d'API requis) : TSID, Stable Baselines3, mjlab, BAM, onshape-to-robot.

## HPC et Preprocessing

- **Preprocessing, chapitre 3 (débruitage), références** : titres, auteurs, années et DOI concordent dans plusieurs index (recherche web du 13 novembre 2026), mais aucune page d'éditeur n'a pu être ouverte (doi.org, Crossref, arXiv, IEEE Xplore et swellex96.ucsd.edu bloqués par le réseau de la session). À rouvrir : Welch 1967, Widrow et al. 1975, Nagumo et Noda 1967, Reed, Mallett et Brennan 1974, Robey et al. 1992, Cox, Zeskind et Owen 1987, Wang et Chen 2018, Tan, Wang et Wang 2022, site SWellEx-96.
- **Preprocessing, chapitre 3, section 2** : que Widrow et al. (1975) emploie le terme « adaptive line enhancer » et en soit la première publication n'est pas confirmé (le texte ne l'affirme pas ; la référence est donnée pour le dispositif).
- **Preprocessing, chapitre 3, section 3** : la règle « environ 2C observations pour perdre moins de 3 dB » est vérifiée par simulation (perte moyenne (M + 2 − C)/(M + 1)), mais l'énoncé n'a pas été relu dans Reed, Mallett et Brennan (1974). « Près de deux minutes » pour 56 trames de 4 s : chiffre du projet, non recalculé sur les données. « Une grande part du bruit de mer vient de navires lointains, donc d'une direction » : constat du projet sur ses données (bruit surtout vers 315°), sans source.
- **Preprocessing, chapitre 3, section 4** : Wang et Chen (2018) définissent le masque idéal avec un exposant β, le plus souvent 0,5 (racine carrée) ; le chapitre écrit le cas β = 1, celui du projet. Équation exacte de l'article non relue.
- **Preprocessing, chapitre 3, section 5** : la description de Tan, Wang et Wang (2022) vient du résumé de la plénière IJCNN 2023 de DeLiang Wang ; l'article n'a pas été lu.
- **Preprocessing, chapitre 3, section 3** : 28 hydrophones et 255 m pour l'antenne horizontale sud de SWellEx-96 viennent des fichiers du projet ; non confirmés sur le site officiel.
