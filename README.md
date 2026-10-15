# Ouroboros (site Astro)

Site personnel de cours : des fiches de révision visuelles. Il héberge plusieurs cours :

| Cours | Dossier | Unité | Contenu |
|---|---|---|---|
| Transformers | `transformers` | Module | transformers et architectures récurrentes : récurrence en profondeur, dans le temps, leur couplage (projet de recherche Ouroboros) |
| Preprocessing | `preprocessing` | Chapitre | prétraitement des données ; chapitre 1 : MFCC |
| HPC | `hpc` | Chapitre | calcul haute performance : matériel et roofline, NumPy contre JAX, transformations, sharding, étude de cas `run_batched` |

## Lancer

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # génère dist/
```

URLs : `/` (liste des cours), `/<cours>/` (carte de progression), `/<cours>/<fichier>/` (un module ou chapitre).

## Structure

```
src/
  content/chapters/<cours>/    un fichier par module ou chapitre (transformers/00-bases.mdx, preprocessing/01-mfcc.md…), contenu en français
  components/
    shared/                    composants communs à tous les cours : Quiz, Reveal, Refs
    transformers/              composants propres au cours Transformers : ArchSidebar, ArchMarker, DotLegend, ReachCone
      00-bases/                widgets du module 0 (+ qkvData.ts, données partagées par ces widgets)
      01-recurrence-profondeur/  widgets du module 1
    preprocessing/
      01-mfcc/                 widgets du chapitre MFCC
    hpc/                       Legend (code couleur du type de travail), hw.ts (matériel de référence), widgets par chapitre
  lib/courses.ts               liste des cours (titre, unité, présentation) et fonctions de lecture de la collection
  layouts/Base.astro           mise en page commune (en-tête : Cours / <cours>)
  pages/                       index (liste des cours), [course]/index (carte de progression), [course]/[...slug] (page d'un module)
  styles/global.css            variables de thème (clair / sombre), palette des données, styles communs
```

Les imports dans les `.mdx` utilisent l'alias `@/` (= `src/`) : `import Quiz from '@/components/shared/Quiz.astro';`.

## Ajouter un cours

1. Ajouter une entrée dans `COURSES` (`src/lib/courses.ts`) : la clé est le nom du dossier.
2. Créer `src/content/chapters/<cours>/` et `src/components/<cours>/`.
3. Si le cours a besoin d'un schéma collant à gauche (comme `ArchSidebar`), le placer dans `src/components/<cours>/` et étendre l'enum `sidebar` de `src/content.config.ts` ; sinon ne rien mettre.
4. Redémarrer le serveur de dev (`npx astro dev stop; rm -rf .astro; npm run dev`) après un changement de `content.config.ts`.

## Conventions

- Un module ou chapitre = un fichier dans `src/content/chapters/<cours>/`. Le frontmatter donne `num`, `title`, `summary` et `status` (`a-venir`, `en-cours`, `termine`). `num` est propre à chaque cours. La carte de progression du cours se met à jour toute seule.
- Un visuel interactif = un composant dans `src/components/<cours>/<module>/`, importé dans le `.mdx` du module ; ce qui sert à plusieurs modules du même cours va dans `src/components/<cours>/`, et ce qui sert à plusieurs cours dans `src/components/shared/`. Chaque widget s'accroche à son propre `data-widget` et n'utilise que les variables de `global.css`.
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

## Couleurs des données (cours Transformers)

Toujours passer par les variables de `global.css`, jamais par un code hexadécimal dans un widget :

- `--c-q` violet, `--c-k` vert, `--c-v` orange : réservés à Q, K, V (et à ce qui sort directement de V, comme poids × V).
- `--c-w` bleu profond (et `--c-w-soft`) : poids d'attention, softmax(S masqué).
- `--c-cache-*` : K et V gardés en cache.
- `--c-h1` à `--c-h4` : les têtes du multi-têtes, quatre nuances du bleu des poids.
- `--c-model-classic` gris et `--c-model-loop` brun : modèle classique contre modèle bouclé (module 1).
- `--c-reach` gris chaud (et `--c-reach-target` encre) : portée (cône de dépendance).
- `--hl-*` ambre : ligne ou mot en cours ; `--accent` bleu foncé : sélection et contours d'interface ; gris : matrices neutres (E, X, S, W).
