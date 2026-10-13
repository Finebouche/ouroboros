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
  content/modules/   un fichier par module (00-bases.mdx, 01-…), contenu en français
  components/widgets/ un composant Astro par visuel interactif (HTML + script + styles)
  layouts/           mise en page commune
  pages/             index (carte de progression) et page de module
  styles/global.css  variables de thème (clair / sombre) et styles communs
```

## Conventions

- Un module = un fichier dans `src/content/modules/`. Le frontmatter donne `num`, `title`, `summary` et `status` (`a-venir`, `en-cours`, `termine`). La carte de progression se met à jour toute seule.
- Un visuel interactif = un composant dans `src/components/widgets/`, importé dans le `.mdx` du module. Chaque widget s'accroche à son propre `data-widget` et n'utilise que les variables de `global.css`.
- Le cours est une fiche de révision personnelle : texte court, pas d'analogies longues, formulations précises.
- Structure d'un concept dans un module : visuel, intuition en 2-3 phrases, équations courtes, encadré `.retain` « À retenir » (3-5 puces), puis encadré `.quiz` pour les questions de vérification. Chaque question est suivie de sa réponse dans un `<Reveal>` (repliée, dépliable d'un clic).
- Maths en LaTeX : `$x$` en ligne, `$$ … $$` en bloc (rendu KaTeX au build).
- Termes techniques en anglais, définis à leur première apparition. Les chiffres venant du rapport de faisabilité et marqués [uncertain] doivent le rester ici.

## Barre latérale d'architecture

Un module peut afficher un schéma collant à gauche en ajoutant `sidebar: transformer` à son frontmatter. Dans le texte, on place des repères invisibles :

```mdx
<ArchMarker parts="attn kv" label="KV cache : K et V gardés en mémoire" />
```

Les `parts` valides sont `head`, `norm-final`, `norm1`, `attn`, `kv`, `add1`, `norm2`, `mlp`, `add2`, `embed`. Le repère actif est le dernier qui a dépassé 40 % de la hauteur de l'écran. Après un changement de schéma de contenu (`content.config.ts`), redémarre le serveur de dev.
