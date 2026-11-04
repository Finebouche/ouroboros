---
num: 4
title: "Mémoire et non-linéarité"
summary: "Combien de passé un réservoir retient : capacité mémoire bornée par N, capacité de traitement de l'information, et le compromis entre mémoire et non-linéarité."
status: plan
---

## Au programme

- Capacité mémoire à court terme : reconstruire $u(n-k)$, somme des coefficients de détermination sur $k$, bornée par $N$ pour une entrée i.i.d. et une lecture linéaire
- Courbe de mémoire selon $\rho$ et l'échelle d'entrée
- Capacité de traitement de l'information : fonctions non linéaires du passé (polynômes de Legendre), budget total borné par $N$
- Le compromis mémoire / non-linéarité vu au chapitre 1, quantifié
- Widget : courbe de mémoire et répartition de la capacité par degré

## Sources (vérifiées)

- Dambre, Verstraeten, Schrauwen & Massar, *Information Processing Capacity of Dynamical Systems*, Scientific Reports 2, 2012, DOI 10.1038/srep00514 : capacité totale bornée par le nombre de variables d'état linéairement indépendantes, atteinte avec la mémoire évanescente ; base de produits de polynômes de Legendre pour une entrée uniforme ; compromis non-linéarité / mémoire
- Jaeger, *Short Term Memory in Echo State Networks*, rapport GMD 152, 2002 (https://www.ai.rug.nl/minds/uploads/STMEchoStatesTechRep.pdf, lu par OCR) : définition de MC, somme sur $k \ge 1$ des coefficients de détermination entre $u(n-k)$ et la meilleure lecture linéaire de $(u(n), x(n))$ (définition 1) ; MC ≤ N pour une entrée i.i.d. et une lecture linéaire, deux conditions nécessaires (proposition 2 ; MC = 25,5 > N = 20 avec une entrée corrélée) ; réseau linéaire : MC = N si et seulement si $(W W_{in}, \dots, W^N W_{in})$ est de rang plein (proposition 4)
