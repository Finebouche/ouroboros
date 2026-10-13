---
num: 1
title: "Récurrence en profondeur"
summary: "Looped transformers : un bloc partagé bouclé T fois, input injection, test-time compute."
status: a-venir
---

## Au programme

- Partager les poids d'un bloc et le boucler T fois (Universal Transformer, ALBERT, Huginn, Ouro, Parcae)
- Input injection : réinjecter l'embedding à chaque passe
- FLOPs contre paramètres, avec curseurs couches / T
- Champ réceptif d'une boucle sur fenêtre : T·W
- T aléatoire, T variable au test, arrêt adaptatif (ACT, MoR)
- Instabilités : effondrement des états, backprop tronqué
