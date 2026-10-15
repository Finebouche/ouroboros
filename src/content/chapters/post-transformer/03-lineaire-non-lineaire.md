---
num: 3
title: "Linéaire contre non linéaire"
summary: "Pourquoi un état linéaire se calcule par scan parallèle et pas un tanh."
status: a-venir
---

## Au programme

- h_t = tanh(W·h_{t-1} + …) force l'ordre séquentiel
- h_t = a_t ⊙ h_{t-1} + b_t se calcule par associative scan
- Calcul chunkwise : parallèle dans un chunk, récurrent entre chunks
- Attention linéaire ⇔ RNN à état matriciel
