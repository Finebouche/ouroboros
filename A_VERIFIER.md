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
- **Chapitre 3** : forme du bonus UCB $c\sqrt{\ln t / N}$ avec $c = 2$ (celle de Sutton & Barto ; l'UCB1 d'Auer et al. a une autre constante) ; description des méthodes citées (pseudo-comptes de Bellemare et al., ICM de Pathak et al., RND de Burda et al., Thompson sampling) : seuls titres, auteurs et années ont été vérifiés, pas le contenu des articles ; l'échec du bonus $\beta/\sqrt{N(s')}$ ajouté à un Q-learning tabulaire sur la grille (essai non montré, cause non analysée).
- **Chapitre 4** : convergence de FQI « pour certaines familles de régresseurs » (Ernst et al.) ; Q-learning comme version une transition à la fois de la cible de FQI.

## HPC et Preprocessing

- Rien de signalé pour l'instant.
