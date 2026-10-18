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
