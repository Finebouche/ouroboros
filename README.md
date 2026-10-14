# Ouroboros, le cours

Site (Astro) qui accompagne le cours sur les architectures de langage récurrentes : récurrence en profondeur, récurrence dans le temps, et leur couplage dans Ouroboros.

## Lancer

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # génère dist/
```

## Structure

```
src/
  content/modules/          un fichier par module (00-bases.mdx, 01-…), contenu en français
  components/
    shared/                 composants communs : ArchSidebar (schéma de gauche), ArchMarker, Quiz, Reveal, DotLegend
    modules/00-bases/       widgets du module 0 (+ qkvData.ts, données partagées par ces widgets)
    modules/01-recurrence-profondeur/  widgets du module 1
  layouts/                  mise en page commune
  pages/                    index (carte de progression) et page de module
  styles/global.css         variables de thème (clair / sombre), palette des données, styles communs
```

## Conventions

- Un module = un fichier dans `src/content/modules/`. Le frontmatter donne `num`, `title`, `summary` et `status` (`a-venir`, `en-cours`, `termine`). La carte de progression se met à jour toute seule.
- Un visuel interactif = un composant dans `src/components/modules/<module>/`, importé dans le `.mdx` du module ; ce qui sert à plusieurs modules va dans `src/components/shared/`. Chaque widget s'accroche à son propre `data-widget` et n'utilise que les variables de `global.css`.
- Le cours est une fiche de révision personnelle : texte court, pas d'analogies longues, formulations précises.
- Structure d'un concept dans un module : visuel, intuition en 2-3 phrases, équations courtes, encadré `.retain` « À retenir » (3-5 puces), puis les questions de vérification. Les questions vont dans un `<Quiz>` (replié par défaut) ; chaque question est suivie de sa réponse dans un `<Reveal>` (floutée, nette d'un clic).
- Articles : `<Refs items={[[titre, auteurs, année, id arXiv], …]} />` après l'encadré « À retenir » de chaque partie. Vérifier chaque identifiant sur arXiv (titre, auteur, année) avant de l'ajouter.
- Maths en LaTeX : `$x$` en ligne, `$$ … $$` en bloc (rendu KaTeX au build).
- Termes techniques en anglais, définis à leur première apparition. Les chiffres venant du rapport de faisabilité et marqués [uncertain] doivent le rester ici.

## Barre latérale d'architecture

Un module peut afficher un schéma collant à gauche en ajoutant `sidebar: transformer` à son frontmatter. Dans le texte, on place des repères invisibles :

```mdx
<ArchMarker parts="attn kv" label="KV cache : K et V gardés en mémoire" />
```

Les `parts` valides sont `head`, `norm-final`, `norm1`, `qkv`, `attn`, `wo`, `kv`, `add1`, `norm2`, `mlp`, `add2`, `embed`. Une boîte du schéma peut porter plusieurs parties (`data-part="qkv kv"`). Le repère actif est le dernier qui a dépassé 40 % de la hauteur de l'écran. Après un changement de schéma de contenu (`content.config.ts`), redémarre le serveur de dev.

## Couleurs des données

Toujours passer par les variables de `global.css`, jamais par un code hexadécimal dans un widget :

- `--c-q` violet, `--c-k` vert, `--c-v` orange : réservés à Q, K, V (et à ce qui sort directement de V, comme poids × V).
- `--c-w` bleu profond (et `--c-w-soft`) : poids d'attention, softmax(S masqué).
- `--c-cache-*` : K et V gardés en cache.
- `--c-h1` à `--c-h4` : les têtes du multi-têtes, quatre nuances du bleu des poids.
- `--c-model-classic` gris et `--c-model-loop` brun : modèle classique contre modèle bouclé (module 1).
- `--c-reach` gris chaud (et `--c-reach-target` encre) : portée (cône de dépendance).
- `--hl-*` ambre : ligne ou mot en cours ; `--accent` bleu foncé : sélection et contours d'interface ; gris : matrices neutres (E, X, S, W).
