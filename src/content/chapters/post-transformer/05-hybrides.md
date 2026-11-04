---
num: 5
title: "Les hybrides"
summary: "Griffin, Samba, Jamba : attention et récurrence dans la même pile."
status: plan
---

## Au programme

- Griffin, Samba, Jamba, hybride NVIDIA
- Pourquoi un peu d'attention globale répare le rappel
- Mémoire d'inférence O(1) contre KV cache qui grandit

## À ajouter (vérifié dans les articles et fiches de modèle)

- Hybrides à couvrir : Qwen3-Next, Kimi Linear, MiniMax-01 / M1 (arXiv 2506.13585), Jamba, Jamba2, Nemotron-H, Falcon-H1, Zamba2, LFM2, LFM2.5, StripedHyena 2
- Colonne « ratio » couches linéaires ou SSM : couches softmax :
  - 3:1 pour Qwen3-Next (fiche du modèle : 12 × (3 Gated DeltaNet → 1 Gated Attention)) et Kimi Linear (KDA : MLA, arXiv 2510.26692)
  - 7:1 pour MiniMax-01 (un bloc softmax après chaque groupe de 7 blocs à *lightning attention*, arXiv 2501.08313)
  - 7:1 pour Jamba (attention : Mamba = 1 : 7, arXiv 2403.19887)
  - 7:1 pour Jamba2 Mini (4 couches d'attention sur 32, `config.json` de `ai21labs/AI21-Jamba2-Mini`) ; 13:1 pour Jamba2 3B (2 sur 28)
- Deux façons de mélanger : couches alternées (Jamba, Qwen3-Next) ou branches attention et Mamba-2 en parallèle dans un bloc, nombres de têtes réglables (Falcon-H1, arXiv 2507.22448)
- Zamba2 (arXiv 2411.15242) : épine dorsale Mamba2 et deux blocs d'attention aux poids partagés, avec des adaptateurs LoRA propres à chaque position (lien avec le chapitre 6)
- Nemotron-H (arXiv 2504.03624) : la plupart des couches d'attention remplacées par des couches Mamba-2
- LFM2 (arXiv 2511.23404) : convolutions courtes à porte et quelques blocs d'attention groupée, architecture trouvée par recherche avec le matériel dans la boucle
- LFM2.5 (billet de Liquid AI du 5 janvier 2026, fiches Hugging Face) : reprend l'architecture LFM2 ; 1.2B = 10 blocs de convolution à double porte + 6 blocs GQA ; 24B-A2B (MoE, 64 experts dont 4 actifs) = 30 + 10. Pré-entraînement porté de 10T à 28T jetons pour la famille 1.2B, d'environ 17T à 33T pour 24B-A2B
- Jamba2 (billet d'AI21 du 8 janvier 2026, fiches Hugging Face) : post-entraînement à partir du pré-entraînement de Jamba 1.5 (mid-training sur 500B jetons, puis SFT, DPO, RL) ; Mini = MoE 12B actifs sur 52B, contexte 256K ; 3B dense
- StripedHyena 2 (arXiv 2503.01868) : trois sortes de convolutions Hyena (courtes, moyennes, longues) et de l'attention ; modèles Evo 2
