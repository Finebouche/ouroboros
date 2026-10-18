---
num: 6
title: "Stratégies d'évolution"
summary: "Optimiser la politique en boîte noire : OpenAI-ES, CMA-ES ; juger une politique entière par son retour."
status: plan
---

## Au programme

- Perturber les paramètres au hasard, garder les directions qui donnent un meilleur retour
- OpenAI-ES : estimateur du gradient par perturbations, parallélisme massif
- CMA-ES : adapter la forme du bruit
- Qui attribue le crédit : la politique entière, sans crédit par action
