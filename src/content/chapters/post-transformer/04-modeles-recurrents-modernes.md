---
num: 4
title: "Modèles récurrents : ancêtres et modèles modernes"
summary: "Les ancêtres (Transformer-XL, RMT, Block-Recurrent, Feedback Transformer), puis attention linéaire, RetNet, RWKV, GLA, DeltaNet, Mamba, et la limite du rappel associatif."
status: plan
---

## Au programme

### Les ancêtres : attention et état temporel

- Transformer-XL, RMT / ARMT, Block-Recurrent Transformer, Feedback Transformer
- Mode d'échec : le modèle apprend à ignorer l'état
- Staircase Attention et Recurrent Looped Transformer

### Les modèles récurrents modernes

- Attention linéaire, RetNet, RWKV, GLA, DeltaNet / Gated DeltaNet
- Mamba et SSM : sélectivité, discrétisation, Mamba-2
- Tableau comparatif interactif
- Limite d'un état de taille fixe : rappel associatif, copie, needle-in-a-haystack

## À ajouter (source : post non référencé, à vérifier dans les articles avant d'écrire)

- Architectures à couvrir : Mamba-2 / Mamba-3, RWKV-7, xLSTM, BDH (Dragon Hatchling), Titans
- Tableau « où elles se recoupent » : attention linéaire, attention softmax, poids rapides à l'inférence (*test-time / fast weights*), inspiration cérébrale
- Colonnes à ajouter pour coller au cours : état de taille fixe ou qui grandit ; récurrence linéaire (scan parallèle) ou non linéaire
- Titans : mémoire mise à jour à l'inférence, lien avec les ancêtres (section ci-dessus)
- Points à confirmer : « Mamba-3 » (état complexe, MIMO), variantes MAC / MAG de Titans, rattachement de BDH à l'attention linéaire ; garder les cases incertaines marquées « ? »
