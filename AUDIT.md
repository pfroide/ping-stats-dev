# Audit Technique — ping-stats-dev

> Date : 2026-03-08
> Branche : `claude/french-audit-7gI3X`

---

## 1. Architecture et structure

Le projet est une **application web statique de type Progressive Web App (PWA)** dédiée à la visualisation de statistiques de tennis de table pour un club français (licence FFTT 8940866).

```
ping-stats-dev/
├── index.html              # Application monolithique (~10 MB, 7 273 lignes)
├── assets/
│   ├── graphs_bundle.js    # Bundle graphiques interactifs (113 KB)
│   ├── bg.png              # Image de fond (2,1 MB)
│   └── ...                 # Images pré-générées (blocs, cartes, scoreboards, podiums)
├── data/
│   ├── club.json           # Statistiques globales du club
│   ├── manifest.json       # Métadonnées d'API
│   └── players/            # ~70 fichiers JSON (statistiques par joueur)
├── images_joueurs/         # 36 photos de profil joueurs
├── service-worker.js       # Service Worker PWA
├── manifest.webmanifest    # Manifest d'installation
├── site_data.json          # Métadonnées du site
└── build_meta.json         # Métadonnées de build
```

**Taille totale estimée :** ~600 MB (majoritairement composée d'images pré-générées).

---

## 2. Technologies utilisées

| Domaine | Technologie |
|---|---|
| Markup | HTML5 sémantique |
| Style | CSS3 (variables, flexbox, grid, backdrop-filter, media queries) |
| Logique | JavaScript vanilla (pas de framework) |
| PWA | Service Worker + Web App Manifest |
| Persistance locale | `localStorage` |
| Graphiques | `graphs_bundle.js` (bundle custom, probablement Chart.js/Plotly) |
| Données | JSON statique (aucune API backend) |

---

## 3. Fonctionnalités principales

1. **Onglet Mensuel** — Podiums HTML et images PNG pré-générées (performances, progressions, table, jeunes).
2. **Onglet Blocs** — Tableaux de statistiques segmentés par phase et période temporelle.
3. **Onglet Scoreboards** — Tableaux de résultats détaillés par phase et par joueur.
4. **Onglet Duels** — Graphiques radar interactifs (taux victoire, perfs, force, anti-contres, clutch, dominance).

Interactions transverses : recherche avec autocomplete, tri multi-colonnes, sélection de colonnes, modales image (zoom), modales profil joueur, persistance des préférences via `localStorage`.

---

## 4. Problèmes de sécurité

### 🔴 CRITIQUE — Bug XSS : fonction `esc()` non définie

```javascript
// Ligne ~7186
btn.innerHTML = `<div>${esc(it.key)}</div>`;
```

La fonction `esc()` est appelée mais n'existe **pas** dans le scope. Seule `escHtml()` est définie (ligne ~7041). À l'exécution, cela provoque une `ReferenceError` qui plante l'autocomplete.

**Correction immédiate :**
```javascript
btn.innerHTML = `<div>${escHtml(it.key)}</div>`;
```

### 🟡 MOYEN — Injection innerHTML via `playerData`

```javascript
// Ligne ~7113
pBody.innerHTML = playerData[key] || '';
```

Le contenu de `playerData` est injecté sans échappement explicite. Bien que les données soient locales (JSON statique), si elles venaient à être compromises ou générées dynamiquement, un XSS serait possible. Préférer `textContent` ou appliquer `escHtml()`.

### 🟡 MOYEN — Données personnelles publiques

`site_data.json` expose les noms complets et numéros de licence FFTT de 70 joueurs en clair. Si le site est public, cela soulève une question de conformité RGPD.

### 🟡 MOYEN — Placeholder non substitué dans le Service Worker

```javascript
const CACHE_VERSION = "__CACHE_VERSION__";
```

La valeur `__CACHE_VERSION__` n'est pas remplacée lors du build, ce qui empêche toute invalidation correcte du cache.

### 🟢 BAS — Absence de Content Security Policy (CSP)

Aucun en-tête CSP n'est visible. Sur un hébergement statique sans contrôle serveur, ajouter une balise `<meta http-equiv="Content-Security-Policy" ...>` limiterait la surface d'attaque.

---

## 5. Qualité du code

### Bonnes pratiques observées

- Utilisation de `data-*` attributes pour les requêtes DOM (robuste aux refactorings).
- `textContent` privilégié sur `innerHTML` pour les contenus texte bruts.
- Event delegation via `addEventListener` sur `document`.
- IIFE pour l'isolation du scope global.
- `try/catch` autour des accès `localStorage`.
- Lazy loading natif (`loading="lazy"`) sur les images joueurs.
- Fallback visuel (initiales) en cas d'erreur de chargement de photo (`onerror`).
- Design system CSS cohérent (variables, tokens de couleur).

### Mauvaises pratiques

| Sévérité | Problème |
|---|---|
| 🔴 | Fichier monolithique de 10 MB / 7 273 lignes : ingérable, impropre au versionning |
| 🔴 | Appel à `esc()` non définie → crash runtime |
| 🟡 | Aucune minification (CSS, JS, HTML) |
| 🟡 | Magic strings omniprésentes (noms de phases, segments, clés JSON en dur) |
| 🟡 | Mélange de langues dans le code (variables en anglais, commentaires en français) |
| 🟡 | Duplication de logique (tri de tableaux, normalisation de noms, etc.) |
| 🟢 | Pas de module system (tout dans un IIFE global) |
| 🟢 | Pas de validation de schéma JSON |
| 🟢 | README vide |
| 🟢 | Chemins Windows (`C:\Users\tonyc\...`) dans certains JSON de métadonnées |

---

## 6. Performance

### Problèmes identifiés

| Problème | Impact estimé |
|---|---|
| HTML de 10 MB à parser au démarrage | LCP > 3-5 s sur mobile |
| `bg.png` non compressée (2,1 MB) | Bande passante inutile |
| `playerData` JSON injecté en script inline synchrone | Blocage du thread principal |
| Pas de code splitting | Toute l'application chargée au démarrage |
| Images pré-générées redondantes (scoreboards) | Stockage cache excessif |

### Points positifs

- PWA avec stratégie de cache bien pensée (network-first pour la navigation, cache-first pour les assets).
- Aucune requête réseau dynamique après la première installation → offline complet.
- Lazy loading sur les images de profil.
- `localStorage` pour la persistance des préférences sans round-trip serveur.

---

## 7. Accessibilité

### Problèmes

| Priorité | Problème |
|---|---|
| 🔴 | Modales (`#imgModal`, `#playerModal`) sans `role="dialog"` ni `aria-modal="true"` |
| 🔴 | Pas de gestion du focus dans les modales (clavier non piégé) |
| 🟡 | Attributs `alt` des images non descriptifs (noms techniques) |
| 🟡 | `<th>` de tableaux sans attribut `scope` |
| 🟡 | Information transmise uniquement par la couleur (good/mid/bad) |
| 🟡 | Pas de skip links pour la navigation au clavier |
| 🟢 | Autocomplete partiellement ARIA (`aria-selected` présent mais incomplet) |

### Points positifs

- Structure HTML sémantique (header, main, sections).
- Design responsive adapté au mobile.
- Utilisation de `textContent` (compatible lecteurs d'écran).
- Taille de texte fluide avec `clamp()`.

---

## 8. Résumé exécutif

| Dimension | Note |
|---|---|
| Fonctionnalités | ✅ Riche et complet |
| Architecture | ⚠️ Monolithe difficilement maintenable |
| Sécurité | 🔴 Bug critique (esc non définie) + données personnelles exposées |
| Performance | ⚠️ Fichier massif, assets non optimisés |
| Accessibilité | ⚠️ Modales non conformes WCAG |
| Qualité du code | ⚠️ Duplication, magic strings, pas de documentation |

---

## 9. Recommandations par priorité

### Priorité 1 — Immédiat (correctifs bloquants)

1. **Corriger `esc()` → `escHtml()`** partout dans le code.
2. **Remplacer le placeholder `__CACHE_VERSION__`** dans le Service Worker lors du build.
3. **Vérifier les injections `innerHTML`** avec `playerData` et appliquer `escHtml()` ou `textContent`.

### Priorité 2 — Court terme (qualité)

4. Ajouter `role="dialog"`, `aria-modal="true"` et gestion du focus sur les modales.
5. Compresser `bg.png` (format WebP, qualité 80 % → gain ~80 %).
6. Minifier le HTML, CSS inline et JS inline (gain ~30-50 % sur la taille).
7. Remplacer les magic strings par des constantes nommées.

### Priorité 3 — Moyen terme (architecture)

8. Découper le monolithe HTML en fichiers JS/CSS séparés et bundlés.
9. Mettre en place un pipeline de build (Vite, esbuild ou équivalent).
10. Documenter le process de génération des données (`build_meta.json`, scripts de génération).
11. Évaluer la conformité RGPD pour les données personnelles des joueurs.

### Priorité 4 — Long terme (excellence)

12. Ajouter des attributs ARIA complets sur les tableaux et l'autocomplete.
13. Implémenter une Content Security Policy.
14. Mettre en place des tests automatisés (a11y, snapshot, performance).
