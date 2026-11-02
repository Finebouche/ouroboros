---
num: 7
title: "Pourquoi cela suffit : expressivité"
summary: "Ce qu'un réservoir peut approcher : approximation universelle des filtres à mémoire évanescente, réservoirs comme noyaux, et la version sans réservoir (NG-RC)."
status: plan
---

## Au programme

- Filtres à mémoire évanescente (*fading memory*) et approximation universelle par des réservoirs
- Réservoir de taille infinie = noyau récurrent ; lien avec les méthodes à noyaux
- NG-RC : remplacer le réservoir par des retards et des monômes, lien avec l'autorégression vectorielle non linéaire
- Widget à définir

## Sources (vérifiées)

- Grigoryeva & Ortega, *Echo state networks are universal*, Neural Networks 108, 2018, DOI 10.1016/j.neunet.2018.08.025 : approximation uniforme des filtres à mémoire évanescente en temps discret, entrées bornées
- Hermans & Schrauwen, *Recurrent Kernel Machines: Computing with Infinite Echo State Networks*, Neural Computation 24, 2012, DOI 10.1162/NECO_a_00200 : réservoir de taille infinie vu comme noyau récursif
- Gauthier, Bollt, Griffith & Barbosa, *Next generation reservoir computing*, Nature Communications 12, 2021, DOI 10.1038/s41467-021-25801-2 : équivalence avec l'autorégression vectorielle non linéaire (NVAR), sans matrice aléatoire
