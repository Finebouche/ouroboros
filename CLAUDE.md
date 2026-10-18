# Écrire les cours d'Ouroboros

Ce dépôt est le site de cours personnel de l'utilisateur (Astro + MDX). La structure du projet, les commandes et les conventions de fichiers sont dans le `README.md` : lis-le d'abord. Ce fichier rassemble ce qu'il faut savoir pour **rédiger** un chapitre comme l'utilisateur l'attend.

## Règles absolues

- **Ne jamais commiter**, pousser ni ouvrir de PR dans ce dépôt sans demande explicite. Modifier les fichiers, laisser l'arbre de travail non commité.
- Tout en **français** : le contenu, les réponses, les commentaires de code.
- L'utilisateur relit et **supprime lui-même** des paragraphes. Ne pas remettre ce qu'il a retiré. Relire le fichier avant chaque modification : il a pu changer depuis.
- **Statut d'un chapitre** = état de l'écriture : `plan`, puis `premier-jet` quand tu viens de le rédiger. `en-relecture` quand l'utilisateur l'a relu et retouché. **Ne jamais mettre `termine`** : seul l'utilisateur pose ce statut.

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
- Un widget seulement si l'interaction apprend quelque chose. Les meilleurs widgets montrent le **mécanisme pas à pas** : boutons « pas suivant / épisode suivant / lecture », calcul chiffré de l'étape en cours, éléments lus et mis à jour mis en évidence, comparaison côte à côte de deux méthodes (ex. `RunWidget`, `ControlWidget`, `CliffWidget`, `ValueIter`).
- **Équations dans les widgets** : composées en KaTeX côté serveur (`katex.renderToString` dans le frontmatter), pas en texte brut. Une ligne de calcul chiffré sous chaque formule.
- Réglages : seulement ceux qui changent la compréhension. Fixer les autres (ex. longueur de phrase) plutôt qu'ajouter un curseur.
- Mise en page : contrôles sur une ligne quand ils tiennent (boutons à gauche, « tout effacer » à droite) ; zone de calcul légèrement teintée pour la séparer du menu ; indicateurs en petites cartes ; notes sous les widgets courtes.
- Chaque widget est autonome : `data-widget` propre, `<style is:global>` préfixé par sa classe. Les styles d'un composant ne sont chargés que sur les pages qui l'utilisent : **ne pas dépendre des styles d'un autre widget**.

## Styles communs (`src/styles/global.css`)

- **Indicateurs** `.kpis` : petites cartes, libellé à gauche, valeur à droite, explication facultative dans un `<i>` en dessous. `.r` (rouge) seulement pour une valeur qui alerte. Pas de vert « positif » (dans Post-Transformer, le vert est K).
- **Curseurs** : tout `<label>` contenant un `<input type="range">` affiche le nom à gauche et la valeur à droite au-dessus du curseur. Un conteneur `.sl` ou `.sliders` les place côte à côte quand il y a la place.
- Disques : leur **aire** code une valeur. Pour une catégorie (en cache, atteignable…), utiliser des cases ou pastilles de même taille. Des mots plutôt que des numéros de position.

## Couleurs

Toujours passer par les variables de `global.css`, jamais un code hexadécimal dans un widget. Vérifier à chaque widget qu'une couleur ne veut dire qu'une seule chose dans le cours.

- **Post-Transformer** : `--c-q` violet, `--c-k` vert, `--c-v` orange réservés à Q, K, V ; `--c-w` bleu pour les poids d'attention (bleu clair `--c-w-soft` pour les lignes déjà faites) ; sortie de la tête (poids × V) en gris `--c-neutral` ; vecteurs des mots en gris `--text-2` ; le reste dans le `README.md`.
- **RL** : `--a-es` vert = Monte-Carlo / retour complet ; `--a-fqi` bleu = Bellman / TD / Q-learning ; `--a-lspi` indigo = SARSA ; ambre `--hl-stroke` = récompense ; rouge `--h-py` = glissade, piège, falaise. Les petits schémas de propagation du crédit (points verts « en un coup », points bleus reliés « un pas à la fois ») sont réutilisés d'un tableau à l'autre.

## Vérifier

- `npm run build` doit finir sur « Complete! ».
- Le serveur de dev tourne souvent déjà sur le port 4321 : naviguer directement vers `http://localhost:4321/<cours>/<fichier>/`.
- Dans le navigateur : vérifier qu'il n'y a pas d'erreur KaTeX (`.katex-error`), mesurer les alignements en JavaScript plutôt qu'à l'œil, faire une capture après avoir fait défiler jusqu'au widget.
- Dire à l'utilisateur ce qui a été vérifié et ce qui ne l'a pas été (rendu mobile, mode sombre, pages non relues).
