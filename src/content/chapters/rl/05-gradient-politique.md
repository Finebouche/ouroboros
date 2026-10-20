---
num: 5
title: "Gradient de politique"
summary: "Ajuster directement la politique : REINFORCE, acteur-critique, gradient naturel (NAC), TRPO et PPO, avec GAE."
status: plan
---

## Au programme

- Le théorème du gradient de politique ; REINFORCE (retour complet, Monte-Carlo)
- Réduire le bruit : ligne de base, avantage, critique (acteur-critique)
- GAE : mélanger TD et Monte-Carlo avec λ
- Gradient naturel (NAC), puis TRPO et PPO : limiter la taille d'une mise à jour
- Qui attribue le crédit : de REINFORCE (retour complet) à PPO (mélange selon λ)
- Note : PPO n'est pas une évolution de DQN. PPO descend du gradient de politique (REINFORCE, acteur-critique, TRPO) : il apprend la politique $\pi_\theta$ et un critique $V$, sur la politique (données fraîches, réutilisées quelques fois puis jetées). DQN (chapitre 4) descend de Q-learning : il apprend $Q(s,a)$, la politique est implicite (argmax), hors politique avec une mémoire de relecture. Les deux utilisent des réseaux de neurones, mais ce sont deux familles (voir le tableau du chapitre 1, section 4)
