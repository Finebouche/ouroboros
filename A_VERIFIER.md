# Points à vérifier

Affirmations écrites dans les cours mais pas encore vérifiées dans une source. Un agent qui vérifie un point le retire de cette liste (et corrige le cours si besoin) ; un agent qui écrit une affirmation non vérifiée l'ajoute ici.

## Post-Transformer

- **Chapitre 2** : DOI du LSTM (Hochreiter & Schmidhuber, 1997, `10.1162/neco.1997.9.8.1735`) : le site de l'éditeur bloque l'accès. Dans le tableau xLSTM, « le mLSTM n'a pas de mélange de mémoire » vient de l'article, pas de la page arXiv.
- **Chapitre 3** : variante de Blelloch (travail en $O(T)$, profondeur doublée) ; formule de normalisation de l'attention linéaire d'origine ($\phi(q_t) \cdot z_t$) ; usage de matrices diagonales ou structurées dans les modèles récents.
- **Chapitre 4 (plan)** : architectures et chiffres venant d'un post non référencé : Mamba-3, RWKV-7, BDH, variantes MAC / MAG de Titans, rattachement de BDH à l'attention linéaire.
- **Chapitre 5 (plan)** : ratios couches linéaires / softmax annoncés (3:1 Qwen3-Next et Kimi Linear, 7:1 MiniMax, environ 7:1 Jamba).
- **Chapitre 1 (plan, FlashAttention)** : apports de FlashAttention-2 et -3.

## RL

- **Chapitre 1** : correspondances du tableau `Evaluation` (LSTD → LSPI, FQE → FQI, SARSA(λ), MCTS dans la famille Monte-Carlo, critique de NAC et rôle de λ) ; noms des familles « itération de valeur / de politique approchée » ; exemples DQN, A2C, TRPO, CMA-ES, Dyna, MCTS / AlphaZero, MuZero.
- **Chapitre 2** : conditions de convergence de SARSA ; terme « triade mortelle » (édition 2018 de Sutton & Barto, peut-être absent de la version de 2015 citée).
- **Chapitre 3, tableau des stratégies (section 2)** : colonne « où on la trouve » de mémoire : softmax comme politique du gradient de politique à actions discrètes, Thompson sampling en publicité et recommandation (Chapelle & Li 2011, non relu) ; regret en ln t d'UCB1 d'après le titre et le résumé d'Auer et al.
- **Chapitre 3, tableau « Quelle exploration dans quel algorithme »** : ε décroissant au début de l'entraînement de DQN, bonus d'entropie de A2C et PPO, UCT dans MCTS, bruit gaussien sur les paramètres d'OpenAI-ES, rôle du bonus de nouveauté : affirmations de mémoire, sources primaires non relues (Mnih et al. 2015 et 2016, Schulman et al. 2017, Kocsis & Szepesvári 2006, Salimans et al. 2017).
- **Chapitre 3** : forme du bonus UCB $c\sqrt{\ln t / N}$ avec $c = 2$ (celle de Sutton & Barto ; l'UCB1 d'Auer et al. a une autre constante) ; description des méthodes citées (pseudo-comptes de Bellemare et al., ICM de Pathak et al., RND de Burda et al., Thompson sampling) : seuls titres, auteurs et années ont été vérifiés, pas le contenu des articles.
- **Chapitre 4, section LSPI et figure FQI / DQN / LSPI** : seul le résumé de Lagoudakis et Parr a été lu (Q linéaire, itération de politique approchée, hors politique, construit sur LSTD). Cité de mémoire : le nom LSTDQ de l'étape d'évaluation, la forme de $A$ et $b$, le même lot réutilisé à chaque itération, l'absence de garantie générale de convergence, le coût cubique en nombre de caractéristiques. Chiffres du widget vérifiés par simulation (caractéristiques « une par couple », λ = 10⁻³ ajouté par moi pour garantir l'inversibilité).
- **Chapitre 4** : convergence de FQI « pour certaines familles de régresseurs » (Ernst et al.) ; Q-learning comme version une transition à la fois de la cible de FQI.

## Reservoir computing

- **Chapitre 1** : « proposée indépendamment » (ESN et LSM) vient de la mémoire du sujet, pas d'une relecture des articles ; la décroissance en $\rho^k$ de la trace d'une entrée passée est une approximation linéaire (petite entrée). Les comportements du widget sont vérifiés par simulation (graines 7 et 11).
- **Chapitre 5** : le contenu des articles cités est résumé d'après leurs résumés (Pascanu et Jaeger, Strock et al.) ou de mémoire (Seung : attracteur en ligne pour la position des yeux ; Sussillo et Barak : minimisation de la vitesse au carré). Chiffres du widget vérifiés par simulation.
- **Chapitre 6** : conditions générales de May et Leonard ($\alpha < 1 < \beta$, $\alpha + \beta > 2$ pour le cycle, $< 2$ pour la coexistence) citées de mémoire, seulement vérifiées numériquement pour $\alpha = 0{,}8$ ou $0{,}5$ et $\beta = 1{,}3$ ; rôle des sous-espaces invariants dans la robustesse des cycles (Guckenheimer et Holmes) cité de mémoire ; temps de séjour en $\ln(1/\varepsilon)$ seulement constaté numériquement sur trois valeurs. Bick et Rabinovich, Afraimovich et al., Rabinovich et al. 2001 : résumés lus, pas les articles.
- **Chapitres 2, 3, 4, 7, 8, 9 (plans)** : aucune référence vérifiée ; résultats annoncés de mémoire (condition suffisante par la valeur singulière, capacité mémoire bornée par $N$, approximation universelle, NG-RC, réservoir à un nœud et retard).

## HPC et Preprocessing

- Rien de signalé pour l'instant.
