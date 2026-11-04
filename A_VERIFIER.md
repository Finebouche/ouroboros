# Points à vérifier

Affirmations écrites dans les cours mais pas encore vérifiées dans une source. Un agent qui vérifie un point le retire de cette liste (et corrige le cours si besoin) ; un agent qui écrit une affirmation non vérifiée l'ajoute ici.

Dernière vérification complète : 4 novembre 2026 ; les 196 références du site ont été contrôlées automatiquement (Crossref, DataCite, arXiv, statut HTTP) : titres, années et auteurs conformes. Les points confirmés (source primaire, code ou simulation) ont été retirés et le cours corrigé ; restent ceux ci-dessous.

## Post-Transformer

- Rien de signalé pour l'instant.

## RL

- Rien de signalé pour l'instant.

## Reservoir computing

- **Chapitre 1, section 5 (Cover et Johnson-Lindenstrauss)** :
  - Position générale : pour le réservoir statique, déduite (pour ce cours, non publiée sous cette forme) des lemmes 4.3-4.4 de Nguyen et Hein (2017, arXiv 1704.08045, lus sur ar5iv ; numérotation PMLR non vérifiée), qui démontrent le rang plein presque sûr ; pour un réservoir récurrent, aucun résultat trouvé (Dambre et al. 2012 la supposent, Maass et al. 2004 la mesurent, Gonon et al. 2020 ne traitent que le cas linéaire).
- **Chapitre 7** : formule de Stone et Holmes (1990), lue le 4 novembre 2026 dans l'article (PDF fourni par l'utilisateur), éq. (2.32) : temps de passage moyen τ ≈ K₀ + (1/λ_u)(|ln ε| + K₁), où λ_u est la valeur propre instable la plus forte et ε le bruit efficace ; confirmée aussi par Stone et Armbruster (1999) et Gog et al. (1999). Rien d'ouvert.
- **Chapitre 11, banc de poissons (tableau `BancModes`, widget `Banc`)** :
  - Pitcher (1983) : lu le 4 novembre 2026 (PDF fourni par l'utilisateur) : shoal = groupe social, critère « social rather than a purely exogenously-determined assembly » ; school = groupe synchronisé, la polarisation n'étant qu'un critère (celui de Shaw 1970) ; « all schools are shoals ». Rien d'ouvert.
  - Pitcher et Wyche (1983) : lu en entier le 4 novembre 2026 (PDF fourni par l'utilisateur, p. 193-203). Vacuole (p. 195) : espace autour d'un maquereau isolé qui pénètre dans le banc de lançons, « presumably » dû à la même distance minimale que le mode herd (2,3 longueurs de lançon en moyenne, tableau 1, p. 196) ; formée quand le maquereau arrive par l'arrière (herd devient vacuole, quelques secondes) ou de face (il traverse le banc « like a zipfastener »). Leur répertoire de 10 manœuvres ne contient pas la fontaine. Aucun rayon propre à la vacuole.
  - Rotation interne d'une boule d'appât : non documentée (dessin). Rayon de la vacuole : seule la distance minimale du mode herd est publiée (Pitcher et Wyche) ; le rayon dessiné reste un choix.
  - Coin (V) d'un banc entier et banc entier en file indienne : non trouvés ; le V dessiné est une stylisation, avec la pointe en avant, ce qui est l'inverse de la parabole des thons. Partridge et al. (1983, lu en entier le 4 novembre 2026) : sur 141 bancs, 26 paraboles, 23 échelons, 16 lignes droites et 8 paires, tous de moins de 15 poissons ; les « lead fish » sont aux extrémités de la parabole (fig. 6a : sommet en arrière, cap vers le haut), qu'ils distinguent explicitement d'un V d'oies ; hypothèse d'une senne pour encercler les proies. Lutcavage et Kraus (1995, p. 498) : nage côte à côte en parabole ou en ligne. File indienne : Calovi et al. (2014, réf. 28) citent Gerlotto et al. (2003, Proc. ICES Symp. on Fish Behaviour in Exploited Ecosystems, Abstracts p. 86), résumé introuvable ; son titre porte sur des pélagiques tropicaux, alors que Calovi parle du hareng.
  - Explication de l'extinction des mélanges sans horloge commune (directions non partagées), dite « possible, partielle » dans le texte. Simulé (graines 1 à 3) : une horloge propre à chaque mode laisse 27 à 32 extinctions sur 135, contre 0 avec l'horloge commune et 73 à 86 sans horloge, ce qui appuie le rôle du partage ; mais sans horloge, le recouvrement des conceptors d'une paire ne prédit pas son extinction (Spearman −0,12 à −0,34), et la somme C_a + C_b, qui n'affaiblit aucune direction, s'éteint encore pour 15 paires sur 45.
  - Frontière entre banc lâche et essaim : aucune source ne la fixe, ni ne décrit la forme globale d'un essaim (choix de dessin).
- **Chapitre 2 (règles d'apprentissage de la lecture)** :
  - Références d'ordre 2 : Saunders et al. (1998), Shawe-Taylor et Cristianini (2004, section 9.2), KLMS (Liu, Pokharel et Príncipe 2008, version auteur lue : résumé et introduction) et KNLMS (Richard et al. 2009, éq. 31-32) lus. La section 2.8 du livre de Liu, Príncipe et Haykin (2010) a été lue le 4 novembre 2026 dans la version auteur des chapitres 2 et 3 : η/(ε + ‖φ(i)‖²) e(i) φ(i), avec ‖φ(i)‖² = κ(u(i), u(i)) ; pas de reprise des détails du KLMS (analyse de la régularisation) dans le cours.
  - Chiffres « sur les données du projet » : 0,16 et 0,01 sont bien dans la docstring de `canopy/next_phrase_prediction/readout_rules.py` (l. 27-28), mais non recalculés ; 561 et 44 viennent d'un log de script cité par l'utilisateur, non relu.
  - Figure Ohkubo et Inubushi (section 5) : entrée à chaque pas Δt = 0,02 et cible 0,2 plus loin, déduits de leur figure 2 (finement échantillonnée) et de leur programme publié (Δt = 0,02, 100 unités de temps d'apprentissage) ; le texte de l'article (cible x_{t+1} = φ^τ(x_t)) se lit aussi comme un échantillonnage tous les τ. Nos grilles de réglages diffèrent des leurs.

## Robotique

- **Chapitre unique « vue d'ensemble »** :
  - Outils non exécutés (GPU NVIDIA, servomoteur réel ou clés d'API requis) : TSID, Stable Baselines3, mjlab, BAM, onshape-to-robot. Leurs descriptions du tableau ont été vérifiées le 4 novembre 2026 sur les sources au dernier tag (README, doc, code), pas en les faisant tourner.

## HPC et Preprocessing

- Rien de signalé pour l'instant.
