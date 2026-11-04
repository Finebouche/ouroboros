# Points à vérifier

Affirmations écrites dans les cours mais pas encore vérifiées dans une source. Un agent qui vérifie un point le retire de cette liste (et corrige le cours si besoin) ; un agent qui écrit une affirmation non vérifiée l'ajoute ici.

Dernière vérification complète : 3 novembre 2026. Les points confirmés (source primaire, code ou simulation) ont été retirés et le cours corrigé ; restent ceux ci-dessous.

## Post-Transformer

- Rien de signalé pour l'instant.

## RL

- Rien de signalé pour l'instant.

## Reservoir computing

- **Chapitre 1, section 5 (Cover et Johnson-Lindenstrauss)** :
  - Position générale : pour le réservoir statique, déduite (pour ce cours, non publiée sous cette forme) des lemmes 4.3-4.4 de Nguyen et Hein (2017, arXiv 1704.08045, lus sur ar5iv ; numérotation PMLR non vérifiée), qui démontrent le rang plein presque sûr ; pour un réservoir récurrent, aucun résultat trouvé (Dambre et al. 2012 la supposent, Maass et al. 2004 la mesurent, Gonon et al. 2020 ne traitent que le cas linéaire).
- **Chapitre 7** : formule de Stone et Holmes (1990) sur le temps de séjour, de l'ordre de (1/λ_u) ln(1/ε). Elle est lue dans deux sources secondaires : Stone et Armbruster (1999, Chaos 9, éq. 13, DOI 10.1063/1.166423), et Gog, Oprea, Proctor et Rucklidge (1999, Proc. R. Soc. A 455, p. 4211-4213, DOI 10.1098/rspa.1999.0498). L'article SIAM (DOI 10.1137/0150043, accès fermé) n'a pas été lu.
- **Chapitre 11, banc de poissons (tableau `BancModes`, widget `Banc`)** :
  - Pitcher (1983) n'a pas été lu directement (accès Elsevier fermé). Ses définitions sont confirmées par la citation de Delcourt et Poncin (2012, p. 596) et par Pitcher (1986, p. 295, figure 12.1 reprise de Pitcher 1983).
  - Pitcher et Wyche (1983) : seules les p. 193-194 ont été lues (aperçu Springer). La description détaillée de la vacuole, p. 195 et suivantes, ne l'a pas été. Elle pourrait chiffrer la « minimum approach distance », donc un rayon de vacuole. Leur répertoire de 10 manœuvres ne contient pas la fontaine.
  - Rotation interne d'une boule d'appât : non documentée (dessin). Rayon de la vacuole : aucune valeur publiée (choix de dessin).
  - Coin (V) d'un banc entier et banc entier en file indienne : non trouvés ; le V est une stylisation. Partridge et al. (1983, p. 254, aperçu Springer) : paraboles, échelons et lignes droites, tous de moins de 15 thons ; Lutcavage et Kraus (1995, p. 498) : nage côte à côte en parabole ou en ligne. Sens de la parabole (pointe en avant ou en arrière) : absent des p. 253-254 de Partridge, figure 3A de Lutcavage illisible. File indienne : Calovi et al. (2014, réf. 28) citent Gerlotto et al. (2003, Proc. ICES Symp. on Fish Behaviour in Exploited Ecosystems, Abstracts p. 86), résumé introuvable ; son titre porte sur des pélagiques tropicaux, alors que Calovi parle du hareng.
  - Explication de l'extinction des mélanges sans horloge commune (directions non partagées), dite « possible, partielle » dans le texte. Simulé (graines 1 à 3) : une horloge propre à chaque mode laisse 27 à 32 extinctions sur 135, contre 0 avec l'horloge commune et 73 à 86 sans horloge, ce qui appuie le rôle du partage ; mais sans horloge, le recouvrement des conceptors d'une paire ne prédit pas son extinction (Spearman −0,12 à −0,34), et la somme C_a + C_b, qui n'affaiblit aucune direction, s'éteint encore pour 15 paires sur 45.
  - Frontière entre banc lâche et essaim : aucune source ne la fixe, ni ne décrit la forme globale d'un essaim (choix de dessin).
- **Chapitre 2 (règles d'apprentissage de la lecture)** :
  - Références d'ordre 2. Confirmés : Saunders et al. (1998, ridge dual, section 2 ; ANOVA par sommes de puissances, section 5) et Shawe-Taylor et Cristianini (2004, section 9.2, Computation 9.18), lus ; KLMS de Liu et al. (2008), d'après le résumé. Non lus : le texte intégral de Liu et al. (2008), les équations du KNLMS de Richard et al. (2009) (images dans le PDF auteur) et la section 2.8 de Liu, Príncipe et Haykin (2010), connue par la table des matières et deux extraits Google Livres.
  - Chiffres « sur les données du projet » : 0,16 et 0,01 sont bien dans la docstring de `canopy/next_phrase_prediction/readout_rules.py` (l. 27-28), mais non recalculés ; 561 et 44 viennent d'un log de script cité par l'utilisateur, non relu.
  - Figure Ohkubo et Inubushi (section 5) : entrée à chaque pas Δt = 0,02 et cible 0,2 plus loin, déduits de leur figure 2 (finement échantillonnée) et de leur programme publié (Δt = 0,02, 100 unités de temps d'apprentissage) ; le texte de l'article (cible x_{t+1} = φ^τ(x_t)) se lit aussi comme un échantillonnage tous les τ. Nos grilles de réglages diffèrent des leurs.

## Robotique

- **Chapitre unique « vue d'ensemble »** :
  - Outils non exécutés (GPU NVIDIA, servomoteur réel ou clés d'API requis) : TSID, Stable Baselines3, mjlab, BAM, onshape-to-robot. Leurs descriptions du tableau ont été vérifiées le 4 novembre 2026 sur les sources au dernier tag (README, doc, code), pas en les faisant tourner.

## HPC et Preprocessing

- Rien de signalé pour l'instant.
