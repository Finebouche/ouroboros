# Écrire les cours d'Ouroboros

Ce dépôt est le site de cours personnel de l'utilisateur (Astro + MDX). La structure du projet, les commandes et les conventions de fichiers sont dans le `README.md` : lis-le d'abord. Ce fichier rassemble ce qu'il faut savoir pour **rédiger** un chapitre comme l'utilisateur l'attend.

## Règles absolues

- **Ne jamais commiter**, pousser ni ouvrir de PR dans ce dépôt sans demande explicite. Modifier les fichiers, laisser l'arbre de travail non commité.
- Tout en **français** : le contenu, les réponses, les commentaires de code.
- L'utilisateur relit et **supprime lui-même** des paragraphes. Ne pas remettre ce qu'il a retiré. Relire le fichier avant chaque modification : il a pu changer depuis.
- **Statut d'un chapitre** = état de l'écriture : `plan`, puis `premier-jet` quand tu viens de le rédiger. `en-relecture` quand l'utilisateur l'a relu et retouché. **Ne jamais mettre `termine`** : seul l'utilisateur pose ce statut.
- Lorsque tu répond à l'utilisateur ou que tu écris un chapitre, ne soit pas verbeux : **aller droit au but**. L'utilisateur n'a pas besoin de phrases de politesse ni d'explications sur ce que tu fais. Il veut un texte clair, concis, précis, exact. Tu peux rester verbeux dans tes notes de travail pour toi-même.

## Le lecteur et le ton

- Le site est une **fiche de révision** : il doit pouvoir le relire vite et tout retrouver. Texte court, précis, condensé. Quand on hésite, couper.
- Pas d'analogie filée, pas de digression de rigueur, pas de méta-commentaire (« la suite se lit comme… », « voici ce que montre la figure »). Pas de justification qui n'aide pas à comprendre.
- **Visuel d'abord**, puis les étapes, puis le « pourquoi ».
- Ne pas supposer de bases : si une notion n'est pas acquise (ex. Bellman), partir de zéro.
- Termes officiels (en anglais entre parenthèses à la première apparition). Quand un nom de famille ou de catégorie est une invention de ta part, le dire à l'utilisateur.
- Éviter les doublons entre le texte, la légende d'une figure et la note d'un widget : chaque information à un seul endroit.

## Notations, renvois et vérifications

- **Notations** : respecter celles du cours (Post-Transformer : tableau « Notations du cours » au début du chapitre 0 ; $s$ longueur, $L$ couches, $T$ passes en profondeur, $W$ fenêtre, $W_h$ et $W_x$ pour un RNN). Ne pas réutiliser un symbole avec un autre sens.
- **Renvois** : « chapitre N, section M » se vérifie à chaque réorganisation (numéros et titres). Les liens entre cours sont en Markdown : `[HPC, chapitre 3](/hpc/03-transformations/)`.
- **Points non vérifiés** : les noter dans `A_VERIFIER.md` (racine du dépôt), et les retirer quand ils sont vérifiés.

## Structure d'un chapitre

- Sections numérotées. Pour chaque notion : visuel → intuition (2-3 phrases) → équations courtes.
- Fin de chapitre : encadré `<div class="retain">` « À retenir » (3-5 puces), `<Refs>`, puis `<Quiz>` avec une `<Reveal>` par question. Les questions portent sur les mécanismes vus dans les widgets.
- Une notion difficile se présente par **exemples** concrets (un algorithme, un cas chiffré) plutôt que par une définition abstraite.
- Les tableaux de comparaison se font en composant stylé (bandes arrondies, en-têtes colorés, petits schémas), sur le modèle de `McBellman.astro`, `Evaluation.astro`, `Families.astro` (RL, chapitre 1), plutôt qu'en tableau Markdown brut.

## Exactitude

- **Simuler avant d'affirmer** : tout comportement décrit d'un widget (« Q-learning trouve le plus court chemin, SARSA le chemin sûr ») est vérifié par une simulation (Node, dans le dossier scratchpad) avant d'être écrit, et formulé « avec ces réglages ».
- **Références** : uniquement des identifiants vérifiés (arXiv, DOI `10.…`, ou URL complète), en contrôlant titre, auteurs et année. Ne jamais inventer un résultat chiffré ni une source.
- Marquer clairement ce qui est incertain, dans le texte ou dans la réponse à l'utilisateur.
- Un widget n'affiche pas de faux résultats : s'il n'y a pas de vrai modèle, montrer une cible, ou une prédiction calculée par un modèle non entraîné, et le dire. Jamais une « prédiction » qui tombe juste à tous les coups.

## Figures et widgets

- **La figure s'adapte au problème** : boucle, arbre, grille, couloir, courbe, petites figures répétées. Ne pas tout dessiner en produits de matrices.
- Un widget seulement si l'interaction apprend quelque chose. Les meilleurs widgets montrent le **mécanisme pas à pas** : boutons « pas suivant / épisode suivant / lecture », calcul chiffré de l'étape en cours, éléments lus et mis à jour mis en évidence, comparaison côte à côte de deux méthodes (ex. `RunWidget`, `ControlWidget`, `CliffWidget`). Quand l'utilisateur n'aime pas l'animation, préférer des **boutons** (un par étape, pas de curseur continu pour des étapes discrètes) qui affichent des états précalculés, sans lecture automatique : `ValueIter` (RL, chapitre 1 : boutons γ et itération, une grille, une croix de quatre valeurs par case).
- **Équations dans les widgets** : composées en KaTeX côté serveur (`katex.renderToString` dans le frontmatter), pas en texte brut. Une ligne de calcul chiffré sous chaque formule.
- Réglages : seulement ceux qui changent la compréhension. Fixer les autres (ex. longueur de phrase) plutôt qu'ajouter un curseur.
- Mise en page : contrôles sur une ligne quand ils tiennent (boutons à gauche, « tout effacer » à droite) ; zone de calcul légèrement teintée pour la séparer du menu ; indicateurs en petites cartes ; notes sous les widgets courtes.
- Chaque widget est autonome : `data-widget` propre, `<style is:global>` préfixé par sa classe. Les styles d'un composant ne sont chargés que sur les pages qui l'utilisent : **ne pas dépendre des styles d'un autre widget**.

## Principes de design (validés le 21 octobre 2026)

- **Une couleur = un sens par cours**, fixé dans la section « Couleurs » ci-dessous (et montré dans `/labo/`). Pas de limite de nombre, mais jamais deux sens pour une couleur.
- **Gris par défaut, couleur pour ce qu'on doit regarder.** On insiste par le poids, le trait (plein ou pointillé), la taille, pas par une couleur de plus.
- **Même chose = même apparence partout** : une action est toujours violette en RL, une récompense toujours ambre, etc.
- **Compacité** : un widget est un seul bloc blanc ; pas de carte dans une carte, pas de teintes par rôle.
- **Un widget = une question** : un titre qui la dit (dans l'en-tête de la carte du graphique), une seule chose qui bouge à la fois.
- **Graphique** : au plus deux séries colorées, les autres en gris ou en pointillé ; **étiquettes directes** au bout des courbes (marge à droite, étiquettes écartées d'au moins 15 px) ou rangée d'étiquettes colorées au-dessus du tracé, **pas de légende séparée** pour des séries. Une légende reste admise pour la signification de couleurs de cases ou de blocs (HPC, Post-Transformer).
- **Échelle de texte** : titre de widget 15 px, texte 13, légende et note 12,5, étiquettes de graphique 11 à 11,5.
- Modèle : `rl/04-approximation/FitWidget.astro` (titre et écart en pastille dans l'en-tête, une seule série colorée, étiquettes directes). L'ancienne version est archivée dans `components/labo/FitWidgetAvant.astro`.

## Styles communs (`src/styles/global.css`)

- **Indicateurs** `.kpis` : petites cartes, libellé à gauche, valeur à droite, explication facultative dans un `<i>` en dessous. `.r` (rouge) seulement pour une valeur qui alerte. Pas de vert « positif » (dans Post-Transformer, le vert est K).
- **Curseurs** : tout `<label>` contenant un `<input type="range">` affiche le nom à gauche et la valeur à droite au-dessus du curseur. Un conteneur `.sl` ou `.sliders` les place côte à côte quand il y a la place.
  Style (essai « Segments », validé le 21 octobre 2026) : valeur continue = piste en 24 segments au plus (moins si le curseur est étroit) et barrette ; valeur discrète (entre 2 et 20 pas entre le minimum et le maximum, quel que soit le pas) = barre à points et rond creux. Le choix est automatique (script de `Base.astro`, qui pose `--pf`, `--segs`, `--dots` et `data-discrete`) : ne pas styler un curseur à la main. Tout style de curseur s'écrit pour Chrome/Safari (`::-webkit-slider-*`) **et** Firefox (`::-moz-range-*`), en deux règles séparées.
- **Widgets** : une seule carte blanche à bordure, compacte, qui forme un élément lié de l'interface (contrôles en haut sur une ligne, puis le contenu, puis la note) ; indicateurs `.kpis` en petites cartes. **Pas** de bande teintée, de boîte grise de contrôles ni de cartes imbriquées : essayé le 21 octobre 2026 et écarté (on ne comprenait plus l'organisation). Marges et légendes communes aux figures et widgets (1,5 rem, 12,5 px). Boutons avec un léger relief.
- **Labo** : page `/labo/` (`src/pages/labo.astro`), non liée depuis le site, pour essayer un style avant de l'appliquer. Une section par essai, avec le statut (retenu ou écarté) ; **garder les variantes écartées** comme bibliothèque de référence.
- Disques : leur **aire** code une valeur. Pour une catégorie (en cache, atteignable…), utiliser des cases ou pastilles de même taille. Des mots plutôt que des numéros de position.

## Couleurs

Toujours passer par les variables de `global.css`, jamais un code hexadécimal dans un widget. Vérifier à chaque widget qu'une couleur ne veut dire qu'une seule chose dans le cours.

- **Post-Transformer** : `--c-q` violet, `--c-k` vert, `--c-v` orange réservés à Q, K, V ; `--c-w` bleu pour les poids d'attention (bleu clair `--c-w-soft` pour les lignes déjà faites) ; sortie de la tête (poids × V) en gris `--c-neutral` ; vecteurs des mots en gris `--text-2` ; le reste dans le `README.md`.
- **HPC** : une opération (un bloc nommé : `mul`, `GEMM`…) prend la couleur de ce qui la limite : `--h-calc` bleu (calcul) ou `--h-mem` vert d'eau (mémoire), palette Okabe-Ito lisible par les daltoniens. Le surcoût (appel Python, dispatch, lancement de noyau, compilation) n'a pas de couleur : il est hachuré en gris (`hatchDef`, `overBlock` dans `hpc/hw.ts`). Style : teinte claire et contour (`opBlock`), plein seulement pour l'élément actif. Pâle : calculé puis perdu. NumPy et JAX : gris / noir et une étiquette. `--h-py` reste le rouge générique (alerte, piège).
- **Reservoir computing** : `--r-res` bleu-vert = états du réservoir ; `--r-out` violet = lecture entraînée et sa sortie ; entrée en gris `--text-2` ; cible en pointillés `--text`. Ce qui est tiré au hasard et figé est dessiné en gris pointillé, ce qui est entraîné en `--r-out`.
- **RL** : `--a-es` vert = Monte-Carlo / retour complet ; `--a-fqi` bleu = Bellman / TD / Q-learning ; `--a-lspi` indigo = SARSA ; ambre `--hl-stroke` = récompense ; violet `--a-act` = action ; itération de valeur (calcul avec P, sans agent ni échantillon) : neutre, gris `--text-2` ; rouge `--h-py` = glissade, piège, falaise. Chapitre 3 (exploration), couleurs propres aux stratégies : glouton gris `--c-neutral`, ε-greedy olive `--a-bc`, softmax bleu-vert `--a-fqi`, optimiste rose `--a-ppo`, UCB indigo `--a-lspi` (définies dans `03-exploration/bandit.ts`). Les petits schémas de propagation du crédit (points verts « en un coup », points bleus reliés « un pas à la fois ») sont réutilisés d'un tableau à l'autre.

## Vérifier

- `npm run build` doit finir sur « Complete! ».
- Le serveur de dev tourne souvent déjà sur le port 4321 : naviguer directement vers `http://localhost:4321/<cours>/<fichier>/`.
- Dans le navigateur : vérifier qu'il n'y a pas d'erreur KaTeX (`.katex-error`), mesurer les alignements en JavaScript plutôt qu'à l'œil, faire une capture après avoir fait défiler jusqu'au widget.
- Dire à l'utilisateur ce qui a été vérifié et ce qui ne l'a pas été (rendu mobile, mode sombre, pages non relues).
