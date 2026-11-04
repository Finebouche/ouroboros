---
num: 3
title: "La propriété d'écho : oublier l'état initial"
summary: "Quand l'état ne dépend plus que de l'entrée : deux trajectoires qui se rejoignent, rayon spectral et plus grande valeur singulière, rôle de l'entrée et du taux de fuite."
status: plan
---

## Au programme

- Définition : deux états initiaux différents, même entrée, les trajectoires se rejoignent (contraction)
- Condition suffisante (plus grande valeur singulière de $W$ < 1) et condition nécessaire pour une entrée nulle (rayon spectral < 1) ; pourquoi l'écart entre les deux
- L'entrée compte : une entrée forte sature tanh et rend l'écho plus facile
- Taux de fuite $\alpha$ : $x(n) = (1-\alpha)\,x(n-1) + \alpha \tanh(\dots)$, intégrateur lent
- Widget : deux réservoirs partis de deux états différents, écart au fil des pas selon $\rho$ et l'échelle d'entrée

## Sources (vérifiées)

- Lukoševičius & Jaeger, *Reservoir computing approaches to recurrent neural network training*, Computer Science Review 3, 2009, DOI 10.1016/j.cosrev.2009.03.005 : condition suffisante $\sigma_{\max}(W) < 1$ (prouvée par Jaeger, 2001) ; pour tanh et une entrée nulle, $\rho(W) > 1$ viole la propriété d'écho ; avec une entrée non nulle, elle peut tenir même si $\rho(W) > 1$ ; neurones à fuite (section 5.5)
