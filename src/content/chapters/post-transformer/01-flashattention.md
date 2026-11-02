---
num: 1
title: "FlashAttention : l'attention et la mémoire du GPU"
summary: "Calculer l'attention exacte sans jamais écrire la matrice des scores en mémoire : découpage en tuiles, softmax en ligne, recalcul au lieu de stocker."
status: plan
---

## Au programme

- Où va le temps dans l'attention standard : la matrice des scores $s \times s$ écrite puis relue en mémoire globale (HBM) ; lien avec le modèle roofline (cours HPC, chapitre 1)
- Hiérarchie mémoire du GPU : HBM (grande, lente) contre SRAM sur puce (petite, rapide)
- Découpage en tuiles : charger des blocs de $Q$, $K$, $V$ dans la SRAM et calculer la sortie bloc par bloc
- Softmax en ligne (*online softmax*) : maximum courant, somme courante et remise à l'échelle de la sortie partielle ; widget pas à pas, résultat identique au softmax complet
- Rétropropagation : recalculer les scores au lieu de les stocker (même idée que le *checkpointing*)
- Ce que ça change : mémoire en $O(s)$ au lieu de $O(s^2)$, attention **exacte** (pas une approximation), vitesse limitée par le calcul plutôt que par la mémoire
- FlashAttention-2 (Dao, 2023, arXiv 2307.08691) : moins d'opérations hors produits matriciels, parallélisation sur plusieurs blocs de threads même pour une seule tête, meilleur partage du travail entre warps ; environ ×2 sur FlashAttention, 50 à 73 % du débit théorique d'un A100 (résumé)
- FlashAttention-3 (Shah et al., 2024, arXiv 2407.08608) : pour les H100 (Hopper) : spécialisation des warps pour recouvrir calcul et transferts (Tensor Cores et TMA asynchrones), alternance des produits matriciels et du softmax par blocs, FP8 avec quantification par blocs (résumé)
- Lien avec le KV cache (chapitre 0) et avec l'attention à fenêtre glissante
