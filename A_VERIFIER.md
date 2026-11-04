# Points à vérifier

Affirmations écrites dans les cours mais pas encore vérifiées dans une source. Un agent qui vérifie un point le retire de cette liste (et corrige le cours si besoin) ; un agent qui écrit une affirmation non vérifiée l'ajoute ici.

Dernière vérification complète : 3 novembre 2026. Les points confirmés (source primaire, code ou simulation) ont été retirés et le cours corrigé ; restent ceux ci-dessous.

## Post-Transformer

- **Chapitre 5 (plan)** : Jamba 2 et LFM2.5 ne sont vus que sur des sites tiers, pas dans une source primaire (le plan le dit).

## RL

- Rien de signalé pour l'instant.

## Reservoir computing

- **Chapitre 1, section 5 (Cover et Johnson-Lindenstrauss)** :
  - Position générale des états d'un réservoir récurrent : aucun résultat trouvé (Cover 1965, section IV, ne donne qu'un critère pour des motifs tirés indépendamment) ; réserve gardée dans le texte.
- **Chapitre 7** : formule de Stone et Holmes (1990), $\tau \sim (1/\lambda_u)(\ln(d/\varepsilon) + O(1))$, lue dans Stone et Armbruster (1999, Chaos 9, éq. 13, DOI 10.1063/1.166423), qui l'attribuent à l'article de 1990 ; l'article SIAM lui-même (accès payant) n'a pas été lu.
- **Chapitre 11, banc de poissons (tableau `BancModes`, widget `Banc`)** :
  - Pitcher (1983) n'a pas été lu directement (accès Elsevier fermé). Ses définitions sont confirmées par la citation de Delcourt et Poncin (2012, p. 596) et par Pitcher (1986, p. 295, figure 12.1 reprise de Pitcher 1983).
  - Pitcher et Wyche (1983) : seules les p. 193-194 ont été lues (aperçu Springer). La description détaillée de la vacuole, p. 195 et suivantes, ne l'a pas été. Elle pourrait chiffrer la « minimum approach distance », donc un rayon de vacuole. Leur répertoire de 10 manœuvres ne contient pas la fontaine.
  - Rotation interne d'une boule d'appât : non documentée (dessin). Rayon de la vacuole : aucune valeur publiée (choix de dessin).
  - Coin (V) d'un banc entier et banc entier en file indienne : non trouvés ; le V est une stylisation, la seule forme documentée est la rangée de thons en parabole ou en ligne (Lutcavage et Kraus 1995). Sens de la parabole non vérifié.
  - « Explication probable » de l'extinction des mélanges sans horloge commune (directions non partagées) : non vérifiée ; seul le décompte (83 mélanges sur 135 sans horloge, aucun avec) est simulé.
  - Frontière entre banc lâche et essaim : aucune source ne la fixe, ni ne décrit la forme globale d'un essaim (choix de dessin).
  - Effet fontaine : dans le dessin, le prédateur va à peu près à la vitesse des proies au sol (il arrive de face) ; Bartashevich et al. (2024) donnent un rapport d'environ 1,85.
- **Chapitre 2 (règles d'apprentissage de la lecture)** :
  - Nagumo et Noda (1967) et Albert et Gardner (1967) : forme exacte de la règle NLMS non lue dans les originaux (identifiants vérifiés).
  - Legenstein et al. (2010) : forme de la règle EH non lue dans l'article (titre et DOI vérifiés).
  - Saunders, Gammerman et Vovk (1998), Liu, Pokharel et Príncipe (2008), Richard, Bermudez et Honeine (2009), Shawe-Taylor et Cristianini (2004, chapitre 9, noyau ANOVA) : ajoutés d'après l'utilisateur, identifiants vérifiés (Crossref, dépôt de Southampton), contenu non relu.
  - « λ décroît à peu près comme l'inverse du nombre d'époques » pour LMS : constat de simulation (λ × époques entre 315 et 500), sans source théorique.
  - Ohkubo et Inubushi : « il ne centre pas φ » d'après l'absence de mention dans la version publiée (PMC11680959).
  - neh:2 (67 % puis 60 à 66 %) : simulation hors widget, non montrée sur la page.
  - LMS et eh du jeu jouet : le taux est c / ⟨‖x‖² + 1⟩ (moyenne sur le vecteur complété par 1), le tableau écrit c / ⟨‖x‖²⟩ comme dans le projet ; écart d'environ 1,6 %.
  - Chiffres « sur les données du projet » : 0,16 et 0,01 ne figurent que dans une docstring de `canopy/next_phrase_prediction/readout_rules.py` ; 560 n'est dans aucun fichier du projet (seulement dans des transcriptions de sessions) ; on ne sait pas s'il porte sur ‖φ‖² ou ‖φ_c‖². À confirmer par l'utilisateur.
  - Sens du « n » de neh, et du nom `random_ee` : inconnus.

## Robotique

- **Chapitre unique « vue d'ensemble »** :
  - Dijkstra 1959 (10.1007/BF01386390) repris des anciens chapitres, identifiant non recontrôlé.
  - Exemples non exécutés : TSID, Stable Baselines3, mjlab, identification réelle avec BAM, onshape-to-robot (clés d'API requises).
  - Les 28 références viennent des anciens chapitres, identifiants non recontrôlés.

## HPC et Preprocessing

- Rien de signalé pour l'instant.
