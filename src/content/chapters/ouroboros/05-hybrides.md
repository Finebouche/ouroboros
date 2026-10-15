---
num: 5
title: "Les hybrides"
summary: "Griffin, Samba, Jamba : attention et récurrence dans la même pile."
status: a-venir
---

## Au programme

- Griffin, Samba, Jamba, hybride NVIDIA
- Pourquoi un peu d'attention globale répare le rappel
- Mémoire d'inférence O(1) contre KV cache qui grandit

## À ajouter (source : post non référencé, à vérifier dans les articles avant d'écrire)

- Hybrides à couvrir : Qwen3-Next, Kimi Linear, MiniMax-01 / M1, Jamba / Jamba 2, Nemotron-H, Falcon-H1, Zamba2, LFM2 / LFM2.5, StripedHyena 2
- Colonne « ratio » couches linéaires ou SSM : couches softmax (annoncés : 3:1 pour Qwen3-Next et Kimi Linear, 7:1 pour MiniMax, environ 7:1 pour Jamba) ; chiffres à vérifier
- Deux façons de mélanger : couches alternées (Jamba, Qwen3-Next) ou têtes en parallèle dans un bloc (Falcon-H1)
- Zamba2 : blocs d'attention aux poids partagés (lien avec le module 1)
- LFM2 : mélange trouvé par recherche avec le matériel dans la boucle ; StripedHyena 2 : convolutions Hyena + attention
