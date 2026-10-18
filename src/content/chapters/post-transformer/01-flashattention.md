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
- FlashAttention-2 et -3 : meilleur partage du travail, puis exploitation du matériel récent (à vérifier dans les articles avant d'écrire)
- Lien avec le KV cache (chapitre 0) et avec l'attention à fenêtre glissante
