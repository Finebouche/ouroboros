# Points à vérifier

Affirmations écrites dans les cours mais pas encore vérifiées dans une source. Un agent qui vérifie un point le retire de cette liste (et corrige le cours si besoin) ; un agent qui écrit une affirmation non vérifiée l'ajoute ici.

Dernière vérification complète : 24 octobre 2026. Tout le reste de l'ancienne liste a été vérifié dans les articles (texte intégral, résumé ou fiche de modèle) et le cours corrigé en conséquence.

## Post-Transformer

- **Chapitre 5 (plan)** : Jamba 2 et LFM2.5 ne sont vus que sur des sites tiers, pas dans une source primaire (le plan le dit).

## RL

- **Chapitre 1, tableau `Evaluation`** : critique de NAC décrit comme une « régression linéaire » d'après le résumé de Peters et Schaal (2008) ; l'article (Neurocomputing 71) n'a pas pu être lu.

## Reservoir computing

- **Chapitre 1, section 5 (Cover et Johnson-Lindenstrauss)** :
  - La position générale des états d'un réservoir n'est pas établie ; le rapprochement « Cover et JL complémentaires » n'a pas de source (dit dans le texte).
  - Énoncé de Dasgupta et Gupta (probabilité au moins $1/P$, sous-espace aléatoire) repris d'une relecture, pas lu dans l'article (10.1002/rsa.10073).
  - Conditions de Larsen et Nelson (ε pas trop petit, $d$ assez grand) reprises d'une relecture, pas lues dans arXiv 1609.02094.
  - DOI 10.1090/conm/026/737400 et pagination 189–206 de Johnson et Lindenstrauss : vérifiés par recherche en ligne, article non relu.
  - Widget Cover : la séparabilité est mesurée par Ho-Kashyap, donc un minorant.
- **Chapitre 3 (plan)** : le rapport de Jaeger (2002) sur la capacité mémoire n'a pas pu être lu (PDF à police non extractible) ; la borne par $N$ est appuyée sur Dambre et al. (2012).
- **Chapitre 5** : la fonction $q(x) = \tfrac12 \lVert \dot x \rVert^2$ de Sussillo et Barak est confirmée par des extraits de l'article cités par un moteur de recherche, pas par une lecture directe du PDF.
- **Chapitre 6** : temps de séjour en $(1/\lambda)\ln(1/\varepsilon)$ attribué à Stone et Holmes (1990) d'après plusieurs sources secondaires concordantes (le résumé de l'article ne donne pas la formule) ; il est aussi constaté dans le widget.
- **Chapitre 10, banc de poissons (tableau `BancModes`, widget `Banc`)** :
  - Pitcher (1983) et Delcourt et Poncin (2012) non lus : la définition shoal / school vient de Miller et Gerlai (2012) et de Vicsek et Zafeiris (2012).
  - Pitcher et Wyche (1983), Magurran et Pitcher (1987), Hall et al. (1986), Similä et Ugarte (1993) : résumés seulement. Le résumé de Pitcher et Wyche ne cite pas la fontaine (des sources secondaires la leur attribuent).
  - Rotation interne d'une boule d'appât : non documentée (dessin). Rayon de la vacuole : aucune valeur publiée (choix de dessin).
  - Coin (V) d'un banc entier et banc entier en file indienne : non trouvés ; le V est une stylisation, la seule forme documentée est la rangée de thons en parabole ou en ligne (Lutcavage et Kraus 1995). Sens de la parabole non vérifié.
  - Tunstrøm et al. (2013) : transition polaire ↔ moulin sans passer par l'essaim, lue dans le texte, figure 5 non vue. Couzin et al. (2002) : normalisation de $r_{ic}$ dans $m_{\text{group}}$ non lisible dans le texte extrait.
  - Moulin à 30 poissons : rare chez le méné jaune (3 % du temps, Tunstrøm et al. 2013) ; le dessiner est une stylisation.
  - « Explication probable » de l'extinction des mélanges sans horloge commune (directions non partagées) : non vérifiée ; seul le décompte (83 mélanges sur 135 sans horloge, aucun avec) est simulé.
  - Frontière entre banc lâche et essaim : aucune source ne la fixe, ni ne décrit la forme globale d'un essaim (choix de dessin).
  - Effet fontaine : dans le dessin, le prédateur va à peu près à la vitesse des proies au sol (il arrive de face) ; Bartashevich et al. (2024) donnent un rapport d'environ 1,85.

## Robotique

- **Chapitre unique « vue d'ensemble »** :
  - Chiffres repris des anciens chapitres sans être refaits : RRT 197 contre RRT-Connect 77 itérations (graines 1 à 100), 198 contre 140 segments testés ; CEM 9 pas au départ puis 500 après 8 itérations ; amortissement électrique 57 fois le frottement visqueux sur un MX-64 (paramètres M1 de BAM) ; 3,27 m/s² de bascule dans QpContacts ; pink et mink 7 itérations pour 2,6e-6 m, placo 6.
  - Microban (26 et 25 coordonnées, 19 articulations) : valable pour le fichier lu le 29 octobre 2026, ces dépôts changent vite.
  - Colonne « organisation » du tableau d'outils (PTC, Rhoban, Farama Foundation, DLR-RM, mujocolab…) reprise des anciens chapitres ; LAAS-CNRS retiré pour Pinocchio (non confirmé).
  - Résultats d'essais retirés du chapitre mais exécutés lors de la première rédaction : MuJoCo 3.17 (bille de 1 kg, enfoncement 0,37 mm, force normale 9,81 N) ; pink 4.4.0 et mink 1.3.0 (mêmes itérés, 7 itérations, 2,6e-6 m), placo 0.10.2 (6 itérations) ; Gymnasium 1.4 CartPole (retour 500, tronqué) ; Crocoddyl 3.2.1 (pendule, `SolverBoxFDDP` 45 itérations, MPC 30 itérations par pas) ; BAM, amortissement électrique 57 fois le frottement visqueux (MX-64, paramètres M1).
  - Dijkstra 1959 (10.1007/BF01386390) repris des anciens chapitres, identifiant non recontrôlé.
  - Rapport $1/(2\lambda)$ pour le gain maximal du moindres carrés amorti : repris, non recontrôlé.
  - Exemples non exécutés : TSID, Stable Baselines3, mjlab, identification réelle avec BAM, onshape-to-robot (clés d'API requises).
  - Les 28 références viennent des anciens chapitres, identifiants non recontrôlés.

## HPC et Preprocessing

- Rien de signalé pour l'instant.
