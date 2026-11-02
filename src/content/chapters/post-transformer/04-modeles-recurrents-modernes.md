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

## À ajouter (vérifié dans les articles, résumés et passages lus)

- Architectures à couvrir :
  - Mamba-3 (arXiv 2603.15569, ICLR 2026) : discrétisation plus expressive, état complexe (équivalent à un RoPE dépendant des données), variante MIMO
  - RWKV-7 « Goose » (arXiv 2503.14456, 2025) : règle delta généralisée, portes vectorielles, taux d'apprentissage en contexte ; mémoire et temps constants par token
  - xLSTM (chapitre 2)
  - BDH, *Dragon Hatchling* (Kosowski et al., arXiv 2509.26507, 2025) : la version GPU (BDH-GPU) combine une attention linéaire en grande dimension et un MLP ReLU de bas rang ; « attention-based state space sequence learning architecture »
  - Titans (Behrouz et al., arXiv 2501.00663) : mémoire à long terme mise à jour à l'inférence par gradient (surprise, momentum, oubli) ; trois variantes : *Memory as a Context* (MAC), *Memory as a Gate* (MAG), *Memory as a Layer* (MAL)
- Tableau « où elles se recoupent » : attention linéaire, attention softmax, poids rapides à l'inférence (*test-time / fast weights*), inspiration cérébrale
- Colonnes à ajouter pour coller au cours : état de taille fixe ou qui grandit ; récurrence linéaire (scan parallèle) ou non linéaire
- Titans : mémoire mise à jour à l'inférence, lien avec les ancêtres (section ci-dessus)
