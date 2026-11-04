# Points à vérifier

Affirmations écrites dans les cours mais pas encore vérifiées dans une source. Un agent qui vérifie un point le retire de cette liste (et corrige le cours si besoin) ; un agent qui écrit une affirmation non vérifiée l'ajoute ici.

Dernière vérification complète : 3 novembre 2026. Les points confirmés (source primaire, code ou simulation) ont été retirés et le cours corrigé ; restent ceux ci-dessous.

## Post-Transformer

- Rien de signalé pour l'instant.

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
  - Coin (V) d'un banc entier et banc entier en file indienne : non trouvés ; le V est une stylisation. Seules formes documentées : petits groupes de thons (moins de 15) en parabole ou en ligne (Lutcavage et Kraus 1995), ou en échelon (Partridge et al. 1983, non lu, cités par Hanrahan et Juanes 2001). Sens de la parabole non vérifié. Piste non lue pour la file indienne : Gerlotto et al. (2003, résumé ICES), cité par Calovi et al. (2014).
  - Explication de l'extinction des mélanges sans horloge commune (directions non partagées), dite « possible, partielle » dans le texte. Simulé (graines 1 à 3) : une horloge propre à chaque mode laisse 27 à 32 extinctions sur 135, contre 0 avec l'horloge commune et 73 à 86 sans horloge, ce qui appuie le rôle du partage ; mais sans horloge, le recouvrement des conceptors d'une paire ne prédit pas son extinction (Spearman −0,12 à −0,34), et la somme C_a + C_b, qui n'affaiblit aucune direction, s'éteint encore pour 15 paires sur 45.
  - Frontière entre banc lâche et essaim : aucune source ne la fixe, ni ne décrit la forme globale d'un essaim (choix de dessin).
- **Chapitre 2 (règles d'apprentissage de la lecture)** :
  - Nagumo et Noda (1967) et Albert et Gardner (1967) : forme exacte de la règle NLMS non lue dans les originaux (identifiants vérifiés).
  - Legenstein et al. (2010) : forme de la règle EH non lue dans l'article (titre et DOI vérifiés).
  - Saunders, Gammerman et Vovk (1998), Liu, Pokharel et Príncipe (2008), Richard, Bermudez et Honeine (2009), Shawe-Taylor et Cristianini (2004, chapitre 9, noyau ANOVA) : ajoutés d'après l'utilisateur, identifiants vérifiés (Crossref, dépôt de Southampton), contenu non relu.
  - « λ décroît à peu près comme l'inverse du nombre d'époques » pour LMS : constat de simulation (λ × époques entre 315 et 500), sans source théorique.
  - Ohkubo et Inubushi : « il ne centre pas φ » d'après l'absence de mention dans la version publiée (PMC11680959).
  - neh:2 (67 % puis 60 à 66 %) : simulation hors widget, non montrée sur la page.
  - Chiffres « sur les données du projet » (précisés par l'utilisateur le 4 novembre 2026) : 0,16 et 0,01 viennent de la docstring de `readout_rules.py`, mesurés lors d'une session antérieure, non recalculés ; 561 (diagonale du noyau centré plus 1, `random_ei` 500) et 44 (ordre 1) viennent d'un log de script non relu ici.
  - Figure Ohkubo et Inubushi (section 5) : leurs réglages (σ_A, σ_B, β, longueurs, supplément) non lus ; leurs figures 2 et 3b sont résumées d'après le texte de l'article.

## Robotique

- **Chapitre unique « vue d'ensemble »** :
  - Exemples non exécutés : TSID, Stable Baselines3, mjlab, identification réelle avec BAM, onshape-to-robot (clés d'API requises).

## HPC et Preprocessing

- Rien de signalé pour l'instant.
