# Canvas Forge SVG Asset Library

**Version:** 3.1
**Status:** READY FOR DESIGN HANDOFF
**Last Updated:** 2026-02-09
**Related:** [Canvas Engine Spec](../03-SIGNATURE-ENGINES/03-CANVAS.md)

---

## Overview

Canvas Forge uses SVG assets across its 13 worksheet generators for tracing, recognition, matching, counting, sorting, labeling, cutting, dot-connect, hidden-picture, and decorative/thematic purposes. This document defines every SVG asset category, naming convention, format spec, and per-generator inventory so a designer can produce the full library.

**Target Scale:** 4,000–6,000+ unique SVGs to ensure high variety across generators, themes, and age groups.

**Primary Age Target:** Ages 2–5 (toddler through pre-K). The library is optimized for early childhood with dedicated packs for pre-writing motor skills, phonics vocabulary, social-emotional learning, inclusive character representation, and interactive manipulatives that transform worksheets into mini activity books.

---

## Designer Quick Start

> Start here. The full spec follows below — this section gets you producing assets immediately.

| Item             | Details                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Tools**        | Figma, Illustrator, or Inkscape — your choice                                                                          |
| **Deliverable**  | SVG 1.1 only (no raster, no JS). One file per asset                                                                    |
| **Naming**       | `{category}/{subcategory}/{slug}--{variant}.svg`                                                                       |
| **ViewBox**      | Required (`0 0 200 200` icons, `0 0 800 200` letter tracing) — no fixed width/height                                   |
| **Stroke rules** | Toddler = 3–4% of canvas width (6px on 200px ViewBox), Preschool = ~2%, Pre-K = ~1%. Use `<path>` (not `<line>`). See Section 21 for full stroke width guide |
| **Colors**       | Use CSS custom properties (`var(--forge-primary)`, etc.) or solid fills                                                |
| **Text**         | `<text>` only in answer-key variants. Use `Inter` / `Noto Sans` / `sans-serif`. Convert decorative text to outlines    |
| **File size**    | Prefer < 15KB for clipart, max 50KB                                                                                    |
| **First batch**  | **Tier 0** — pre-writing strokes (89), alphabet picture vocab A–Z (234), Ember mascot (17), worksheet guides (20), speech bubbles (14) = ~374 SVGs |

### Definition of Done (per batch)

Every SVG delivery must pass this checklist before acceptance:

- [ ] `viewBox` set, no fixed `width`/`height`
- [ ] No `<image>`, no `<script>` tags
- [ ] File size within guideline (< 15KB clipart, < 50KB max)
- [ ] Correct naming convention + variant suffix
- [ ] Stroke width meets minimum for target age group
- [ ] All internal IDs prefixed with filename slug
- [ ] `<title>` and `<desc>` elements present
- [ ] Exported optimized (SVGO or equivalent)
- [ ] Tested at "small" (thumbnail) and "large" (full worksheet) placements for print legibility
- [ ] Inclusive representation guidelines followed (skin tones, abilities, gender balance)

---

## SVG Technical Specifications

### Format Requirements

| Property               | Requirement                                                                                                                                                                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Format**             | SVG 1.1 (XML-based)                                                                                                                                                                                                                                   |
| **ViewBox**            | Required on every file (no fixed width/height)                                                                                                                                                                                                        |
| **Default ViewBox**    | `0 0 200 200` for icons/clipart; `0 0 800 200` for letter tracing paths                                                                                                                                                                               |
| **Colors**             | Use CSS custom properties (`var(--forge-primary)`, `var(--forge-secondary)`) OR solid fills that the renderer can recolor via class injection                                                                                                         |
| **Stroke**             | Prefer `<path>` always; `<line>` allowed ONLY for leader lines in labeling diagrams (or will be auto-converted in build step). Use `vector-effect="non-scaling-stroke"` on all stroked elements to prevent stroke width from scaling with the SVG viewBox (a 6px stroke at icon size should not become 24px at full-page size) |
| **No embedded raster** | No `<image>` tags with base64-encoded bitmaps                                                                                                                                                                                                         |
| **No JS**              | No `<script>` tags                                                                                                                                                                                                                                    |
| **Complexity**         | Max 50KB per file; prefer < 15KB for clipart                                                                                                                                                                                                          |
| **Accessibility**      | Include `<title>` and `<desc>` elements                                                                                                                                                                                                               |
| **ID prefix**          | All internal IDs prefixed with filename slug to avoid collisions when composited                                                                                                                                                                      |
| **Text elements**      | `<text>` allowed ONLY in answer-key variants (labeling diagrams, mystery reveal). Use font-family `"Inter", "Noto Sans", sans-serif` only. Convert decorative text to `<path>` outlines. The Forge renderer embeds these fonts at PDF generation time |

### Naming Convention

```
{category}/{subcategory}/{slug}--{variant}.svg
```

Examples:

```
animals/farm/cow--happy.svg
animals/farm/cow--sleeping.svg
animals/ocean/dolphin--jumping.svg
letters/uppercase/A--block.svg
letters/uppercase/A--trace-path.svg
numbers/digit/3--dotted.svg
themes/ocean/coral-reef--scene.svg
festivals/diwali/diya-lamp--lit.svg

# Age 2–5 Enhancement Packs
prewriting/strokes/zigzag--trace-path.svg
prewriting/roads/bee-to-flower--trace-path.svg
phonics/en/B-ball--simple.svg
phonics/en/B-bee--outline.svg
color-safe/balloon--red.svg
color-safe/balloon--outline.svg
routines/daily/brush-teeth--simple.svg
routines/social/sharing-toys--simple.svg
characters/children/child-b--waving.svg
characters/ember/ember--thinking.svg
characters/worksheet-guides/starry--peeking.svg
micro-scenes/banners/cloud-sun-sky--simple.svg
micro-scenes/grounds/grass-flowers--outline.svg
manipulatives/cards/card-front--2x3-grid.svg
manipulatives/sorting-mats/two-column--farm.svg
wow-packs/build-a-character/robot-head--style-2.svg
wow-packs/mystery-reveal/dinosaur--segmented.svg
```

### Variant Suffixes

| Suffix                           | Purpose                                              |
| -------------------------------- | ---------------------------------------------------- |
| `--outline`                      | Stroke-only, no fill (coloring, tracing)             |
| `--filled`                       | Full color illustration                              |
| `--happy`, `--sad`, `--sleeping` | Emotion/state variants                               |
| `--simple`                       | Low-detail for toddlers                              |
| `--detailed`                     | Higher detail for pre-K / school-age                 |
| `--trace-path`                   | Dotted/dashed stroke path for tracing worksheets     |
| `--scene`                        | Full scene composition (backgrounds, hidden-picture) |
| `--silhouette`                   | Black filled shape (recognition, shadow matching)    |
| `--dotted`                       | Dot-to-dot outline with numbered anchor points       |
| `--cut-guide`                    | Dashed cut lines for cutting worksheets              |
| `--labeled`                      | With label anchor points for labeling worksheets     |

### Color Palette (Theme-Agnostic Base)

Designers should deliver assets using these replaceable CSS variables:

```css
--forge-primary: #4f46e5; /* Main illustration color */
--forge-secondary: #10b981; /* Accent color */
--forge-outline: #1f2937; /* Stroke/outline color */
--forge-background: #f9fafb; /* Background fill */
--forge-highlight: #f59e0b; /* Highlight/attention color */
```

The renderer swaps these per-theme at render time.

---

## Asset Categories

### 1. Alphabet & Letter Tracing

**Used by:** Tracing, Recognition, Matching, Fill-in-Blank

**Total target: ~500 SVGs**

#### 1.1 Uppercase Latin Letters (A–Z)

| Asset           | Variants Needed                                        | Count |
| --------------- | ------------------------------------------------------ | ----- |
| Each letter A–Z | `--block`, `--trace-path`, `--outline`, `--bubble`     | 104   |
| Each letter A–Z | `--trace-path-arrows` (with directional stroke arrows) | 26    |

#### 1.2 Lowercase Latin Letters (a–z)

| Asset           | Variants Needed                                    | Count |
| --------------- | -------------------------------------------------- | ----- |
| Each letter a–z | `--block`, `--trace-path`, `--outline`, `--bubble` | 104   |
| Each letter a–z | `--trace-path-arrows`                              | 26    |

#### 1.3 Spanish Accent Characters

| Asset                           | Variants Needed           | Count |
| ------------------------------- | ------------------------- | ----- |
| `a`, `e`, `i`, `o`, `u` (acute) | `--trace-path`, `--block` | 10    |
| `n` (tilde)                     | `--trace-path`, `--block` | 2     |
| `u` (dieresis)                  | `--trace-path`, `--block` | 2     |

#### 1.4 French Accent Characters

| Asset                                | Variants Needed           | Count |
| ------------------------------------ | ------------------------- | ----- |
| `e` (acute, grave, circumflex)       | `--trace-path`, `--block` | 6     |
| `a`, `i`, `o`, `u` (various accents) | `--trace-path`, `--block` | 16    |
| `c` (cedilla)                        | `--trace-path`, `--block` | 2     |

#### 1.5 Chinese Characters (Simplified, Basic Set)

| Asset                              | Variants Needed                                                     | Count |
| ---------------------------------- | ------------------------------------------------------------------- | ----- |
| 50 most common beginner characters | `--trace-path`, `--trace-path-strokes` (individual strokes layered) | 100   |

#### 1.6 Arabic Letters

| Asset                                                       | Variants Needed           | Count |
| ----------------------------------------------------------- | ------------------------- | ----- |
| 28 Arabic letters (isolated form)                           | `--trace-path`, `--block` | 56    |
| 28 Arabic letters (connected forms: initial, medial, final) | `--trace-path`            | 84    |

#### 1.7 Korean Jamo (Basic)

| Asset         | Variants Needed           | Count |
| ------------- | ------------------------- | ----- |
| 24 basic Jamo | `--trace-path`, `--block` | 48    |

---

### 2. Numbers & Math Symbols

**Used by:** Tracing, Counting, Pattern, Sequence, Matching, Fill-in-Blank

**Total target: ~299 SVGs**

#### 2.1 Digits (0–9)

| Asset          | Variants Needed                                                                       | Count |
| -------------- | ------------------------------------------------------------------------------------- | ----- |
| Each digit 0–9 | `--block`, `--trace-path`, `--trace-path-arrows`, `--outline`, `--bubble`, `--dotted` | 60    |

#### 2.2 Number Words

| Asset                            | Variants Needed | Count |
| -------------------------------- | --------------- | ----- |
| "one" through "twenty" (English) | `--trace-path`  | 20    |

#### 2.3 Math Symbols

| Asset                             | Variants Needed                        | Count |
| --------------------------------- | -------------------------------------- | ----- |
| `+`, `-`, `=`, `>`, `<`, `x`, `÷` | `--block`, `--trace-path`, `--outline` | 21    |

#### 2.4 Counting Dots / Tally Marks

| Asset                            | Variants Needed         | Count |
| -------------------------------- | ----------------------- | ----- |
| Dot arrangements (1–20)          | `--filled`, `--outline` | 40    |
| Tally marks (1–10)               | `--filled`              | 10    |
| Finger counting (1–10)           | `--filled`, `--outline` | 20    |
| Finger counting skin-tone (1–10) | `--skin-tone-1` through `--skin-tone-6` | 60    |
| Ten-frame (empty, partial, full) | `--filled`              | 12    |

#### 2.5 Telling Time Construction Kit

> **Why this matters:** "Telling Time" is a staple Kindergarten unit. Without decomposed clock components, the generator can only show static pictures of clocks — it can't generate "Draw the hands to show 3:00" or "What time is it?" worksheets.

| Asset | Variants Needed | Count |
| ----- | --------------- | ----- |
| Clock face (blank — circle + tick marks only) | `--filled`, `--outline` | 2 |
| Clock face (numbered — circle with 1–12) | `--filled`, `--outline` | 2 |
| Hour hand (short, thick arrow — rotatable) | `--filled` | 1 |
| Minute hand (long, thin arrow — rotatable) | `--filled` | 1 |
| Digital clock frame (blank rectangle with colon `__:__`) | `--filled`, `--outline` | 2 |

**Design Notes:**
- Clock hands must have their anchor/rotation point at the bottom center so the renderer can rotate them to any time position
- Hands are separate SVGs (not embedded in the clock face) — the generator composites them at runtime
- Use `transform-origin: center bottom` convention in the SVG

#### 2.6 Base Ten Blocks (Place Value)

> **Why this matters:** Base Ten Blocks are the standard school manipulative for teaching place value — the bridge from counting to addition/subtraction. Without them, there's no "Show 23 using blocks" worksheet type.

| Asset | Variants Needed | Count |
| ----- | --------------- | ----- |
| Unit cube (represents 1) | `--flat`, `--isometric` | 2 |
| Ten rod (stack of 10 cubes) | `--flat`, `--isometric` | 2 |
| Hundred flat (10x10 grid of cubes) | `--flat`, `--isometric` | 2 |

**Design Notes:**
- `--flat` = 2D front view (cleaner for worksheets). `--isometric` = 3D perspective (matches physical classroom blocks)
- Individual cube outlines must be visible within the ten-rod and hundred-flat so children can count the units
- Color: use a neutral blue or `--forge-primary` — matches most classroom block sets

#### 2.7 Visual Fractions

> **Why this matters:** Generic geometric fractions (circles and squares divided into equal parts) are more versatile than food-based fraction examples and standard in Pre-K/K math curricula.

| Asset | Variants Needed | Count |
| ----- | --------------- | ----- |
| Fraction circle (÷2) | `--outline`, `--filled-1` | 2 |
| Fraction circle (÷3) | `--outline`, `--filled-1`, `--filled-2` | 3 |
| Fraction circle (÷4) | `--outline`, `--filled-1`, `--filled-2`, `--filled-3` | 4 |
| Fraction circle (÷6) | `--outline`, `--filled-1` through `--filled-5` | 6 |
| Fraction circle (÷8) | `--outline`, `--filled-1` through `--filled-7` | 8 |
| Fraction square (÷2) | `--outline`, `--filled-1` | 2 |
| Fraction square (÷3) | `--outline`, `--filled-1`, `--filled-2` | 3 |
| Fraction square (÷4) | `--outline`, `--filled-1`, `--filled-2`, `--filled-3` | 4 |

**Design Notes:**
- `--outline` = all sections empty (for "color in 1/4" worksheets)
- `--filled-N` = N sections pre-filled (shaded), remaining sections empty
- Division lines must be crisp and equal — fractions are about fairness, and unequal-looking slices confuse children
- Filled sections use `--forge-primary` fill; empty sections are white with a visible outline

#### 2.8 Play Money (Currency Foundation)

> **Why this matters:** "Coin recognition" and "Shopkeeper" activities are major for sorting and value association. The spec has fantasy money (Gelt, Pirate Treasure) but no standard play currency for math worksheets.

| Asset | Variants Needed | Count |
| ----- | --------------- | ----- |
| Generic coin — 1 | `--simple`, `--outline` | 2 |
| Generic coin — 5 | `--simple`, `--outline` | 2 |
| Generic coin — 10 | `--simple`, `--outline` | 2 |
| Generic bill — 1 | `--simple`, `--outline` | 2 |
| Generic bill — 5 | `--simple`, `--outline` | 2 |

**Localized variants (Tier 5, optional):**

| Asset | Variants | Count |
| ----- | -------- | ----- |
| US Penny, Nickel, Dime, Quarter | `--realistic`, `--simple` | 8 |
| Euro 1c, 2c, 5c, 10c, 20c, 50c | `--realistic`, `--simple` | 12 |

**Design Notes:**
- Generic coins show just the numeral value (1, 5, 10) — no country branding
- `--simple` = flat circle/rectangle with number. `--realistic` = coin edge detail, portrait placeholder
- Generic variants ship in Tier 3; localized variants ship in Tier 5

---

### 3. Shapes & Geometry

**Used by:** Tracing, Recognition, Pattern, Matching, Sorting, Cutting

**Total target: ~215 SVGs**

#### 3.1 Basic Shapes

| Shape             | Variants                                            | Count |
| ----------------- | --------------------------------------------------- | ----- |
| Circle            | `--filled`, `--outline`, `--trace-path`, `--dotted` | 4     |
| Square            | same                                                | 4     |
| Triangle          | same                                                | 4     |
| Rectangle         | same                                                | 4     |
| Oval / Ellipse    | same                                                | 4     |
| Star (5-point)    | same                                                | 4     |
| Heart             | same                                                | 4     |
| Diamond / Rhombus | same                                                | 4     |
| Pentagon          | same                                                | 4     |
| Hexagon           | same                                                | 4     |
| Octagon           | same                                                | 4     |
| Crescent / Moon   | same                                                | 4     |
| Arrow             | same                                                | 4     |
| Cross / Plus      | same                                                | 4     |

#### 3.2 3D Shapes

| Shape    | Variants                | Count |
| -------- | ----------------------- | ----- |
| Cube     | `--filled`, `--outline` | 2     |
| Sphere   | same                    | 2     |
| Cylinder | same                    | 2     |
| Cone     | same                    | 2     |
| Pyramid  | same                    | 2     |

#### 3.3 Pattern Elements (for pattern worksheets)

| Shape                                | Variants                                                         | Count |
| ------------------------------------ | ---------------------------------------------------------------- | ----- |
| Each basic shape in 6 colors         | `--red`, `--blue`, `--green`, `--yellow`, `--purple`, `--orange` | 84    |
| Size variants (small, medium, large) | per shape                                                        | 42    |

#### 3.4 Tangram Puzzle Pieces

> **Why this matters:** Tangrams are a classic spatial reasoning manipulative — 7 shapes that fit together to form a square. "Cut out these shapes and make a cat" activities are staples in Pre-K/K. Just 7 base SVGs unlock an entire worksheet type.

| Shape | Quantity in Set | Variants | Count |
| ----- | --------------- | -------- | ----- |
| Large triangle | 2 | `--filled`, `--outline` | 4 |
| Medium triangle | 1 | `--filled`, `--outline` | 2 |
| Small triangle | 2 | `--filled`, `--outline` | 4 |
| Square | 1 | `--filled`, `--outline` | 2 |
| Parallelogram | 1 | `--filled`, `--outline` | 2 |

**Design Notes:**
- All 7 pieces must compose into a perfect square when assembled — geometric accuracy is critical
- `--filled` variants use distinct colors per piece (7 colors from the standard palette) so children can identify them
- `--outline` variants are for cutting practice — print, cut, and arrange
- Include a reference `tangram-solution-square.svg` showing the assembled arrangement (answer key)

---

### 4. Animals

**Used by:** Recognition, Matching, Counting, Sorting, Dot-Connect, Hidden-Picture, Labeling, Cutting, Sequence

**Total target: ~600 SVGs** (highest-variety category)

#### 4.1 Farm Animals

| Animal          | Variants                                                                   | Count  |
| --------------- | -------------------------------------------------------------------------- | ------ |
| Cow             | `--happy`, `--simple`, `--detailed`, `--outline`, `--silhouette`, `--baby` | 6      |
| Pig             | same                                                                       | 6      |
| Chicken / Hen   | same                                                                       | 6      |
| Rooster         | same                                                                       | 6      |
| Horse / Pony    | same                                                                       | 6      |
| Sheep / Lamb    | same                                                                       | 6      |
| Goat            | same                                                                       | 6      |
| Duck / Duckling | same                                                                       | 6      |
| Turkey          | same                                                                       | 6      |
| Donkey          | same                                                                       | 6      |
| Rabbit / Bunny  | same                                                                       | 6      |
| Dog (farm)      | same                                                                       | 6      |
| Cat (barn)      | same                                                                       | 6      |
| **Subtotal**    |                                                                            | **78** |

#### 4.2 Ocean / Sea Animals

| Animal                  | Variants                                                         | Count  |
| ----------------------- | ---------------------------------------------------------------- | ------ |
| Fish (generic tropical) | `--happy`, `--simple`, `--detailed`, `--outline`, `--silhouette` | 5      |
| Dolphin                 | same                                                             | 5      |
| Whale                   | same                                                             | 5      |
| Octopus                 | same                                                             | 5      |
| Seahorse                | same                                                             | 5      |
| Starfish                | same                                                             | 5      |
| Jellyfish               | same                                                             | 5      |
| Turtle (sea)            | same                                                             | 5      |
| Shark                   | same                                                             | 5      |
| Crab                    | same                                                             | 5      |
| Lobster                 | same                                                             | 5      |
| Clownfish               | same                                                             | 5      |
| Pufferfish              | same                                                             | 5      |
| Stingray                | same                                                             | 5      |
| Seal                    | same                                                             | 5      |
| Penguin                 | same                                                             | 5      |
| **Subtotal**            |                                                                  | **80** |

#### 4.3 Jungle / Safari Animals

| Animal                | Variants                                                                   | Count  |
| --------------------- | -------------------------------------------------------------------------- | ------ |
| Lion                  | `--happy`, `--simple`, `--detailed`, `--outline`, `--silhouette`, `--baby` | 6      |
| Elephant              | same                                                                       | 6      |
| Giraffe               | same                                                                       | 6      |
| Zebra                 | same                                                                       | 6      |
| Monkey / Ape          | same                                                                       | 6      |
| Tiger                 | same                                                                       | 6      |
| Hippo                 | same                                                                       | 6      |
| Rhino                 | same                                                                       | 6      |
| Crocodile / Alligator | same                                                                       | 6      |
| Gorilla               | same                                                                       | 6      |
| Parrot / Macaw        | same                                                                       | 6      |
| Toucan                | same                                                                       | 6      |
| Snake (friendly)      | same                                                                       | 6      |
| Chameleon             | same                                                                       | 6      |
| Flamingo              | same                                                                       | 6      |
| **Subtotal**          |                                                                            | **90** |

#### 4.4 Woodland / Forest Animals

| Animal       | Variants                                                         | Count  |
| ------------ | ---------------------------------------------------------------- | ------ |
| Bear         | `--happy`, `--simple`, `--detailed`, `--outline`, `--silhouette` | 5      |
| Fox          | same                                                             | 5      |
| Deer / Fawn  | same                                                             | 5      |
| Owl          | same                                                             | 5      |
| Squirrel     | same                                                             | 5      |
| Raccoon      | same                                                             | 5      |
| Hedgehog     | same                                                             | 5      |
| Wolf         | same                                                             | 5      |
| Beaver       | same                                                             | 5      |
| Skunk        | same                                                             | 5      |
| Moose        | same                                                             | 5      |
| Chipmunk     | same                                                             | 5      |
| **Subtotal** |                                                                  | **60** |

#### 4.5 Pets / Domestic Animals

| Animal                  | Variants                                           | Count  |
| ----------------------- | -------------------------------------------------- | ------ |
| Dog (various breeds x5) | `--happy`, `--simple`, `--outline`, `--silhouette` | 20     |
| Cat (various colors x4) | same                                               | 16     |
| Goldfish                | same                                               | 4      |
| Hamster                 | same                                               | 4      |
| Parrot (pet)            | same                                               | 4      |
| Turtle (pet)            | same                                               | 4      |
| Guinea Pig              | same                                               | 4      |
| **Subtotal**            |                                                    | **56** |

#### 4.6 Bugs & Insects

| Insect            | Variants                                                         | Count  |
| ----------------- | ---------------------------------------------------------------- | ------ |
| Butterfly         | `--happy`, `--simple`, `--detailed`, `--outline`, `--silhouette` | 5      |
| Ladybug           | same                                                             | 5      |
| Bee / Bumblebee   | same                                                             | 5      |
| Caterpillar       | same                                                             | 5      |
| Dragonfly         | same                                                             | 5      |
| Ant               | same                                                             | 5      |
| Grasshopper       | same                                                             | 5      |
| Firefly           | same                                                             | 5      |
| Spider (friendly) | same                                                             | 5      |
| Snail             | same                                                             | 5      |
| **Subtotal**      |                                                                  | **50** |

#### 4.7 Dinosaurs

| Dinosaur      | Variants                                                         | Count  |
| ------------- | ---------------------------------------------------------------- | ------ |
| T-Rex         | `--happy`, `--simple`, `--detailed`, `--outline`, `--silhouette` | 5      |
| Triceratops   | same                                                             | 5      |
| Brachiosaurus | same                                                             | 5      |
| Stegosaurus   | same                                                             | 5      |
| Pterodactyl   | same                                                             | 5      |
| Velociraptor  | same                                                             | 5      |
| Ankylosaurus  | same                                                             | 5      |
| Diplodocus    | same                                                             | 5      |
| **Subtotal**  |                                                                  | **40** |

#### 4.8 Arctic / Polar Animals

| Animal             | Variants                                           | Count  |
| ------------------ | -------------------------------------------------- | ------ |
| Polar Bear         | `--happy`, `--simple`, `--outline`, `--silhouette` | 4      |
| Arctic Fox         | same                                               | 4      |
| Walrus             | same                                               | 4      |
| Snowy Owl          | same                                               | 4      |
| Narwhal            | same                                               | 4      |
| Reindeer / Caribou | same                                               | 4      |
| Harp Seal (pup)    | same                                               | 4      |
| **Subtotal**       |                                                    | **28** |

#### 4.9 Birds

| Bird          | Variants                                           | Count  |
| ------------- | -------------------------------------------------- | ------ |
| Eagle         | `--happy`, `--simple`, `--outline`, `--silhouette` | 4      |
| Robin         | same                                               | 4      |
| Hummingbird   | same                                               | 4      |
| Peacock       | same                                               | 4      |
| Pelican       | same                                               | 4      |
| Woodpecker    | same                                               | 4      |
| Blue Jay      | same                                               | 4      |
| Cardinal      | same                                               | 4      |
| Pigeon / Dove | same                                               | 4      |
| Swan          | same                                               | 4      |
| **Subtotal**  |                                                    | **40** |

---

### 5. Space & Solar System

**Used by:** Recognition, Matching, Counting, Sorting, Labeling, Sequence, Dot-Connect

**Total target: ~150 SVGs**

#### 5.1 Planets

| Asset                | Variants                                                      | Count  |
| -------------------- | ------------------------------------------------------------- | ------ |
| Sun                  | `--happy`, `--simple`, `--detailed`, `--outline`, `--labeled` | 5      |
| Mercury              | same                                                          | 5      |
| Venus                | same                                                          | 5      |
| Earth                | same                                                          | 5      |
| Mars                 | same                                                          | 5      |
| Jupiter              | same                                                          | 5      |
| Saturn               | same                                                          | 5      |
| Uranus               | same                                                          | 5      |
| Neptune              | same                                                          | 5      |
| Pluto (dwarf planet) | same                                                          | 5      |
| **Subtotal**         |                                                               | **50** |

#### 5.2 Space Objects

| Asset                       | Variants                                         | Count  |
| --------------------------- | ------------------------------------------------ | ------ |
| Moon (full, crescent, half) | `--simple`, `--detailed`, `--outline`            | 9      |
| Star (various sizes)        | `--simple`, `--glowing`, `--outline`             | 9      |
| Rocket / Spaceship          | `--simple`, `--detailed`, `--outline`, `--happy` | 4      |
| Astronaut                   | same                                             | 4      |
| Alien (friendly)            | same                                             | 4      |
| UFO                         | same                                             | 4      |
| Satellite                   | `--simple`, `--detailed`, `--outline`            | 3      |
| Comet                       | same                                             | 3      |
| Asteroid                    | same                                             | 3      |
| Space Station               | same                                             | 3      |
| Telescope                   | same                                             | 3      |
| **Subtotal**                |                                                  | **46** |

#### 5.3 Space Scenes (backgrounds)

| Scene                  | Variants                 | Count |
| ---------------------- | ------------------------ | ----- |
| Solar system lineup    | `--simple`, `--labeled`  | 2     |
| Night sky              | `--simple`, `--detailed` | 2     |
| Moon surface           | `--simple`               | 1     |
| Space station interior | `--simple`               | 1     |
| **Subtotal**           |                          | **6** |

---

### 6. Festivals, Holidays & Cultural Celebrations

**Used by:** All generators via Theme System

**Total target: ~400 SVGs**

> **Design Principle:** All festival/cultural assets must be respectful, age-appropriate, and joyful. Avoid religious symbols in isolation; show celebrations, food, clothing, decorations, and family activities.

#### 6.1 Christmas / Winter Holiday

| Asset              | Variants                                                  | Count  |
| ------------------ | --------------------------------------------------------- | ------ |
| Christmas tree     | `--simple`, `--detailed`, `--outline`, `--decorated`      | 4      |
| Ornament (ball)    | `--red`, `--blue`, `--gold`, `--green`                    | 4      |
| Snowman            | `--happy`, `--simple`, `--outline`                        | 3      |
| Snowflake          | `--simple`, `--detailed`, `--outline` (x3 unique designs) | 9      |
| Gift box / Present | `--simple`, `--outline` (x3 colors)                       | 6      |
| Candy cane         | `--simple`, `--outline`                                   | 2      |
| Gingerbread person | `--happy`, `--simple`, `--outline`                        | 3      |
| Wreath             | `--simple`, `--detailed`                                  | 2      |
| Santa hat          | `--simple`, `--outline`                                   | 2      |
| Stocking           | `--simple`, `--outline`                                   | 2      |
| Reindeer (festive) | `--happy`, `--simple`, `--outline`                        | 3      |
| Bell               | `--simple`, `--outline`                                   | 2      |
| **Subtotal**       |                                                           | **42** |

#### 6.2 Hanukkah

| Asset              | Variants                              | Count  |
| ------------------ | ------------------------------------- | ------ |
| Menorah            | `--simple`, `--detailed`, `--outline` | 3      |
| Dreidel            | `--simple`, `--outline` (x4 sides)    | 5      |
| Star of David      | `--simple`, `--outline`               | 2      |
| Gelt (coins)       | `--simple`, `--outline`               | 2      |
| Latke              | `--simple`                            | 1      |
| Sufganiyah (donut) | `--simple`                            | 1      |
| **Subtotal**       |                                       | **14** |

#### 6.3 Diwali (Festival of Lights)

| Asset                | Variants                                           | Count  |
| -------------------- | -------------------------------------------------- | ------ |
| Diya lamp            | `--lit`, `--simple`, `--outline`, `--detailed`     | 4      |
| Rangoli pattern      | `--simple`, `--detailed`, `--outline` (x3 designs) | 9      |
| Fireworks            | `--burst-1`, `--burst-2`, `--burst-3`              | 3      |
| Lotus flower         | `--simple`, `--detailed`, `--outline`              | 3      |
| Lantern (paper)      | `--simple`, `--outline` (x3 colors)                | 6      |
| Peacock (decorative) | `--simple`, `--detailed`                           | 2      |
| Sweets tray          | `--simple`                                         | 1      |
| Sparkler             | `--simple`, `--outline`                            | 2      |
| **Subtotal**         |                                                    | **30** |

#### 6.4 Lunar New Year / Chinese New Year

| Asset               | Variants                                         | Count  |
| ------------------- | ------------------------------------------------ | ------ |
| Dragon (friendly)   | `--happy`, `--simple`, `--detailed`, `--outline` | 4      |
| Red envelope        | `--simple`, `--outline`                          | 2      |
| Lantern (Chinese)   | `--simple`, `--outline` (x3 colors)              | 6      |
| Firecracker         | `--simple`, `--outline`                          | 2      |
| Lion dance head     | `--simple`, `--detailed`                         | 2      |
| Dumpling            | `--simple`, `--outline`                          | 2      |
| Tangerine / Orange  | `--simple`, `--outline`                          | 2      |
| Zodiac animals (12) | `--simple`, `--outline`                          | 24     |
| Fan (decorative)    | `--simple`, `--outline`                          | 2      |
| Cherry blossom      | `--simple`, `--detailed`                         | 2      |
| **Subtotal**        |                                                  | **48** |

#### 6.5 Halloween

| Asset                    | Variants                                      | Count  |
| ------------------------ | --------------------------------------------- | ------ |
| Pumpkin / Jack-o-lantern | `--happy`, `--silly`, `--simple`, `--outline` | 4      |
| Ghost (friendly)         | `--happy`, `--silly`, `--simple`, `--outline` | 4      |
| Bat                      | `--simple`, `--outline`, `--silhouette`       | 3      |
| Spider (cute)            | `--simple`, `--outline`                       | 2      |
| Spider web               | `--simple`, `--outline`                       | 2      |
| Black cat (cute)         | `--simple`, `--outline`                       | 2      |
| Witch hat                | `--simple`, `--outline`                       | 2      |
| Candy corn               | `--simple`, `--outline`                       | 2      |
| Haunted house (cute)     | `--simple`, `--outline`                       | 2      |
| Mummy (cute)             | `--happy`, `--simple`                         | 2      |
| Frankenstein (cute)      | `--happy`, `--simple`                         | 2      |
| Skeleton (cute)          | `--happy`, `--simple`                         | 2      |
| **Subtotal**             |                                               | **29** |

#### 6.6 Thanksgiving

| Asset                  | Variants                              | Count  |
| ---------------------- | ------------------------------------- | ------ |
| Turkey (festive)       | `--happy`, `--simple`, `--outline`    | 3      |
| Cornucopia             | `--simple`, `--detailed`, `--outline` | 3      |
| Pumpkin pie            | `--simple`, `--outline`               | 2      |
| Corn                   | `--simple`, `--outline`               | 2      |
| Pilgrim hat            | `--simple`, `--outline`               | 2      |
| Autumn leaf (x5 types) | `--simple`, `--outline`               | 10     |
| Acorn                  | `--simple`, `--outline`               | 2      |
| **Subtotal**           |                                       | **24** |

#### 6.7 Easter / Spring

| Asset                   | Variants                                             | Count  |
| ----------------------- | ---------------------------------------------------- | ------ |
| Easter egg              | `--patterned` (x6 patterns), `--outline`, `--simple` | 8      |
| Bunny (Easter)          | `--happy`, `--simple`, `--outline`                   | 3      |
| Chick (hatching)        | `--simple`, `--outline`                              | 2      |
| Basket                  | `--simple`, `--outline`                              | 2      |
| Flower (spring generic) | `--simple`, `--outline` (x5 types)                   | 10     |
| Butterfly (spring)      | `--simple`, `--detailed`                             | 2      |
| Tulip                   | `--simple`, `--outline` (x4 colors)                  | 8      |
| **Subtotal**            |                                                      | **35** |

#### 6.8 Eid al-Fitr / Eid al-Adha

| Asset                   | Variants                              | Count  |
| ----------------------- | ------------------------------------- | ------ |
| Crescent moon with star | `--simple`, `--detailed`, `--outline` | 3      |
| Mosque silhouette       | `--simple`, `--outline`               | 2      |
| Lantern (Fanous)        | `--simple`, `--outline` (x3 designs)  | 6      |
| Dates (fruit)           | `--simple`, `--outline`               | 2      |
| Henna hand design       | `--simple`, `--detailed`              | 2      |
| Ketupat (woven pouch)   | `--simple`, `--outline`               | 2      |
| Prayer rug (decorative) | `--simple`                            | 1      |
| **Subtotal**            |                                       | **18** |

#### 6.9 Kwanzaa

| Asset                  | Variants                                    | Count  |
| ---------------------- | ------------------------------------------- | ------ |
| Kinara (candle holder) | `--simple`, `--detailed`, `--outline`       | 3      |
| Mkeka (mat)            | `--simple`, `--detailed`                    | 2      |
| Corn (Muhindi)         | `--simple`, `--outline`                     | 2      |
| Unity cup (Kikombe)    | `--simple`, `--outline`                     | 2      |
| Kente cloth pattern    | `--pattern-1`, `--pattern-2`, `--pattern-3` | 3      |
| **Subtotal**           |                                             | **12** |

#### 6.10 Valentine's Day

| Asset              | Variants                                           | Count  |
| ------------------ | -------------------------------------------------- | ------ |
| Heart              | `--simple`, `--detailed`, `--outline` (x3 designs) | 9      |
| Love letter / Card | `--simple`, `--outline`                            | 2      |
| Rose               | `--simple`, `--outline` (x3 colors)                | 6      |
| Cupid (cute)       | `--simple`, `--outline`                            | 2      |
| Chocolate box      | `--simple`, `--outline`                            | 2      |
| **Subtotal**       |                                                    | **21** |

#### 6.11 St. Patrick's Day

| Asset             | Variants                               | Count |
| ----------------- | -------------------------------------- | ----- |
| Shamrock / Clover | `--simple`, `--outline`, `--four-leaf` | 3     |
| Leprechaun hat    | `--simple`, `--outline`                | 2     |
| Pot of gold       | `--simple`, `--outline`                | 2     |
| Rainbow           | `--simple`, `--detailed`               | 2     |
| **Subtotal**      |                                        | **9** |

#### 6.12 4th of July / Independence Day

| Asset            | Variants                              | Count  |
| ---------------- | ------------------------------------- | ------ |
| Fireworks        | `--burst-1`, `--burst-2`, `--burst-3` | 3      |
| American flag    | `--simple`, `--outline`               | 2      |
| Bald eagle       | `--simple`, `--outline`               | 2      |
| Liberty bell     | `--simple`, `--outline`               | 2      |
| Star (patriotic) | `--red`, `--white`, `--blue`          | 3      |
| **Subtotal**     |                                       | **12** |

#### 6.13 Day of the Dead (Dia de los Muertos)

| Asset                              | Variants                                           | Count  |
| ---------------------------------- | -------------------------------------------------- | ------ |
| Sugar skull (decorative, colorful) | `--simple`, `--detailed`, `--outline` (x3 designs) | 9      |
| Marigold flower                    | `--simple`, `--outline`                            | 2      |
| Papel picado (paper banner)        | `--design-1`, `--design-2`, `--design-3`           | 3      |
| Candle                             | `--simple`, `--outline`                            | 2      |
| **Subtotal**                       |                                                    | **16** |

#### 6.14 Holi (Festival of Colors)

| Asset                 | Variants                                                       | Count  |
| --------------------- | -------------------------------------------------------------- | ------ |
| Color splash / powder | `--red`, `--blue`, `--yellow`, `--green`, `--purple`, `--pink` | 6      |
| Water gun (Pichkari)  | `--simple`, `--outline`                                        | 2      |
| Drum (Dholak)         | `--simple`, `--outline`                                        | 2      |
| Bonfire               | `--simple`, `--outline`                                        | 2      |
| **Subtotal**          |                                                                | **12** |

#### 6.15 Back to School

| Asset           | Variants                            | Count  |
| --------------- | ----------------------------------- | ------ |
| Backpack        | `--simple`, `--outline` (x3 colors) | 6      |
| Apple (teacher) | `--simple`, `--outline`             | 2      |
| Pencil          | `--simple`, `--outline`             | 2      |
| Notebook        | `--simple`, `--outline`             | 2      |
| School bus      | `--simple`, `--outline`             | 2      |
| Chalkboard      | `--simple`, `--outline`             | 2      |
| Globe           | `--simple`, `--outline`             | 2      |
| Crayons         | `--simple`, `--outline`             | 2      |
| Ruler           | `--simple`, `--outline`             | 2      |
| Scissors        | `--simple`, `--outline`             | 2      |
| **Subtotal**    |                                     | **24** |

---

### 7. Food & Drink

**Used by:** Counting, Sorting, Matching, Recognition, Pattern

**Total target: ~250 SVGs**

#### 7.1 Fruits

| Item               | Variants                                       | Count  |
| ------------------ | ---------------------------------------------- | ------ |
| Apple              | `--simple`, `--outline`, `--red`, `--green`    | 4      |
| Banana             | `--simple`, `--outline`                        | 2      |
| Orange             | `--simple`, `--outline`                        | 2      |
| Strawberry         | `--simple`, `--outline`                        | 2      |
| Grapes (bunch)     | `--simple`, `--outline`, `--purple`, `--green` | 4      |
| Watermelon (slice) | `--simple`, `--outline`                        | 2      |
| Pineapple          | `--simple`, `--outline`                        | 2      |
| Cherry (pair)      | `--simple`, `--outline`                        | 2      |
| Peach              | `--simple`, `--outline`                        | 2      |
| Pear               | `--simple`, `--outline`                        | 2      |
| Blueberries        | `--simple`, `--outline`                        | 2      |
| Mango              | `--simple`, `--outline`                        | 2      |
| Kiwi               | `--simple`, `--outline`                        | 2      |
| Lemon              | `--simple`, `--outline`                        | 2      |
| Coconut            | `--simple`, `--outline`                        | 2      |
| **Subtotal**       |                                                | **34** |

#### 7.2 Vegetables

| Item          | Variants                                                | Count  |
| ------------- | ------------------------------------------------------- | ------ |
| Carrot        | `--simple`, `--outline`                                 | 2      |
| Broccoli      | `--simple`, `--outline`                                 | 2      |
| Tomato        | `--simple`, `--outline`                                 | 2      |
| Corn (on cob) | `--simple`, `--outline`                                 | 2      |
| Peas (pod)    | `--simple`, `--outline`                                 | 2      |
| Pepper (bell) | `--simple`, `--outline`, `--red`, `--green`, `--yellow` | 5      |
| Potato        | `--simple`, `--outline`                                 | 2      |
| Cucumber      | `--simple`, `--outline`                                 | 2      |
| Pumpkin       | `--simple`, `--outline`                                 | 2      |
| Eggplant      | `--simple`, `--outline`                                 | 2      |
| Mushroom      | `--simple`, `--outline`                                 | 2      |
| Onion         | `--simple`, `--outline`                                 | 2      |
| **Subtotal**  |                                                         | **27** |

#### 7.3 Prepared Foods

| Item             | Variants                                                     | Count  |
| ---------------- | ------------------------------------------------------------ | ------ |
| Pizza (slice)    | `--simple`, `--outline`                                      | 2      |
| Cupcake / Muffin | `--simple`, `--outline` (x3 toppings)                        | 6      |
| Ice cream cone   | `--simple`, `--outline` (x3 flavors)                         | 6      |
| Cookie           | `--simple`, `--outline` (chocolate chip, sugar, gingerbread) | 6      |
| Sandwich         | `--simple`, `--outline`                                      | 2      |
| Burger           | `--simple`, `--outline`                                      | 2      |
| Taco             | `--simple`, `--outline`                                      | 2      |
| Sushi            | `--simple`, `--outline`                                      | 2      |
| Pancake stack    | `--simple`, `--outline`                                      | 2      |
| Bread / Toast    | `--simple`, `--outline`                                      | 2      |
| Bowl of soup     | `--simple`, `--outline`                                      | 2      |
| Donut            | `--simple`, `--outline` (x3 flavors)                         | 6      |
| Lollipop         | `--simple`, `--outline` (x3 colors)                          | 6      |
| Birthday cake    | `--simple`, `--detailed`, `--outline`                        | 3      |
| **Subtotal**     |                                                              | **49** |

#### 7.4 Drinks

| Item          | Variants                             | Count  |
| ------------- | ------------------------------------ | ------ |
| Glass of milk | `--simple`, `--outline`              | 2      |
| Juice box     | `--simple`, `--outline` (x3 flavors) | 6      |
| Water bottle  | `--simple`, `--outline`              | 2      |
| Hot chocolate | `--simple`, `--outline`              | 2      |
| **Subtotal**  |                                      | **12** |

---

### 8. Vehicles & Transportation

**Used by:** Recognition, Matching, Counting, Sorting, Sequence, Dot-Connect, Labeling

**Total target: ~150 SVGs**

| Vehicle            | Variants                                              | Count  |
| ------------------ | ----------------------------------------------------- | ------ |
| Car                | `--simple`, `--detailed`, `--outline`, `--silhouette` | 4      |
| Bus (school)       | same                                                  | 4      |
| Truck (fire)       | same                                                  | 4      |
| Truck (dump)       | same                                                  | 4      |
| Ambulance          | same                                                  | 4      |
| Police car         | same                                                  | 4      |
| Bicycle            | same                                                  | 4      |
| Motorcycle         | same                                                  | 4      |
| Helicopter         | same                                                  | 4      |
| Airplane           | same                                                  | 4      |
| Hot air balloon    | same                                                  | 4      |
| Rocket             | same                                                  | 4      |
| Train / Locomotive | same                                                  | 4      |
| Boat / Sailboat    | same                                                  | 4      |
| Ship / Cruise      | same                                                  | 4      |
| Submarine          | same                                                  | 4      |
| Tractor            | same                                                  | 4      |
| Scooter            | same                                                  | 4      |
| Skateboard         | same                                                  | 4      |
| Excavator / Digger | same                                                  | 4      |
| Crane              | same                                                  | 4      |
| Garbage truck      | same                                                  | 4      |
| Ice cream truck    | same                                                  | 4      |
| Ambulance boat     | `--simple`, `--outline`                               | 2      |
| Canoe / Kayak      | `--simple`, `--outline`                               | 2      |
| **Subtotal**       |                                                       | **96** |

---

### 9. Nature & Weather

**Used by:** Recognition, Matching, Sorting, Pattern, Cutting, Hidden-Picture backgrounds

**Total target: ~200 SVGs**

#### 9.1 Weather

| Asset               | Variants                                                | Count  |
| ------------------- | ------------------------------------------------------- | ------ |
| Sun (weather)       | `--simple`, `--outline`, `--happy`                      | 3      |
| Cloud               | `--simple`, `--outline`, `--happy`, `--rain`, `--storm` | 5      |
| Rainbow             | `--simple`, `--detailed`, `--outline`                   | 3      |
| Raindrop            | `--simple`, `--outline`                                 | 2      |
| Snowflake (weather) | `--simple`, `--outline` (x3 designs)                    | 6      |
| Lightning bolt      | `--simple`, `--outline`                                 | 2      |
| Wind (swirl)        | `--simple`, `--outline`                                 | 2      |
| Tornado (friendly)  | `--simple`                                              | 1      |
| Umbrella            | `--simple`, `--outline` (x3 colors)                     | 6      |
| **Subtotal**        |                                                         | **30** |

#### 9.2 Trees & Plants

| Asset                 | Variants                                                              | Count  |
| --------------------- | --------------------------------------------------------------------- | ------ |
| Oak tree              | `--simple`, `--outline`, `--spring`, `--summer`, `--fall`, `--winter` | 6      |
| Pine / Evergreen tree | `--simple`, `--outline`                                               | 2      |
| Palm tree             | `--simple`, `--outline`                                               | 2      |
| Cactus (various x3)   | `--simple`, `--outline`                                               | 6      |
| Flower (rose)         | `--simple`, `--outline` (x4 colors)                                   | 8      |
| Flower (sunflower)    | `--simple`, `--outline`                                               | 2      |
| Flower (daisy)        | `--simple`, `--outline`                                               | 2      |
| Flower (tulip)        | `--simple`, `--outline` (x4 colors)                                   | 8      |
| Flower (lily)         | `--simple`, `--outline`                                               | 2      |
| Leaf (maple)          | `--green`, `--red`, `--orange`, `--yellow`, `--outline`               | 5      |
| Leaf (oak)            | `--green`, `--brown`, `--outline`                                     | 3      |
| Mushroom              | `--simple`, `--outline` (x3 designs)                                  | 6      |
| Grass tuft            | `--simple`, `--outline`                                               | 2      |
| Bush                  | `--simple`, `--outline`                                               | 2      |
| Seedling / Sprout     | `--simple`, `--outline`                                               | 2      |
| **Subtotal**          |                                                                       | **58** |

#### 9.3 Landscapes / Scenes (for backgrounds)

| Scene               | Variants                 | Count  |
| ------------------- | ------------------------ | ------ |
| Farm scene          | `--simple`, `--detailed` | 2      |
| Ocean / Beach scene | `--simple`, `--detailed` | 2      |
| Forest scene        | `--simple`, `--detailed` | 2      |
| Mountain scene      | `--simple`, `--detailed` | 2      |
| Desert scene        | `--simple`               | 1      |
| Pond / Lake scene   | `--simple`               | 1      |
| Garden scene        | `--simple`, `--detailed` | 2      |
| City / Town scene   | `--simple`               | 1      |
| Playground scene    | `--simple`, `--detailed` | 2      |
| Underwater scene    | `--simple`, `--detailed` | 2      |
| Jungle scene        | `--simple`               | 1      |
| Arctic scene        | `--simple`               | 1      |
| **Subtotal**        |                          | **19** |

---

### 10. Community Helpers & Occupations

**Used by:** Recognition, Matching, Sorting, Labeling

**Total target: ~100 SVGs**

| Character           | Variants                                              | Count |
| ------------------- | ----------------------------------------------------- | ----- |
| Firefighter         | `--simple`, `--detailed`, `--outline`, `--silhouette` | 4     |
| Police officer      | same                                                  | 4     |
| Doctor / Nurse      | same                                                  | 4     |
| Teacher             | same                                                  | 4     |
| Mail carrier        | same                                                  | 4     |
| Chef / Cook         | same                                                  | 4     |
| Farmer              | same                                                  | 4     |
| Construction worker | same                                                  | 4     |
| Astronaut           | same                                                  | 4     |
| Scientist           | same                                                  | 4     |
| Pilot               | same                                                  | 4     |
| Dentist             | same                                                  | 4     |
| Veterinarian        | same                                                  | 4     |
| Artist / Painter    | same                                                  | 4     |
| Musician            | same                                                  | 4     |
| Librarian           | same                                                  | 4     |

**Tools & Equipment per occupation:**

| Equipment                                       | Count  |
| ----------------------------------------------- | ------ |
| Fire truck, hose, helmet, axe                   | 4      |
| Stethoscope, thermometer, bandage, syringe      | 4      |
| Magnifying glass, microscope, beaker, test tube | 4      |
| Hammer, wrench, hard hat, toolbox               | 4      |
| Paintbrush, palette, easel, canvas              | 4      |
| Guitar, drum, piano, microphone                 | 4      |
| **Subtotal**                                    | **88** |

---

### 11. Household & Everyday Objects

**Used by:** Recognition, Matching, Sorting, Labeling, Counting

**Total target: ~150 SVGs**

#### 11.1 Furniture & Rooms

| Item            | Variants                | Count  |
| --------------- | ----------------------- | ------ |
| Chair           | `--simple`, `--outline` | 2      |
| Table           | same                    | 2      |
| Bed             | same                    | 2      |
| Lamp            | same                    | 2      |
| Clock           | same                    | 2      |
| Television      | same                    | 2      |
| Bookshelf       | same                    | 2      |
| Bathtub         | same                    | 2      |
| Sink            | same                    | 2      |
| Toilet          | same                    | 2      |
| Refrigerator    | same                    | 2      |
| Stove / Oven    | same                    | 2      |
| Washing machine | same                    | 2      |
| Window          | same                    | 2      |
| Door            | same                    | 2      |
| **Subtotal**    |                         | **30** |

#### 11.2 Clothing

| Item                             | Variants                              | Count  |
| -------------------------------- | ------------------------------------- | ------ |
| Shirt / T-shirt                  | `--simple`, `--outline` (x3 colors)   | 6      |
| Pants                            | same                                  | 6      |
| Dress                            | same                                  | 6      |
| Hat (various x3)                 | same                                  | 6      |
| Shoes (sneakers, boots, sandals) | `--simple`, `--outline`               | 6      |
| Socks (pair)                     | `--simple`, `--outline` (x3 patterns) | 6      |
| Jacket / Coat                    | `--simple`, `--outline`               | 2      |
| Scarf                            | `--simple`, `--outline`               | 2      |
| Mittens / Gloves                 | `--simple`, `--outline`               | 2      |
| Umbrella                         | `--simple`, `--outline`               | 2      |
| **Subtotal**                     |                                       | **44** |

#### 11.3 Toys & Play

| Item                  | Variants                                               | Count  |
| --------------------- | ------------------------------------------------------ | ------ |
| Teddy bear            | `--simple`, `--outline`, `--happy`                     | 3      |
| Ball                  | `--simple`, `--outline` (soccer, basketball, baseball) | 6      |
| Doll                  | `--simple`, `--outline`                                | 2      |
| Building blocks       | `--simple`, `--outline`                                | 2      |
| Kite                  | `--simple`, `--outline` (x3 colors)                    | 6      |
| Jump rope             | `--simple`, `--outline`                                | 2      |
| Puzzle piece          | `--simple`, `--outline`                                | 2      |
| Toy car               | `--simple`, `--outline`                                | 2      |
| Drum (toy)            | `--simple`, `--outline`                                | 2      |
| Yo-yo                 | `--simple`, `--outline`                                | 2      |
| Robot (toy, friendly) | `--simple`, `--outline`, `--happy`                     | 3      |
| **Subtotal**          |                                                        | **32** |

---

### 12. Human Body & Senses

**Used by:** Labeling, Recognition, Matching

**Total target: ~60 SVGs**

| Asset                                              | Variants                                                                           | Count  |
| -------------------------------------------------- | ---------------------------------------------------------------------------------- | ------ |
| Full body (child, front)                           | `--labeled`, `--outline`, `--simple`                                               | 3      |
| Full body (child, side)                            | same                                                                               | 3      |
| Hand (open palm)                                   | `--labeled`, `--outline`                                                           | 2      |
| Foot                                               | `--labeled`, `--outline`                                                           | 2      |
| Face (front)                                       | `--labeled`, `--outline`, `--happy`, `--sad`, `--angry`, `--surprised`, `--sleepy` | 7      |
| Eye                                                | `--simple`, `--labeled`                                                            | 2      |
| Ear                                                | `--simple`, `--labeled`                                                            | 2      |
| Nose                                               | `--simple`, `--labeled`                                                            | 2      |
| Mouth (smiling, frowning, open)                    | `--simple`                                                                         | 3      |
| Tooth                                              | `--simple`, `--happy`                                                              | 2      |
| Heart (anatomical, simple)                         | `--simple`, `--labeled`                                                            | 2      |
| Lungs (simple)                                     | `--simple`, `--labeled`                                                            | 2      |
| Bones / Skeleton (educational)                     | `--simple`, `--labeled`                                                            | 2      |
| Five senses icons (see, hear, smell, taste, touch) | `--simple`, `--outline`                                                            | 10     |
| Emotions wheel / faces (8 emotions)                | `--simple`                                                                         | 8      |
| **Subtotal**                                       |                                                                                    | **52** |

---

### 13. Music & Instruments

**Used by:** Recognition, Matching, Sorting, Pattern

**Total target: ~60 SVGs**

| Instrument                                 | Variants                | Count  |
| ------------------------------------------ | ----------------------- | ------ |
| Piano / Keyboard                           | `--simple`, `--outline` | 2      |
| Guitar (acoustic)                          | same                    | 2      |
| Drum                                       | same                    | 2      |
| Trumpet                                    | same                    | 2      |
| Violin                                     | same                    | 2      |
| Flute                                      | same                    | 2      |
| Tambourine                                 | same                    | 2      |
| Xylophone                                  | same                    | 2      |
| Maracas                                    | same                    | 2      |
| Triangle (instrument)                      | same                    | 2      |
| Ukulele                                    | same                    | 2      |
| Harmonica                                  | same                    | 2      |
| Music notes (quarter, half, whole, eighth) | `--simple`, `--outline` | 8      |
| Treble clef                                | `--simple`, `--outline` | 2      |
| **Subtotal**                               |                         | **34** |

---

### 14. Sports & Activities

**Used by:** Recognition, Matching, Sorting, Counting

**Total target: ~80 SVGs**

| Item                    | Variants                                      | Count  |
| ----------------------- | --------------------------------------------- | ------ |
| Soccer ball             | `--simple`, `--outline`                       | 2      |
| Basketball              | same                                          | 2      |
| Baseball / Bat          | same                                          | 2      |
| Tennis racket / ball    | same                                          | 2      |
| Swimming (person)       | same                                          | 2      |
| Running (person)        | same                                          | 2      |
| Jumping rope            | same                                          | 2      |
| Yoga pose (child, x3)   | `--simple`                                    | 3      |
| Hula hoop               | `--simple`, `--outline`                       | 2      |
| Skipping                | `--simple`                                    | 1      |
| Cycling                 | `--simple`, `--outline`                       | 2      |
| Skateboarding           | `--simple`                                    | 1      |
| Ballet / Dancing        | `--simple`, `--outline`                       | 2      |
| Martial arts (friendly) | `--simple`                                    | 1      |
| Hockey stick / puck     | `--simple`, `--outline`                       | 2      |
| Bowling pins / ball     | `--simple`, `--outline`                       | 2      |
| Medal / Trophy          | `--gold`, `--silver`, `--bronze`, `--outline` | 4      |
| **Subtotal**            |                                               | **34** |

---

### 15. Cutting Practice Shapes

**Used by:** Cutting generator exclusively

**Total target: ~60 SVGs**

All cutting assets need `--cut-guide` variant with dashed stroke lines.

| Pattern                                         | Variants                             | Count  |
| ----------------------------------------------- | ------------------------------------ | ------ |
| Straight lines (horizontal, vertical, diagonal) | `--cut-guide` x 6 widths             | 6      |
| Zigzag lines (3 difficulties)                   | `--cut-guide`                        | 3      |
| Wavy lines (3 difficulties)                     | `--cut-guide`                        | 3      |
| Spiral (3 difficulties)                         | `--cut-guide`                        | 3      |
| Circle cutout                                   | `--cut-guide` (small, medium, large) | 3      |
| Square cutout                                   | same                                 | 3      |
| Triangle cutout                                 | same                                 | 3      |
| Star cutout                                     | same                                 | 3      |
| Heart cutout                                    | same                                 | 3      |
| Animal silhouette cutouts (10 animals)          | `--cut-guide`                        | 10     |
| Crown cutout                                    | `--cut-guide`                        | 1      |
| Mask cutout (cat, dog, lion, bear, butterfly)   | `--cut-guide`                        | 5      |
| Paper doll chain                                | `--cut-guide`                        | 1      |
| Snowflake fold-and-cut template                 | `--cut-guide` (x3 designs)           | 3      |
| Bookmark shapes (x5 designs)                    | `--cut-guide`                        | 5      |
| **Subtotal**                                    |                                      | **55** |

---

### 16. Dot-to-Dot Outlines

**Used by:** Dot-Connect generator exclusively

**Total target: ~60 SVGs**

All dot-to-dot assets need `--dotted` variant with numbered anchor points.

| Subject            | Difficulty Levels                                | Count  |
| ------------------ | ------------------------------------------------ | ------ |
| Cat                | easy (10 dots), medium (20 dots), hard (35 dots) | 3      |
| Dog                | same                                             | 3      |
| Butterfly          | same                                             | 3      |
| Fish               | same                                             | 3      |
| Star               | same                                             | 3      |
| Heart              | same                                             | 3      |
| House              | same                                             | 3      |
| Tree               | same                                             | 3      |
| Rocket             | same                                             | 3      |
| Dinosaur           | same                                             | 3      |
| Dolphin            | same                                             | 3      |
| Elephant           | same                                             | 3      |
| Car                | same                                             | 3      |
| Flower             | same                                             | 3      |
| Castle             | same                                             | 3      |
| Robot              | same                                             | 3      |
| Snowman            | same                                             | 3      |
| Unicorn            | same                                             | 3      |
| Dragon (friendly)  | same                                             | 3      |
| Mermaid (friendly) | same                                             | 3      |
| **Subtotal**       |                                                  | **60** |

---

### 17. Hidden-Picture Scenes

**Used by:** Hidden-Picture generator exclusively

**Total target: ~30 SVGs**

Each scene is a complex layered SVG with embedded objects to find.

| Scene                   | Hidden Objects (10–15 each)                                   | Count  |
| ----------------------- | ------------------------------------------------------------- | ------ |
| Underwater ocean scene  | fish, shell, starfish, seahorse, treasure chest, anchor, etc. | 1      |
| Farm scene              | egg, boot, apple, bucket, key, butterfly, etc.                | 1      |
| Jungle scene            | banana, compass, binoculars, snake, parrot, etc.              | 1      |
| Space scene             | alien, satellite, comet, flag, wrench, etc.                   | 1      |
| Playground scene        | ball, jump rope, hat, ice cream, ladybug, etc.                | 1      |
| Kitchen scene           | spoon, cup, apple, clock, mouse, etc.                         | 1      |
| Bedroom scene           | sock, book, teddy bear, crayon, flashlight, etc.              | 1      |
| Forest / Camping scene  | tent, flashlight, marshmallow, axe, owl, etc.                 | 1      |
| Beach scene             | crab, shell, umbrella, starfish, sunglasses, etc.             | 1      |
| Garden scene            | watering can, butterfly, snail, worm, flower pot, etc.        | 1      |
| Winter / Snow scene     | mitten, scarf, carrot, top hat, broom, etc.                   | 1      |
| Castle / Medieval scene | crown, shield, dragon, gem, key, etc.                         | 1      |
| Pirate ship scene       | treasure map, parrot, telescope, anchor, barrel, etc.         | 1      |
| Dinosaur land scene     | egg, bone, footprint, plant, volcano, etc.                    | 1      |
| Bakery / Kitchen scene  | whisk, egg, cupcake, rolling pin, flour bag, etc.             | 1      |
| City street scene       | fire hydrant, bicycle, mailbox, pigeon, traffic light, etc.   | 1      |
| Library scene           | bookmark, glasses, magnifying glass, globe, etc.              | 1      |
| Art studio scene        | paintbrush, palette, pencil, eraser, frame, etc.              | 1      |
| Pet shop scene          | bone, fish bowl, hamster wheel, collar, bird cage, etc.       | 1      |
| Toy shop scene          | teddy bear, robot, ball, train, puzzle piece, etc.            | 1      |
| **Subtotal**            |                                                               | **20** |

---

### 18. Labeling Diagrams

**Used by:** Labeling generator exclusively

**Total target: ~40 SVGs**

Each diagram includes anchor points with `data-label-id` attributes for the renderer.

| Diagram Subject         | Labels                                                         | Count  |
| ----------------------- | -------------------------------------------------------------- | ------ |
| Human body (front)      | head, arm, leg, hand, foot, chest, knee, elbow                 | 1      |
| Human face              | eye, ear, nose, mouth, chin, forehead, cheek                   | 1      |
| Plant / Flower          | petal, stem, leaf, root, bud, seed                             | 1      |
| Tree                    | trunk, branch, leaf, root, bark, canopy                        | 1      |
| Butterfly lifecycle     | egg, caterpillar, chrysalis, butterfly                         | 1      |
| Frog lifecycle          | egg, tadpole, froglet, frog                                    | 1      |
| Weather cycle           | cloud, rain, river, ocean, evaporation, sun                    | 1      |
| Solar system            | Sun + 8 planets (labeled positions)                            | 1      |
| Farm (aerial view)      | barn, field, silo, pond, fence, tractor                        | 1      |
| House (cross-section)   | roof, wall, door, window, chimney, foundation                  | 1      |
| Car (side view)         | wheel, door, window, hood, trunk, headlight                    | 1      |
| Bicycle                 | wheel, pedal, seat, handlebar, chain, spoke                    | 1      |
| Fish (anatomy)          | fin, tail, gill, eye, scale, mouth                             | 1      |
| Bird (anatomy)          | wing, beak, tail, claw, feather, eye                           | 1      |
| Insect (anatomy)        | head, thorax, abdomen, antenna, wing, leg                      | 1      |
| Dinosaur (anatomy)      | head, tail, leg, claw, teeth, spine                            | 1      |
| Kitchen (room)          | stove, fridge, sink, table, chair, cupboard                    | 1      |
| Classroom (room)        | desk, chair, board, bookshelf, window, clock                   | 1      |
| Playground              | slide, swing, sandbox, seesaw, monkey bars, bench              | 1      |
| Seasons wheel           | spring, summer, fall, winter (quadrants)                       | 1      |
| Food pyramid / plate    | grains, vegetables, fruits, protein, dairy                     | 1      |
| Volcano (cross-section) | crater, magma, lava, ash cloud, crust                          | 1      |
| Ocean layers            | surface, sunlight zone, twilight zone, midnight zone, seafloor | 1      |
| Tooth (cross-section)   | enamel, dentin, pulp, root, gum                                | 1      |
| **Subtotal**            |                                                                | **24** |

---

### 19. Maze Elements

**Used by:** Maze generator

**Total target: ~20 SVGs**

Mazes are procedurally generated, but need themed start/end markers and decorative borders.

| Asset                                                      | Purpose         | Count  |
| ---------------------------------------------------------- | --------------- | ------ |
| Start markers (animal, vehicle, character x5)              | `--start`       | 5      |
| End markers / goals (home, food, treasure x5)              | `--end`         | 5      |
| Themed borders (ocean, farm, space, jungle, city)          | `--border`      | 5      |
| Collectible items along path (star, coin, gem, heart, key) | `--collectible` | 5      |
| **Subtotal**                                               |                 | **20** |

---

### 20. Decorative & UI Elements

**Used by:** All generators (worksheet chrome, borders, headers)

**Total target: ~100 SVGs**

#### 20.1 Borders & Frames

| Pattern                                         | Variants                        | Count  |
| ----------------------------------------------- | ------------------------------- | ------ |
| Simple line border                              | `--thin`, `--thick`, `--double` | 3      |
| Dotted border                                   | `--small-dots`, `--large-dots`  | 2      |
| Star border                                     | `--simple`                      | 1      |
| Heart border                                    | `--simple`                      | 1      |
| Leaf / Vine border                              | `--simple`, `--detailed`        | 2      |
| Ocean wave border                               | `--simple`                      | 1      |
| Pencil / Crayon border                          | `--simple`                      | 1      |
| Seasonal borders (spring, summer, fall, winter) | `--simple`                      | 4      |
| Festival borders (per major festival x10)       | `--simple`                      | 10     |
| **Subtotal**                                    |                                 | **25** |

#### 20.2 Corner Decorations

| Style             | Variants                                                       | Count  |
| ----------------- | -------------------------------------------------------------- | ------ |
| Floral corner     | `--top-left`, `--top-right`, `--bottom-left`, `--bottom-right` | 4      |
| Star corner       | same                                                           | 4      |
| Animal paw corner | same                                                           | 4      |
| **Subtotal**      |                                                                | **12** |

#### 20.3 Worksheet UI Icons

| Icon                              | Purpose                   | Count  |
| --------------------------------- | ------------------------- | ------ |
| Scissors icon                     | "Cut here" indicator      | 1      |
| Pencil icon                       | "Write here" indicator    | 1      |
| Crayon icon                       | "Color here" indicator    | 1      |
| Hand (pointing)                   | "Start here" indicator    | 1      |
| Star (reward)                     | "Great job!"              | 1      |
| Smiley face                       | Positive feedback         | 1      |
| Checkmark                         | Correct answer            | 1      |
| X mark                            | Incorrect answer          | 1      |
| Arrow (directional, 4 directions) | Navigation                | 4      |
| Question mark                     | Help/hint                 | 1      |
| Light bulb                        | Tip/idea                  | 1      |
| Clock                             | Timer/timed activity      | 1      |
| Name line                         | "Name: \_\_\_" decorative | 1      |
| Date line                         | "Date: \_\_\_" decorative | 1      |
| **Subtotal**                      |                           | **17** |

#### 20.4 Reward Stickers / Badges

| Asset                                                    | Variants                              | Count  |
| -------------------------------------------------------- | ------------------------------------- | ------ |
| Star badge                                               | `--gold`, `--silver`, `--bronze`      | 3      |
| "Great Job" badge                                        | `--style-1`, `--style-2`, `--style-3` | 3      |
| "Super Star" badge                                       | same                                  | 3      |
| Animal stickers (10 different happy animals)             | `--simple`                            | 10     |
| Emoji-style stickers (thumbs up, clap, 100, fire, heart) | `--simple`                            | 5      |
| Ribbon / Rosette                                         | `--gold`, `--blue`, `--red`           | 3      |
| Crown                                                    | `--simple`, `--detailed`              | 2      |
| **Subtotal**                                             |                                       | **29** |

---

## Age 2–5 Enhancement Packs

> The following categories (21–28) are specifically optimized for the toddler-through-pre-K age range. They address pre-writing motor readiness, phonics picture vocabulary, social-emotional learning, inclusive representation, and interactive "activity page" formats that make worksheets feel like mini gamebooks.

### 21. Pre-Writing Strokes (Tier 0 for Age 2–3)

**Used by:** Tracing generator (before letters/numbers)

**Total target: ~89 SVGs**

> **Why this matters:** Ages 2–3 succeed with big motor patterns before letters. Pre-writing strokes build pencil control and are the single most-used worksheet type for toddlers.

#### 21.1 Stroke Paths

| Stroke Type                                             | Variants                                                                | Count  |
| ------------------------------------------------------- | ----------------------------------------------------------------------- | ------ |
| Straight line — horizontal                              | `--trace-path`, `--trace-path-arrows`, `--bold` (short / medium / long) | 9      |
| Straight line — vertical                                | same                                                                    | 9      |
| Straight line — diagonal (left-to-right, right-to-left) | same x 2 directions                                                     | 18     |
| Curve — C shape                                         | `--trace-path`, `--trace-path-arrows`, `--bold`                         | 3      |
| Curve — reverse C                                       | same                                                                    | 3      |
| Wave — gentle                                           | same (easy / medium / hard)                                             | 9      |
| Zigzag                                                  | same (easy / medium / hard)                                             | 9      |
| Loop — large                                            | `--trace-path`, `--trace-path-arrows`, `--bold`                         | 3      |
| Loop — small (continuous)                               | same                                                                    | 3      |
| Spiral — wide                                           | same                                                                    | 3      |
| Spiral — tight                                          | same                                                                    | 3      |
| **Subtotal**                                            |                                                                         | **72** |

#### 21.2 Guided Path Activities ("Roads")

| Activity                                                                                                          | Variants                        | Count  |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------ |
| Two-line road — straight                                                                                          | `--trace-path` (narrow / wide)  | 2      |
| Two-line road — curvy                                                                                             | same                            | 2      |
| Two-line road — zigzag                                                                                            | same                            | 2      |
| "Trace the path to the \_\_\_" overlays (animal → home, bee → flower, car → garage, boat → island, rocket → moon) | `--trace-path`                  | 5      |
| Rail tracks (stay between lines)                                                                                  | `--trace-path` (3 difficulties) | 3      |
| River path (wavy two-line)                                                                                        | `--trace-path` (3 difficulties) | 3      |
| **Subtotal**                                                                                                      |                                 | **17** |

**Design Notes:**

- All strokes must have a `--bold` variant with minimum 6px stroke width for toddler grip
- `--trace-path-arrows` shows directional cues (left-to-right for LTR, right-to-left for RTL locales)
- Path activities include a start icon (animal/vehicle) and end icon (destination) as embedded `<g>` groups

**Stroke width trap (READ THIS):**

Stroke widths are **relative to the ViewBox**, not to the rendered size. A "6px" stroke on a `0 0 200 200` canvas looks thick (3% of canvas width). The same "6px" on a `0 0 800 200` canvas looks thin (0.75% of width).

| ViewBox | "Thick" (toddler) stroke | "Medium" (preschool) stroke | "Thin" (pre-K) stroke |
|---------|-------------------------|----------------------------|----------------------|
| `0 0 200 200` | 6–8px (~3–4% width) | 4px (~2% width) | 2px (~1% width) |
| `0 0 800 200` | 24–32px (~3–4% width) | 16px (~2% width) | 8px (~1% width) |

**Rule:** Think in percentages of canvas width, not absolute pixels. "Toddler thick" = **3–4% of canvas width**. The pixel value changes depending on the ViewBox. Test print early — a stroke that looks great on screen at 96 DPI may look like a blob or a hairline on paper at 150 DPI.

---

### 22. Alphabet Picture Vocabulary (A–Z Objects)

**Used by:** Recognition, Matching, Tracing (letter-to-picture), Sorting (beginning sounds)

**Total target: ~460 SVGs** (234 phonics vocabulary + 18 Spanish + 208 ASL)

> **Why this matters:** This is the curated A–Z mapping that unlocks "Match letter to picture", "Circle pictures that start with B", and "Cut and paste into the correct letter box" worksheets. Without it, the generator must randomly pick from the general library, which is hit-or-miss for phonics.

#### 22.1 English A–Z (3 objects per letter)

| Letter       | Objects                              | Variants per object                     | Count   |
| ------------ | ------------------------------------ | --------------------------------------- | ------- |
| A            | Apple, Alligator, Astronaut          | `--simple`, `--outline`, `--silhouette` | 9       |
| B            | Ball, Bee, Banana                    | same                                    | 9       |
| C            | Cat, Car, Cookie                     | same                                    | 9       |
| D            | Dog, Duck, Drum                      | same                                    | 9       |
| E            | Elephant, Egg, Ear                   | same                                    | 9       |
| F            | Fish, Frog, Flower                   | same                                    | 9       |
| G            | Grapes, Giraffe, Guitar              | same                                    | 9       |
| H            | Hat, Horse, House                    | same                                    | 9       |
| I            | Ice cream, Igloo, Insect             | same                                    | 9       |
| J            | Jellyfish, Juice, Jacket             | same                                    | 9       |
| K            | Kite, Kangaroo, Key                  | same                                    | 9       |
| L            | Lion, Leaf, Lemon                    | same                                    | 9       |
| M            | Moon, Monkey, Muffin                 | same                                    | 9       |
| N            | Nest, Narwhal, Nut                   | same                                    | 9       |
| O            | Octopus, Orange, Owl                 | same                                    | 9       |
| P            | Penguin, Pizza, Pencil               | same                                    | 9       |
| Q            | Queen, Quilt, Question mark          | same                                    | 9       |
| R            | Rabbit, Rainbow, Robot               | same                                    | 9       |
| S            | Sun, Star, Strawberry                | same                                    | 9       |
| T            | Tree, Turtle, Train                  | same                                    | 9       |
| U            | Umbrella, Unicorn, Ukulele           | same                                    | 9       |
| V            | Violin, Volcano, Van                 | same                                    | 9       |
| W            | Whale, Watermelon, Worm              | same                                    | 9       |
| X            | X-ray, Xylophone, Fox (for ending-X) | same                                    | 9       |
| Y            | Yo-yo, Yarn, Yak                     | same                                    | 9       |
| Z            | Zebra, Zipper, Zoo                   | same                                    | 9       |
| **Subtotal** |                                      |                                         | **234** |

#### 22.2 Spanish Vocabulary Supplements (shared letters, different sounds)

| Letter       | Objects                    | Count  |
| ------------ | -------------------------- | ------ |
| CH           | Chocolate, Chivo (goat)    | 6      |
| LL           | Llave (key), Lluvia (rain) | 6      |
| N            | Nube (cloud), Nino (child) | 6      |
| **Subtotal** |                            | **18** |

**Design Notes:**

- Each object is deliberately chosen for instant kid-recognition at age 3+
- Objects should be a consistent style — same stroke weight, same "friendly face" convention for animals
- Mark each asset with `data-phonics-letter` and `data-phonics-position` (beginning / ending) attributes

#### 22.3 American Sign Language (ASL) Alphabet

> **Why this matters:** ASL hand signs are increasingly common in inclusive ECE classrooms. Pairs naturally with the existing finger counting hands and Section 25 inclusive character system. Combines motor skills with language learning.

| Asset | Variants Needed | Count |
| ----- | --------------- | ----- |
| ASL hand sign A–Z | `--filled`, `--outline` | 52 |
| ASL hand sign A–Z (skin-tone) | `--skin-tone-1` through `--skin-tone-6` (filled only) | 156 |

**Design Notes:**
- Hand proportions should match the existing finger counting hands for visual consistency
- `--outline` variants are traceable — children can trace the hand shape
- `--filled` variants show a generic skin tone; `--skin-tone-N` variants use the same 6-tone palette as finger counting (Section 2.4) and kid characters (Section 25)
- Mark each asset with `data-asl-letter="A"` through `"Z"` for generator mapping
- Reference: NAD (National Association of the Deaf) standard ASL alphabet chart

---

### 23. Color-Safe Recolorable Objects

**Used by:** Sorting (by color), Recognition (color identification), Matching (color pairs), Pattern (color sequences)

**Total target: ~98 SVGs**

> **Why this matters:** Many real-world objects look wrong when recolored (a blue banana, a green steak). This dedicated set of color-neutral objects is designed to be rendered in any color without looking bizarre — essential for "Sort by color" and "Find all the red ones" worksheets.

| Object                  | Base Asset | Color Variants         | Count  |
| ----------------------- | ---------- | ---------------------- | ------ |
| Balloon                 | `--simple` | 8 colors + `--outline` | 9      |
| Crayon                  | `--simple` | 8 colors + `--outline` | 9      |
| Building block (cube)   | `--simple` | 8 colors + `--outline` | 9      |
| Button (round)          | `--simple` | 8 colors + `--outline` | 9      |
| Bouncy ball             | `--simple` | 8 colors + `--outline` | 9      |
| T-shirt                 | `--simple` | 8 colors + `--outline` | 9      |
| Flag / Bunting triangle | `--simple` | 8 colors + `--outline` | 9      |
| Star                    | `--simple` | 8 colors + `--outline` | 9      |
| Heart                   | `--simple` | 8 colors + `--outline` | 9      |
| Paint splat             | `--simple` | 8 colors               | 8      |
| Flower (generic petal)  | `--simple` | 8 colors + `--outline` | 9      |
| **Subtotal**            |            |                        | **98** |

**Standard 8-color set:**
`--red`, `--blue`, `--green`, `--yellow`, `--purple`, `--orange`, `--pink`, `--brown`

**Design Notes:**

- Each object is a single flat shape with one primary fill area — no multi-color details
- The `--outline` variant is pure stroke, no fill — for "color it in" worksheets
- Mark each asset with `safeToRecolor: true` in manifest
- The renderer can also override fills at runtime using CSS class injection, but having pre-built color variants ensures print fidelity
- **Contrast check (required):** When the renderer injects a fill color into a color-safe asset, the asset MUST have a dark outline stroke (`--forge-outline`, min contrast ratio 3:1 against white) to remain visible on white paper. Light fills (yellow, light pink, cream) would otherwise disappear without an outline. Enforce `stroke` on all `--filled` color-safe variants

---

### 24. Routines & Social-Emotional Scenes

**Used by:** Sequence, Matching, Recognition, Sorting, Fill-in-Blank

**Total target: ~120 SVGs**

> **Why this matters:** Ages 2–5 learn through daily routines and social situations. These scene icons power "Sequence the day", "What comes next?", "Match emotion to situation", and "Good choices" worksheets — extremely popular with parents and teachers.

#### 24.1 Daily Routines

| Routine                   | Variants                | Count  |
| ------------------------- | ----------------------- | ------ |
| Wake up / Morning stretch | `--simple`, `--outline` | 2      |
| Brush teeth               | same                    | 2      |
| Wash hands                | same                    | 2      |
| Get dressed               | same                    | 2      |
| Eat breakfast             | same                    | 2      |
| Go to school / ride bus   | same                    | 2      |
| Circle time               | same                    | 2      |
| Snack time                | same                    | 2      |
| Nap time / Rest           | same                    | 2      |
| Outdoor play              | same                    | 2      |
| Story time                | same                    | 2      |
| Art time                  | same                    | 2      |
| Lunch                     | same                    | 2      |
| Clean up toys             | same                    | 2      |
| Bath time                 | same                    | 2      |
| Bedtime / Goodnight       | same                    | 2      |
| Potty / Toilet time       | same                    | 2      |
| Wash face                 | same                    | 2      |
| **Subtotal**              |                         | **36** |

#### 24.2 Social-Emotional Situations

| Situation                         | Variants                | Count  |
| --------------------------------- | ----------------------- | ------ |
| Sharing toys                      | `--simple`, `--outline` | 2      |
| Taking turns                      | same                    | 2      |
| Saying please                     | same                    | 2      |
| Saying thank you                  | same                    | 2      |
| Saying sorry                      | same                    | 2      |
| Helping a friend                  | same                    | 2      |
| Giving a hug                      | same                    | 2      |
| Listening to teacher              | same                    | 2      |
| Raising hand                      | same                    | 2      |
| Waiting in line                   | same                    | 2      |
| Being kind                        | same                    | 2      |
| Feeling scared (being brave)      | same                    | 2      |
| Feeling frustrated (calming down) | same                    | 2      |
| Feeling proud (accomplishment)    | same                    | 2      |
| Making a new friend               | same                    | 2      |
| **Subtotal**                      |                         | **30** |

#### 24.3 Classroom Moments

| Moment                        | Variants                | Count  |
| ----------------------------- | ----------------------- | ------ |
| Circle time (group on carpet) | `--simple`, `--outline` | 2      |
| Reading corner                | same                    | 2      |
| Art table / Painting          | same                    | 2      |
| Block building area           | same                    | 2      |
| Music and movement            | same                    | 2      |
| Science / Discovery table     | same                    | 2      |
| Dramatic play / Dress-up      | same                    | 2      |
| Outdoor playground            | same                    | 2      |
| Lining up                     | same                    | 2      |
| Calendar / Weather time       | same                    | 2      |
| Show and tell                 | same                    | 2      |
| **Subtotal**                  |                         | **22** |

#### 24.4 Safety & Health

| Topic                            | Variants                | Count  |
| -------------------------------- | ----------------------- | ------ |
| Stop, look, listen (road safety) | `--simple`, `--outline` | 2      |
| Stranger safety                  | same                    | 2      |
| Fire safety / Stop, drop, roll   | same                    | 2      |
| Wearing a seatbelt               | same                    | 2      |
| Covering mouth when coughing     | same                    | 2      |
| Healthy foods vs. treats         | same                    | 2      |
| Drinking water                   | same                    | 2      |
| Sleeping enough                  | same                    | 2      |
| **Subtotal**                     |                         | **16** |

---

### 25. Kid & Family Characters (Inclusive Representation)

**Used by:** All generators (guide characters, worksheet subjects, narrative framing)

**Total target: ~167 SVGs**

> **Why this matters:** Ember the Dragon is the primary app-wide mascot — it appears across all 16 engines, loading states, Zen Mode, and Journey milestones. Worksheet guide characters (Starry, Rosie) provide variety in Canvas worksheets. Inclusive representation of human characters is not optional — families and teachers expect to see themselves. See [MASCOT_SPECIFICATION.md](MASCOT_SPECIFICATION.md) for the complete Ember design brief.

#### 25.1 Child Characters (Base Set)

8 base children with diverse representation:

| Character    | Description                              | Poses/Variants                                                                               | Count  |
| ------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------- | ------ |
| Child A      | Light skin, straight brown hair          | `--waving`, `--sitting`, `--running`, `--thumbs-up`, `--thinking`, `--reading`, `--pointing` | 7      |
| Child B      | Medium skin, curly black hair            | same                                                                                         | 7      |
| Child C      | Dark skin, short natural hair            | same                                                                                         | 7      |
| Child D      | Light skin, blonde hair, glasses         | same                                                                                         | 7      |
| Child E      | Medium-dark skin, long braids            | same                                                                                         | 7      |
| Child F      | East Asian features, straight black hair | same                                                                                         | 7      |
| Child G      | Medium skin, red/auburn hair, freckles   | same                                                                                         | 7      |
| Child H      | Light-medium skin, hijab                 | same                                                                                         | 7      |
| **Subtotal** |                                          |                                                                                              | **56** |

#### 25.2 Accessibility Variants

| Character               | Variant                                              | Poses | Count  |
| ----------------------- | ---------------------------------------------------- | ----- | ------ |
| Child in wheelchair     | `--waving`, `--reading`, `--thumbs-up`, `--pointing` | 4     | 4      |
| Child with hearing aids | same                                                 | 4     | 4      |
| Child with arm crutch   | same                                                 | 4     | 4      |
| Child with service dog  | `--walking`, `--sitting`                             | 2     | 2      |
| **Subtotal**            |                                                      |       | **14** |

#### 25.3 Caregiver / Adult Characters

| Character                               | Variants                                    | Count  |
| --------------------------------------- | ------------------------------------------- | ------ |
| Teacher (female, diverse x2 skin tones) | `--standing`, `--reading`, `--pointing`     | 6      |
| Teacher (male, diverse x2 skin tones)   | same                                        | 6      |
| Parent / Guardian (female, diverse x2)  | `--standing`, `--holding-child`, `--waving` | 6      |
| Parent / Guardian (male, diverse x2)    | same                                        | 6      |
| Grandparent (female, diverse x2)        | `--standing`, `--reading`                   | 4      |
| Grandparent (male, diverse x2)          | same                                        | 4      |
| **Subtotal**                            |                                             | **32** |

#### 25.4 Ember the Dragon — Primary App Mascot

> **Why a baby dragon?** Research confirmed: no major children's ed-tech product uses a baby dragon as an interactive companion mascot. This is genuine whitespace. Dragons offer unlimited emotional range (wings, tail, glow), a built-in growth narrative ("growing wings" = Journey milestones), and work for both kids and adults on UI screens. Ember does not breathe fire — it glows softly. See [MASCOT_SPECIFICATION.md](MASCOT_SPECIFICATION.md) for the full designer brief.

| Mascot           | Role                         | Description                                                    | Expressions/Variants                                                                                                                                                                                                                                                          | Count  |
| ---------------- | ---------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Ember the Dragon | **PRIMARY** — app-wide guide | Baby dragon, sage green body, warm cream belly, stubby wings   | `--idle`, `--happy`, `--thinking`, `--confused`, `--sleepy`, `--dreaming`, `--celebrating`, `--relieved`, `--pointing`, `--peeking` (hidden find-me), `--waving`, `--reading`, `--surprised`, `--encouraging`, `--speech-bubble`, `--tiny` (corner stamp), `--silhouette`     | 17     |
| **Subtotal**     |                              |                                                                |                                                                                                                                                                                                                                                                               | **17** |

**Ember's Color System:**
- Body: Sage green `#9CAF88`
- Belly / inner wings: Warm cream `#F5EDE0`
- Eyes: Warm brown `#5C4033`
- Celebration glow (only): Gold `#F5C842` — this is a reward color, NOT a default UI color

**Ember's Anatomy Rules (non-negotiable):**
- No visible teeth (ever)
- No flames / fire breath
- Horns = tiny nubs only
- Wings = stubby, rounded, non-threatening
- Tail = soft curl, never spiky
- No claws emphasized (rounded paws)
- Head-to-body ratio: 1:3 (plush toy proportions)

#### 25.4b Worksheet Guide Characters (Canvas Engine Only)

Starry and Rosie appear **only within Canvas worksheets** for variety. They do NOT appear in platform UI, Zen Mode, Journey milestones, or loading states.

| Character          | Role                      | Description                    | Poses/Variants                                                                                                                                                                       | Count  |
| ------------------ | ------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| Starry the Penguin | Worksheet guide character | Friendly penguin, blue scarf   | `--waving`, `--thinking`, `--pointing`, `--celebrating`, `--reading`, `--magnifying-glass`, `--speech-bubble`, `--tiny` (corner stamp), `--peeking` (hidden find-me), `--silhouette` | 10     |
| Rosie the Fox      | Worksheet guide character | Clever fox, flower crown       | same                                                                                                                                                                                 | 10     |
| **Subtotal**       |                           |                                |                                                                                                                                                                                      | **20** |

> **"Find Me!" mini-game:** The `--tiny` and `--peeking` mascot variants can be placed in a corner of any worksheet. "Can you spot Ember?" adds a scavenger hunt element to every page at zero generator complexity. Starry and Rosie can also appear as surprise "Find Me!" targets for variety.

#### 25.5 Speech Bubbles & Thought Clouds

| Asset                          | Variants                                  | Count  |
| ------------------------------ | ----------------------------------------- | ------ |
| Speech bubble (oval)           | `--left`, `--right`, `--small`, `--large` | 4      |
| Thought cloud                  | same                                      | 4      |
| Exclamation bubble             | `--left`, `--right`                       | 2      |
| Question bubble                | same                                      | 2      |
| "Good job!" pre-filled bubble  | `--simple`                                | 1      |
| "Try again!" pre-filled bubble | `--simple`                                | 1      |
| **Subtotal**                   |                                           | **14** |

**Design Notes:**

- All child characters use the same body proportions (head-to-body ratio ~1:3 for toddler feel)
- Skin tones follow a 6-tone inclusive palette (not just "light/medium/dark")
- Hair, clothing, and accessories are modular `<g>` groups so the renderer can mix if needed
- Ember must be recognizable at 32x32px (`--tiny` variant) and 200x200px (full). All expressions must be readable at 32–48px — eyes do 70% of the work
- Worksheet guide characters (Starry, Rosie) should be recognizable at 24x24px

---

### 26. Micro-Scenes & Backdrop Strips

**Used by:** All generators (worksheet background/chrome, not the activity itself)

**Total target: ~50 SVGs**

> **Why this matters:** Full hidden-picture scenes are complex and expensive. Micro-scenes are lightweight decorative elements that make every worksheet feel "premium" without high production cost. A grass strip at the bottom or a classroom banner at the top instantly elevates a plain page.

#### 26.1 Top Banner Strips (page header decorations)

| Scene                                | Variants                 | Count  |
| ------------------------------------ | ------------------------ | ------ |
| Classroom bunting (triangular flags) | `--simple`, `--colorful` | 2      |
| Cloud and sun sky strip              | `--simple`, `--outline`  | 2      |
| Star and moon night strip            | same                     | 2      |
| Jungle vine canopy strip             | same                     | 2      |
| Ocean wave crest strip               | same                     | 2      |
| Rainbow arc strip                    | `--simple`               | 1      |
| **Subtotal**                         |                          | **11** |

#### 26.2 Bottom Ground Strips (page footer decorations)

| Scene                        | Variants                | Count  |
| ---------------------------- | ----------------------- | ------ |
| Grass and flowers ground     | `--simple`, `--outline` | 2      |
| Sandy beach ground           | same                    | 2      |
| Snowy ground with snowdrifts | same                    | 2      |
| City skyline ground          | same                    | 2      |
| Ocean floor (sand + coral)   | same                    | 2      |
| Farm fence ground            | same                    | 2      |
| **Subtotal**                 |                         | **12** |

#### 26.3 Corner Vignettes (quarter-page decorative fills)

| Scene                                 | Variants   | Count |
| ------------------------------------- | ---------- | ----- |
| Classroom corner (bookshelf + rug)    | `--simple` | 1     |
| Playground corner (swing + tree)      | `--simple` | 1     |
| Bedroom corner (bed + lamp)           | `--simple` | 1     |
| Kitchen corner (counter + fruit bowl) | `--simple` | 1     |
| Park bench + tree                     | `--simple` | 1     |
| Garden patch + watering can           | `--simple` | 1     |
| **Subtotal**                          |            | **6** |

#### 26.4 Full-Width Backdrop Panels (for two-row worksheets)

| Scene                                 | Variants                | Count  |
| ------------------------------------- | ----------------------- | ------ |
| Indoor classroom (wide, low-detail)   | `--simple`, `--outline` | 2      |
| Outdoor playground (wide, low-detail) | same                    | 2      |
| Farm panorama                         | same                    | 2      |
| Underwater panorama                   | same                    | 2      |
| Space panorama                        | same                    | 2      |
| Forest panorama                       | same                    | 2      |
| City street panorama                  | same                    | 2      |
| **Subtotal**                          |                         | **14** |

**Design Notes:**

- All strips use a wide aspect ratio: viewBox `0 0 800 100` (banner) or `0 0 800 120` (ground)
- Corner vignettes use viewBox `0 0 200 200` and are designed to sit in a page quadrant
- Backdrop panels use viewBox `0 0 800 200`
- Keep detail minimal — these should enhance, not distract from, the worksheet activity
- Every scene must print well in grayscale (`--outline` variant)

---

### 27. Manipulatives & Activity Templates

**Used by:** Cutting, Matching, Sorting, Counting (transforms worksheets into hands-on activities)

**Total target: ~55 SVGs**

> **Why this matters:** These templates transform a flat worksheet into an interactive activity page. Match cards, sorting mats, and spinners make worksheets feel like games, not homework. This is one of the biggest "wow" differentiators for parents and teachers.

#### 27.1 Match Cards (cut-out card templates)

| Template                                      | Variants                                    | Count |
| --------------------------------------------- | ------------------------------------------- | ----- |
| Card front frame (rounded rectangle)          | `--2x2-grid`, `--2x3-grid`, `--3x3-grid`    | 3     |
| Card back pattern (for memory game flip-side) | `--stars`, `--stripes`, `--dots`, `--plain` | 4     |
| Mini card (half-size, for matching pairs)     | `--2x4-grid`, `--2x5-grid`                  | 2     |
| **Subtotal**                                  |                                             | **9** |

#### 27.2 Sorting Mats

| Template                                       | Variants                                    | Count  |
| ---------------------------------------------- | ------------------------------------------- | ------ |
| Two-column mat ("Put **_ here / Put _** here") | `--simple`, `--themed` (farm, ocean, space) | 4      |
| Three-column mat                               | same                                        | 4      |
| Venn diagram (two circles, overlapping)        | `--simple`                                  | 1      |
| Category boxes (4 quadrants)                   | `--simple`, `--themed`                      | 2      |
| **Subtotal**                                   |                                             | **11** |

#### 27.3 Cut-and-Paste Targets

| Template                                         | Variants                                 | Count |
| ------------------------------------------------ | ---------------------------------------- | ----- |
| Paste target boxes (dotted outline, "Glue here") | `--row-of-3`, `--row-of-4`, `--row-of-5` | 3     |
| Paste target circles                             | same                                     | 3     |
| Glue icon (mini glue bottle indicator)           | `--simple`                               | 1     |
| Scissors icon with cut line                      | `--simple`                               | 1     |
| **Subtotal**                                     |                                          | **8** |

#### 27.4 Spinners & Dice

| Template                                      | Variants                                       | Count  |
| --------------------------------------------- | ---------------------------------------------- | ------ |
| Spinner circle (divided into sections)        | `--3-sections`, `--4-sections`, `--6-sections` | 3      |
| Spinner arrow (separate overlay)              | `--simple`                                     | 1      |
| "Use a paperclip and pencil" instruction icon | `--simple`                                     | 1      |
| Dice face (1–6 dots)                          | `--simple` x 6                                 | 6      |
| Roll prompt frame ("Roll and \_\_\_")         | `--simple`                                     | 1      |
| **Subtotal**                                  |                                                | **12** |

#### 27.5 Progress & Reward Templates

| Template                                          | Variants                                       | Count |
| ------------------------------------------------- | ---------------------------------------------- | ----- |
| Sticker strip (bottom-of-page, 5 circles to fill) | `--simple`, `--star-shaped`, `--animal-shaped` | 3     |
| Progress passport page (10 stamp slots)           | `--simple`, `--themed`                         | 2     |
| Completion certificate frame                      | `--simple`, `--fancy`                          | 2     |
| "I can \_\_\_!" achievement banner                | `--simple`                                     | 1     |
| **Subtotal**                                      |                                                | **8** |

**Design Notes:**

- All manipulative templates include `--cut-guide` dashed lines where cutting is expected
- Card templates include a `data-card-slot` attribute per card position for renderer content injection
- Spinner circles include `data-section-id` per wedge for dynamic label injection
- Sorting mats include `data-category-slot` per column/box

---

### 28. Wow-Factor Activity Packs

**Used by:** Multiple generators combined (these are "experience" templates, not single-generator assets)

**Total target: ~115 SVGs**

> **Why this matters:** These packs are the difference between "useful educational tool" and "kids beg to do more." Each pack creates a mini-game or creative activity experience that parents share on social media and teachers recommend to each other.

#### 28.1 Build-a-Character (Cut + Assemble)

Modular body part SVGs with alignment anchors so kids cut out and assemble characters.

| Character Set              | Parts                                                                       | Count  |
| -------------------------- | --------------------------------------------------------------------------- | ------ |
| Build a Robot              | 3 heads, 3 bodies, 3 leg sets, 6 accessories (antenna, arms, eyes)          | 15     |
| Build a Monster (friendly) | 3 heads, 3 bodies, 3 leg sets, 6 accessories (horns, wings, tails)          | 15     |
| Build a Dinosaur           | 3 heads, 3 bodies, 3 tail/leg sets, 6 accessories (spikes, plates, hats)    | 15     |
| Build a Face (mix & match) | 4 face shapes, 5 eye pairs, 4 noses, 5 mouths, 4 hair styles, 4 accessories | 26     |
| **Subtotal**               |                                                                             | **71** |

**Design Notes:**

- Every part has `data-anchor-point` and `data-attach-to` attributes for alignment
- Parts should have flat bottoms/tops that "stack" visually
- Include a "base template" SVG showing the assembly silhouette

#### 28.2 Mystery Reveal Pages

Worksheets where completing the activity reveals a hidden picture.

| Reveal Type              | Templates                                                                             | Count  |
| ------------------------ | ------------------------------------------------------------------------------------- | ------ |
| Color-by-number reveals  | 5 hidden images (dinosaur, rocket, butterfly, castle, mermaid) with numbered sections | 5      |
| Color-by-shape reveals   | 5 hidden images with shape-coded sections (circles=blue, squares=red, etc.)           | 5      |
| Connect-the-dots reveals | (Already covered in Section 16)                                                       | 0      |
| Trace-the-path reveals   | 5 paths where tracing reveals what's at the end (treasure, home, friend)              | 5      |
| **Subtotal**             |                                                                                       | **15** |

**Design Notes:**

- Each reveal image needs a `--segmented` variant (numbered/shaped sections) and a `--completed` variant
- Color-by-number sections use `data-section-number` attributes
- Color-by-shape sections use `data-section-shape` attributes

#### 28.3 Maze Collectibles Expansion

Expand maze collectibles beyond the 5 basic items in Section 19.

| Theme        | Collectible Set (5 items each)                      | Count  |
| ------------ | --------------------------------------------------- | ------ |
| Ocean        | Shell, pearl, seahorse, starfish, coral             | 5      |
| Space        | Star, planet, rocket fuel, alien gem, comet         | 5      |
| Farm         | Egg, apple, carrot, milk bottle, sunflower          | 5      |
| Fairy tale   | Crown, gem, magic wand, key, golden apple           | 5      |
| Pirate       | Gold coin, diamond, treasure map piece, pearl, ruby | 5      |
| **Subtotal** |                                                     | **25** |

#### 28.4 Sticker Collection Pages

Full-page "sticker book" templates where kids earn/place stickers.

| Template                               | Variants                                | Count |
| -------------------------------------- | --------------------------------------- | ----- |
| Weekly sticker chart (Mon–Fri, 5 rows) | `--simple`, `--themed` (animals, space) | 3     |
| "My Favorites" page (6 labeled slots)  | `--simple`                              | 1     |
| **Subtotal**                           |                                         | **4** |

---

### 29. Pre-Coding Logic Arrows (Unplugged STEM)

**Used by:** Sequence, Pattern, Recognition, Fill-in-Blank

**Total target: ~12 SVGs**

> **Why this matters:** "Unplugged coding" (coding without a screen) is a booming segment in early childhood STEM. "Guide the Bee to the Flower" grid worksheets teach sequencing, directionality, and basic algorithmic thinking. These blocky directional arrows are a specific visual language distinct from the general shape arrows in Section 3.

#### 29.1 Directional Blocks

| Asset | Variants Needed | Count |
| ----- | --------------- | ----- |
| Code arrow — forward | `--filled`, `--outline` | 2 |
| Code arrow — turn left | `--filled`, `--outline` | 2 |
| Code arrow — turn right | `--filled`, `--outline` | 2 |
| Code block — loop (repeat arrow) | `--filled`, `--outline` | 2 |

#### 29.2 Grid Map Tiles

| Asset | Variants Needed | Count |
| ----- | --------------- | ----- |
| Grid tile — empty (path square) | `--filled`, `--outline` | 2 |
| Grid tile — start (flag/character) | `--filled` | 1 |
| Grid tile — end (star/goal) | `--filled` | 1 |

**Design Notes:**
- Code arrows use a **blocky, rounded** style — they should look like physical coding blocks (Cubetto / Botley style), not abstract vector arrows
- Grid tiles are square, snap-aligned, and compositable — the generator tiles them into NxN grids
- Color: use bright, distinct fills (green=forward, yellow=turn left, blue=turn right, purple=loop) so children can sort by instruction type
- These assets pair with any character from Section 25 or the mascot system as the "robot" being directed

---

### 30. Geography & Maps (Simple Recognition)

**Used by:** Sorting (habitats), Coloring, Matching (animals to continents), Recognition

**Total target: ~35 SVGs**

> **How this differs from Section 9.3 (Nature Scenes):** Section 9.3 provides full-page *background scenes* (desert, ocean, arctic). This section provides *isolated icons* — a simple "Island" shape, a continent outline — that a child can circle, color, cut out, or match with animals. Together they unlock "Map Maker" worksheets and "Habitat Sorting" activities ("Draw a line from the Penguin to the Iceberg").

#### 30.1 The World & Continents

> **Why this matters:** "Montessori Geography" is popular in preschool. Kids love matching animals to their home continent.

| Asset | Variants | Count |
| ----- | -------- | ----- |
| Globe / Earth | `--simple`, `--outline`, `--land-water` (for coloring) | 3 |
| World Map (flat projection) | `--simple` (just continent blobs), `--outline` | 2 |
| North America (outline) | `--simple`, `--outline` | 2 |
| South America (outline) | `--simple`, `--outline` | 2 |
| Europe (outline) | `--simple`, `--outline` | 2 |
| Asia (outline) | `--simple`, `--outline` | 2 |
| Africa (outline) | `--simple`, `--outline` | 2 |
| Australia / Oceania (outline) | `--simple`, `--outline` | 2 |
| Antarctica (outline) | `--simple`, `--outline` | 2 |

**Design Notes:**
- `--simple` filled variants can optionally support Montessori color coding (Asia=Yellow, Africa=Green, N. America=Orange, S. America=Pink, Europe=Red, Australia=Brown, Antarctica=White)
- Continent shapes should be recognizable blobs, not detailed coastlines — accuracy is less important than recognizability at 48px

#### 30.2 Landforms (Land vs. Water)

> **Why this matters:** "Island vs. Lake" is a classic Montessori geography lesson (land surrounded by water vs. water surrounded by land).

| Asset | Variants | Count |
| ----- | -------- | ----- |
| Island (land surrounded by water) | `--simple`, `--outline` | 2 |
| Lake / Pond (water surrounded by land) | `--simple`, `--outline` | 2 |
| Mountain / Range | `--simple`, `--outline` | 2 |
| Volcano (exterior view) | `--simple`, `--outline` | 2 |
| River (winding path) | `--simple`, `--outline` | 2 |
| Desert dunes | `--simple`, `--outline` | 2 |
| Iceberg | `--simple`, `--outline` | 2 |
| Waterfall | `--simple`, `--outline` | 2 |

#### 30.3 Map Symbols (Treasure & Town)

> **Why this matters:** "Make your own map" cut-and-paste activities. Pairs with Section 29 (pre-coding grid tiles) for "Follow the map" sequencing worksheets.

| Asset | Variants | Count |
| ----- | -------- | ----- |
| X Marks the Spot | `--simple`, `--outline` | 2 |
| Compass Rose (N, S, E, W) | `--simple`, `--outline` | 2 |
| Road / Path segment | `--straight`, `--curved`, `--corner` | 3 |
| Map Key / Legend box | `--simple` | 1 |

---

## Asset Count Summary

| #   | Category                              | Estimated Count |
| --- | ------------------------------------- | --------------- |
| 1   | Alphabet & Letter Tracing             | ~580            |
| 2   | Numbers & Math Symbols                | ~299            |
| 3   | Shapes & Geometry                     | ~215            |
| 4   | Animals                               | ~522            |
| 5   | Space & Solar System                  | ~102            |
| 6   | Festivals & Cultural                  | ~346            |
| 7   | Food & Drink                          | ~122            |
| 8   | Vehicles & Transportation             | ~96             |
| 9   | Nature & Weather                      | ~107            |
| 10  | Community Helpers                     | ~88             |
| 11  | Household & Objects                   | ~106            |
| 12  | Human Body & Senses                   | ~52             |
| 13  | Music & Instruments                   | ~34             |
| 14  | Sports & Activities                   | ~34             |
| 15  | Cutting Practice                      | ~55             |
| 16  | Dot-to-Dot Outlines                   | ~60             |
| 17  | Hidden-Picture Scenes                 | ~20             |
| 18  | Labeling Diagrams                     | ~24             |
| 19  | Maze Elements                         | ~20             |
| 20  | Decorative & UI Elements              | ~83             |
|     | **Subtotal (Core Library)**           | **~2,965**      |
|     |                                       |                 |
|     | **--- Age 2–5 Enhancement Packs ---** |                 |
| 21  | Pre-Writing Strokes                   | ~89             |
| 22  | Alphabet Picture Vocabulary + ASL     | ~460            |
| 23  | Color-Safe Recolorable Objects        | ~98             |
| 24  | Routines & Social-Emotional Scenes    | ~104            |
| 25  | Kid & Family Characters (Inclusive)   | ~153            |
| 26  | Micro-Scenes & Backdrop Strips        | ~43             |
| 27  | Manipulatives & Activity Templates    | ~48             |
| 28  | Wow-Factor Activity Packs             | ~115            |
| 29  | Pre-Coding Logic Arrows               | ~12             |
| 30  | Geography & Maps                      | ~35             |
|     | **Subtotal (Age 2–5 Packs)**          | **~1,157**      |
|     |                                       |                 |
|     | **GRAND TOTAL**                       | **~4,122**      |

> **Scaling to 5,000+:** Designers should multiply the base library by creating additional emotion/pose variants (`--excited`, `--waving`, `--sitting`, `--running`), color re-skins, and seasonal variants of popular assets. The modular character system (Section 25) alone can generate hundreds of combinations from ~146 base parts. A target of **5,000–6,000 total SVGs** is achievable by expanding variants within each category.

---

## Generator-to-Asset Mapping

This table shows which asset categories each generator requires:

| Generator          | Required Asset Categories                                                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tracing**        | 1 (Letters), 2 (Numbers), 3 (Shapes), **21 (Pre-Writing Strokes)**, **22 (Alphabet Vocab — letter-to-picture, ASL hand signs)**                                         |
| **Recognition**    | 4 (Animals), 5 (Space), 7 (Food), 8 (Vehicles), 10 (Community), 11 (Household), 13 (Music), **22 (Alphabet Vocab)**, **23 (Color-Safe Objects)**, **24 (Routines/SEL)** |
| **Matching**       | 4, 5, 7, 8, 10, 11, 13, 14, **22 (letter-to-picture pairs)**, **23 (color matching)**, **24 (emotion-to-situation)**                                                    |
| **Counting**       | 2 (Counting aids, base ten blocks, fractions, play money, telling time), 4, 7, 8, 11, 14, **23 (Color-Safe — countable items)**                                          |
| **Pattern**        | 3 (Shapes), 7 (Food), 4 (Animals), **23 (Color-Safe — color sequences)**                                                                                                |
| **Sequence**       | 2 (Numbers), 4 (Animals lifecycle), 5 (Planets order), 9 (Seasons), **24 (Routines — daily sequence)**, **29 (Pre-Coding — directional sequences)**                     |
| **Maze**           | 19 (Maze Elements), 20 (Decorative), **28.3 (Themed Collectibles)**                                                                                                     |
| **Sorting**        | 4, 7, 8, 9, 10, 11, 13, **23 (Color-Safe — sort by color)**, **24 (Routines — categorize)**, **27.2 (Sorting Mats)**, **30 (Geography — habitat sorting)**              |
| **Dot Connect**    | 16 (Dot-to-Dot Outlines), **28.2 (Mystery Reveal)**                                                                                                                     |
| **Cutting**        | 15 (Cutting Practice Shapes), **27 (Manipulatives — cards, mats)**, **28.1 (Build-a-Character)**                                                                        |
| **Hidden Picture** | 17 (Hidden-Picture Scenes), **25.4 (Ember "Find Me!" variants)**, **25.4b (Starry/Rosie "Find Me!" variants)**                                                         |
| **Labeling**       | 12 (Body), 18 (Labeling Diagrams)                                                                                                                                       |
| **Fill-in-Blank**  | 20 (Decorative/thematic borders only; text is AI-generated)                                                                                                             |
| **All Generators** | 6 (Festivals — themed overlays), 20 (Decorative — borders, UI, stickers), **25.4 (Ember — primary mascot)**, **25.4b (Worksheet guides)**, **26 (Micro-Scenes — page chrome)** |

---

## Theme System Integration

Themes apply a color palette + decorative overlay to any generator. The designer should ensure each major theme has:

1. **A border/frame SVG**
2. **3–5 thematic clipart items** for decoration
3. **A color palette definition** (CSS custom properties)

### Core Themes

| Theme ID       | Theme Name        | Primary Colors              | Key Assets                           |
| -------------- | ----------------- | --------------------------- | ------------------------------------ |
| `ocean`        | Ocean Adventure   | Blues, teals, sandy         | Fish, waves, coral, submarine        |
| `farm`         | Happy Farm        | Greens, browns, reds        | Barn, tractor, animals               |
| `space`        | Outer Space       | Dark blue, purples, silver  | Rockets, planets, stars              |
| `jungle`       | Jungle Safari     | Greens, browns, oranges     | Vines, parrots, monkeys              |
| `garden`       | Flower Garden     | Pinks, greens, yellows      | Flowers, butterflies, bees           |
| `dinosaur`     | Dino World        | Greens, oranges, purples    | Dinosaurs, volcanoes, ferns          |
| `arctic`       | Arctic Wonderland | White, ice blue, silver     | Penguins, polar bears, igloos        |
| `construction` | Build It!         | Yellows, oranges, grays     | Trucks, tools, hard hats             |
| `fairy-tale`   | Once Upon a Time  | Purples, pinks, golds       | Castle, crown, wand, unicorn         |
| `pirate`       | Pirate Treasure   | Reds, browns, golds         | Ship, treasure, map, parrot          |
| `superhero`    | Super Kids        | Bold reds, blues, yellows   | Cape, mask, lightning bolt, shield   |
| `camping`      | Camp Out          | Greens, browns, oranges     | Tent, campfire, flashlight, s'mores  |
| `rainbow`      | Rainbow World     | Full spectrum               | Clouds, rainbow arcs, colorful items |
| `music`        | Music Time        | Purples, blues, yellows     | Notes, instruments, speakers         |
| `sports`       | Game Day          | Greens, whites, team colors | Balls, medals, whistles              |

### Seasonal Themes

| Theme ID | Season        | Primary Colors            | Key Assets                          |
| -------- | ------------- | ------------------------- | ----------------------------------- |
| `spring` | Spring        | Pinks, greens, light blue | Flowers, rain, chicks, bunnies      |
| `summer` | Summer        | Bright yellows, blues     | Sun, beach, ice cream, sandcastle   |
| `fall`   | Fall / Autumn | Oranges, reds, browns     | Leaves, pumpkins, apples, scarecrow |
| `winter` | Winter        | White, ice blue, silver   | Snowflakes, mittens, hot cocoa      |

### Festival Themes

Each festival from Category 6 maps to a theme. The festival assets + a border + a color palette form the complete theme package.

---

## Delivery Format & Organization

### Directory Structure

```
assets/
├── svg/
│   ├── animals/
│   │   ├── farm/
│   │   ├── ocean/
│   │   ├── jungle/
│   │   ├── woodland/
│   │   ├── pets/
│   │   ├── bugs/
│   │   ├── dinosaurs/
│   │   ├── arctic/
│   │   └── birds/
│   ├── letters/
│   │   ├── uppercase/
│   │   ├── lowercase/
│   │   ├── spanish/
│   │   ├── french/
│   │   ├── chinese/
│   │   ├── arabic/
│   │   └── korean/
│   ├── numbers/
│   │   ├── digit/
│   │   ├── words/
│   │   ├── symbols/
│   │   └── counting/
│   ├── shapes/
│   │   ├── basic/
│   │   ├── 3d/
│   │   └── pattern-elements/
│   ├── space/
│   │   ├── planets/
│   │   ├── objects/
│   │   └── scenes/
│   ├── festivals/
│   │   ├── christmas/
│   │   ├── hanukkah/
│   │   ├── diwali/
│   │   ├── lunar-new-year/
│   │   ├── halloween/
│   │   ├── thanksgiving/
│   │   ├── easter/
│   │   ├── eid/
│   │   ├── kwanzaa/
│   │   ├── valentines/
│   │   ├── st-patricks/
│   │   ├── independence-day/
│   │   ├── day-of-dead/
│   │   ├── holi/
│   │   └── back-to-school/
│   ├── food/
│   │   ├── fruits/
│   │   ├── vegetables/
│   │   ├── prepared/
│   │   └── drinks/
│   ├── vehicles/
│   ├── nature/
│   │   ├── weather/
│   │   ├── trees-plants/
│   │   └── scenes/
│   ├── community/
│   │   ├── helpers/
│   │   └── equipment/
│   ├── household/
│   │   ├── furniture/
│   │   ├── clothing/
│   │   └── toys/
│   ├── body/
│   ├── music/
│   ├── sports/
│   ├── cutting/
│   ├── dot-to-dot/
│   ├── hidden-picture/
│   ├── labeling/
│   ├── maze/
│   ├── decorative/
│   │   ├── borders/
│   │   ├── corners/
│   │   ├── icons/
│   │   └── stickers/
│   │
│   │   # --- Age 2–5 Enhancement Packs ---
│   ├── prewriting/
│   │   ├── strokes/           # Lines, curves, zigzags, loops, spirals
│   │   └── roads/             # Two-line guided path activities
│   ├── phonics/
│   │   ├── en/                # A–Z picture vocabulary (3 objects per letter)
│   │   └── es/                # Spanish supplements (CH, LL, Ñ)
│   ├── color-safe/            # Recolorable objects (balloon, block, etc.)
│   ├── routines/
│   │   ├── daily/             # Wake up, brush teeth, bedtime, etc.
│   │   ├── social/            # Sharing, taking turns, saying sorry, etc.
│   │   ├── classroom/         # Circle time, art table, playground, etc.
│   │   └── safety/            # Road safety, fire safety, hygiene
│   ├── characters/
│   │   ├── children/          # 8 diverse base children, 7 poses each
│   │   ├── accessibility/     # Wheelchair, hearing aids, crutch variants
│   │   ├── adults/            # Teachers, parents, grandparents
│   │   ├── ember/             # PRIMARY MASCOT: Ember the Dragon (17 expressions)
│   │   ├── worksheet-guides/  # Starry the Penguin, Rosie the Fox (Canvas only)
│   │   └── speech-bubbles/    # Speech, thought, exclamation bubbles
│   ├── micro-scenes/
│   │   ├── banners/           # Top-of-page sky/bunting strips
│   │   ├── grounds/           # Bottom-of-page grass/sand/snow strips
│   │   ├── corners/           # Quarter-page vignettes
│   │   └── backdrops/         # Full-width low-detail panoramas
│   ├── manipulatives/
│   │   ├── cards/             # Match card grids, card backs
│   │   ├── sorting-mats/      # 2-column, 3-column, Venn, quadrant
│   │   ├── cut-paste/         # Paste targets, glue/scissors icons
│   │   ├── spinners/          # Section circles, arrows, dice
│   │   └── rewards/           # Sticker strips, passports, certificates
│   └── wow-packs/
│       ├── build-a-character/ # Modular robot/monster/dino/face parts
│       ├── mystery-reveal/    # Color-by-number/shape, trace-to-reveal
│       ├── maze-collectibles/ # Themed collectible sets
│       └── sticker-pages/     # Weekly charts, "my favorites" pages
├── themes/
│   ├── ocean/
│   │   ├── palette.json
│   │   ├── border--ocean.svg
│   │   └── clipart/
│   ├── farm/
│   ├── space/
│   └── ... (one directory per theme)
└── manifest.json         # Machine-readable index of all assets
```

### manifest.json Format

Each SVG should be registered in a manifest for the Forge renderer:

```json
{
  "version": "2.0.0",
  "assets": [
    {
      "id": "animals/farm/cow--happy",
      "path": "svg/animals/farm/cow--happy.svg",
      "category": "animals",
      "subcategory": "farm",
      "slug": "cow",
      "variant": "happy",
      "tags": ["animal", "farm", "cow", "mammal"],
      "ageGroups": ["toddler", "preschool", "pre_k", "school_age"],
      "generators": ["recognition", "matching", "counting", "sorting", "dot_connect"],
      "themes": ["farm"],
      "dimensions": { "width": 200, "height": 200 },
      "fileSizeBytes": 4200,

      "difficulty": 2,
      "visualComplexity": "low",
      "minStrokeWidthClass": "toddler",
      "inkCoverage": "medium",
      "safeToRecolor": false,

      "phonicsLetter": null,
      "phonicsPosition": null
    }
  ]
}
```

### Manifest Metadata Fields (Age-Appropriate Selection)

These fields allow the Forge generator to pick age-appropriate assets automatically:

| Field                 | Type      | Values                                | Purpose                                                                             |
| --------------------- | --------- | ------------------------------------- | ----------------------------------------------------------------------------------- |
| `difficulty`          | `number`  | `1`–`5`                               | Overall complexity. 1 = simplest (age 2), 5 = most complex (age 5+)                 |
| `visualComplexity`    | `enum`    | `"low"`, `"medium"`, `"high"`         | Detail level. Low = bold outlines, few elements. High = fine detail, many parts     |
| `minStrokeWidthClass` | `enum`    | `"toddler"`, `"preschool"`, `"pre_k"` | Minimum stroke width tier. Toddler = 6px+, Preschool = 4px+, Pre-K = 2px+           |
| `inkCoverage`         | `enum`    | `"low"`, `"medium"`, `"high"`         | How much ink the asset uses when printed. Low = outline only. High = heavy fills    |
| `safeToRecolor`       | `boolean` | `true` / `false`                      | Whether the asset looks natural in any color (true for balloons, false for bananas) |
| `phonicsLetter`       | `string?` | `"A"`–`"Z"` or `null`                 | For alphabet picture vocabulary (Section 22) — which letter this object teaches     |
| `phonicsPosition`     | `enum?`   | `"beginning"`, `"ending"`, `null`     | Whether the phonics letter appears at the start or end of the object's name         |

### Manifest Ownership

> Designers do NOT hand-edit `manifest.json`.

**Workflow:**

1. Designers deliver SVG files (following the folder/naming convention) + a simple metadata spreadsheet (CSV or Google Sheet) with columns: `slug`, `category`, `subcategory`, `variant`, `tags`, `ageGroups`, `difficulty`, `minStrokeWidthClass`, `inkCoverage`, `safeToRecolor`, `phonicsLetter`
2. Engineering runs a build script that scans the SVG filesystem and merges the metadata sheet to generate/update `manifest.json` automatically
3. The build script also validates file naming, viewBox presence, file size limits, and ID prefixing

This keeps production fast and reduces errors from manual JSON editing.

---

## Priority Tiers for Designer

> **Re-balanced for age 2–5:** The original tiers focused on generator unlock order. These revised tiers front-load the assets that show up on _every_ worksheet and have the biggest impact on perceived quality for toddlers and preschoolers.

### Tier 0: Toddler Foundations (age 2–3, highest ROI — do first)

These assets appear on the most worksheets and are the #1 gap for ages 2–3.

- **Pre-writing strokes** (Section 21) — all stroke paths + 5 guided roads — **89 SVGs**
- **Alphabet picture vocabulary A–Z** (Section 22) — 3 objects per letter x 3 variants — **234 SVGs**
- **Ember the Dragon** (Section 25.4) — primary app mascot, 17 expression variants — **17 SVGs**
- **Worksheet guide characters** (Section 25.4b) — Starry + Rosie x 10 poses — **20 SVGs**
- **Speech bubbles** (Section 25.5) — all variants — **14 SVGs**

**Tier 0 Total: ~374 SVGs**

### Tier 1: MVP Core (Free-tier generators)

- Uppercase letters A–Z (trace path + block) — 52 SVGs
- Lowercase letters a–z (trace path + block) — 52 SVGs
- Digits 0–9 (trace path + block + dotted) — 30 SVGs
- Basic shapes (14 shapes x 4 variants) — 56 SVGs
- Farm animals (13 animals x 3 variants) — 39 SVGs
- Ocean animals (10 animals x 3 variants) — 30 SVGs
- Common fruits (10 x 2 variants) — 20 SVGs
- Worksheet UI icons — 17 SVGs
- Simple borders (5 styles) — 5 SVGs

**Tier 1 Total: ~301 SVGs**

### Tier 2: Age 2–5 Delight (shows up everywhere, massive perceived-quality boost)

- **Kid characters** (Section 25.1–25.2) — 8 diverse children + accessibility — **70 SVGs**
- **Color-safe recolorable objects** (Section 23) — **98 SVGs**
- **Routines & social-emotional scenes** (Section 24) — **104 SVGs**
- **Micro-scenes & backdrop strips** (Section 26) — **43 SVGs**
- **Manipulatives templates** (Section 27) — cards, mats, spinners, rewards — **48 SVGs**

**Tier 2 Total: ~363 SVGs**

### Tier 3: Content Depth (Essentials tier generators + variety)

- All remaining animals (jungle, woodland, pets, bugs) — ~200 SVGs
- Food & Drink (remaining) — ~80 SVGs
- Vehicles — ~60 SVGs
- Maze start/end markers — 20 SVGs
- Number counting aids (dot arrangements, tally, ten-frame, finger counting skin-tones) — 142 SVGs
- Telling Time construction kit (Section 2.5) — 8 SVGs
- Base Ten Blocks (Section 2.6) — 6 SVGs
- Visual Fractions (Section 2.7) — 32 SVGs
- Play Money — generic (Section 2.8) — 10 SVGs
- Tangram puzzle pieces (Section 3.4) — 15 SVGs
- Pre-Coding Logic Arrows (Section 29) — 12 SVGs
- Geography & Maps (Section 30) — 35 SVGs
- Pattern elements (colored shapes) — 126 SVGs
- Caregiver / adult characters (Section 25.3) — 32 SVGs

**Tier 3 Total: ~778 SVGs**

### Tier 4: Growth+ Generators

- Dot-to-dot outlines — 60 SVGs
- Cutting practice shapes — 55 SVGs
- Hidden-picture scenes — 20 SVGs
- Labeling diagrams — 24 SVGs
- Space & Solar System — 102 SVGs
- Wow-factor packs (Section 28) — build-a-character, mystery reveal, collectibles — 115 SVGs
- ASL Alphabet hands — filled + outline (Section 22.3) — 52 SVGs

**Tier 4 Total: ~428 SVGs**

### Tier 5: Themes, Localization & Variety

- All festival/cultural assets — 346 SVGs
- Seasonal themes — 80 SVGs
- Community helpers — 88 SVGs
- Decorative elements (borders, corners, stickers) — 83 SVGs
- Multi-locale letter sets (Spanish, French, Chinese, Arabic, Korean) — ~318 SVGs
  - **CJK/Arabic stroke order requirement:** Unlike Latin letters, these scripts require **stroke order** data for "Trace" worksheets. Each character SVG must use one `<path>` per stroke (NOT one merged path per character), wrapped in a `<g class="character">` with ordered IDs: `<path id="stroke-1" />`, `<path id="stroke-2" />`, etc. This enables stroke-by-stroke animation in the Trace generator. Plan for this structure during asset creation — retrofitting single-path characters is expensive
- Remaining animal categories (dinosaurs, arctic, birds) — ~108 SVGs
- Additional emotion/pose variants for top animals — 200+ SVGs
- Spanish phonics supplements (Section 22.2) — 18 SVGs
- ASL Alphabet skin-tone variants (Section 22.3) — 156 SVGs
- Play Money localized variants (Section 2.8 — US, Euro) — 20 SVGs

**Tier 5 Total: ~1,376+ SVGs**

### Sprint Summary

| Tier       | Focus                 | SVG Count | Cumulative |
| ---------- | --------------------- | --------- | ---------- |
| **Tier 0** | Toddler Foundations   | ~374      | ~374       |
| **Tier 1** | MVP Core              | ~301      | ~675       |
| **Tier 2** | Age 2–5 Delight       | ~363      | ~1,031     |
| **Tier 3** | Content Depth         | ~778      | ~1,816     |
| **Tier 4** | Growth+ Generators    | ~428      | ~2,244     |
| **Tier 5** | Themes & Localization | ~1,376+   | ~3,620+    |

> **Recommendation:** A designer working full-time can produce 15–25 SVGs/day at this quality level. Tiers 0+1 (~668 SVGs) represent roughly 5–6 weeks of work and unlock a fully functional product for ages 2–5.

---

## Design Guidelines for the Designer

### Style Guide

1. **Friendly & Approachable**: All characters (animals, people, creatures) should have rounded features, large eyes, and warm expressions
2. **Consistent Proportions**: All clipart should work at the same relative scale within a viewBox of 200x200
3. **Clean Lines**: Minimum stroke width of 2px at default viewBox scale; no hairlines that disappear at small sizes. For toddler assets (`minStrokeWidthClass: "toddler"`), minimum 6px
4. **Age Appropriate**: No scary, violent, or culturally insensitive imagery
5. **Inclusive Representation**: All human characters (kids, adults, community helpers) must represent diverse skin tones (6-tone palette), genders, hair textures, and abilities (wheelchair, hearing aids, glasses). See Section 25 for the character system
6. **Printable**: Assets must look good in black-and-white when printed (outline variants especially). Mark `inkCoverage` in manifest so the generator can prefer low-ink assets for "printer-friendly" mode
7. **Layered for Composition**: Use `<g>` groups with semantic IDs (`<g id="body">`, `<g id="face">`, `<g id="accessory">`) so the renderer can show/hide parts
8. **Toddler-First Design**: For categories 21–28, default to `visualComplexity: "low"` — bold outlines, minimal interior detail, large clear shapes. Complexity can always be added in `--detailed` variants

### Tracing Path Requirements

For all `--trace-path` variants:

- Use `stroke-dasharray` for dotted/dashed guide lines
- Include directional arrows using `<marker>` elements for `--trace-path-arrows`
- Paths should follow the standard handwriting stroke order
- Use a single continuous `<path>` per stroke (for animations)
- Include `data-stroke-order` attribute on each path element

### Dot-to-Dot Requirements

For all `--dotted` variants:

- Place numbered circles at anchor points using `<circle>` elements
- Include `data-dot-number` attribute on each circle
- Include the completed outline as a hidden `<path>` with `class="completed-path"`
- Easy = 10–15 dots, Medium = 20–25 dots, Hard = 30–40 dots

### Hidden-Picture Requirements

For all `--scene` hidden-picture SVGs:

- Each hidden object must be a separate `<g>` with `data-hidden-object="true"` and `data-object-name="..."`
- Objects should be partially camouflaged within the scene
- Include a companion "answer key" variant with objects highlighted
- Scene should have at least 10 findable objects

### Labeling Diagram Requirements

For all `--labeled` variants:

- Include `<circle>` anchor points with `data-label-id="..."` where labels attach
- Include `<path>` leader lines from anchor to label position (`<line>` also accepted for leader lines only)
- Include `<text>` elements with correct labels (for answer key variant)
- Provide both labeled and unlabeled versions

### Pre-Writing Stroke Requirements (Section 21)

For all stroke and road assets:

- `--bold` variant must use minimum **3–4% of canvas width** as stroke width (= 6px on `0 0 200 200`, = 24px on `0 0 800 200`). Think in percentages, not pixels — see Section 21 stroke width table
- `--trace-path-arrows` must show directional cues appropriate to locale (LTR or RTL)
- "Road" activities must include a start icon and end icon as separate `<g>` groups with `data-role="start"` / `data-role="end"` so the renderer can swap themed icons (e.g., bee→flower, car→garage)
- Paths should use a single continuous `<path>` element (no breaks) for potential animation
- Include `data-difficulty="easy|medium|hard"` attribute on the root `<svg>` element

### Character & Mascot Requirements (Section 25)

For all human characters:

- Use a consistent head-to-body ratio of ~1:3 (toddler proportions feel relatable to young children)
- Skin tones must follow a 6-tone inclusive palette — not just "light/medium/dark"
- Hair, clothing, and accessories must be separate `<g>` groups with semantic IDs (`<g id="hair">`, `<g id="shirt">`, `<g id="accessory">`) for potential mix-and-match by the renderer
- All children should appear roughly the same age (3–5 years old in appearance)

For Ember the Dragon (primary mascot):

- Must be recognizable at 32x32px (`--tiny` variant) — test readability at small sizes
- All 14 expression states must be readable at 32–48px: eyes do 70% of the work, mouth is minimal
- `--peeking` variant: only head/upper body visible, designed to sit behind a border edge
- `--speech-bubble` variant: Ember with an attached empty speech bubble (renderer fills text)
- Color system: body sage green `#9CAF88`, belly warm cream `#F5EDE0`, eyes warm brown `#5C4033`, celebration glow gold `#F5C842` (reward color only)
- Anatomy constraints: no teeth, no fire, tiny nub horns, stubby rounded wings, soft tail curl, rounded paws
- See [MASCOT_SPECIFICATION.md](MASCOT_SPECIFICATION.md) for full designer brief, Lottie state machine, and engine-to-expression mapping

For worksheet guide characters (Starry the Penguin, Rosie the Fox):

- Must be recognizable at 24x24px (`--tiny` variant)
- `--peeking` variant: only head/upper body visible, designed to sit behind a border edge
- `--speech-bubble` variant: character with an attached empty speech bubble (renderer fills text)
- Consistent color signature: Starry = blue scarf, Rosie = flower crown
- These characters appear ONLY in Canvas worksheets, NOT in platform UI

### Manipulatives & Template Requirements (Section 27)

For all manipulative templates:

- Include `--cut-guide` dashed lines (`stroke-dasharray: 8 4`) on all edges meant to be cut
- Card templates: include `data-card-slot="1"`, `data-card-slot="2"`, etc. per card position — the renderer injects content (images, text) into each slot
- Sorting mats: include `data-category-slot="left"` / `data-category-slot="right"` (or numbered) for dynamic category label injection
- Spinner circles: include `data-section-id="1"` per wedge — renderer fills each section
- All templates must work on both Letter and A4 paper sizes

### Build-a-Character Requirements (Section 28.1)

For modular body part SVGs:

- Every part must include `data-anchor-point="x,y"` (where it connects to the next part) and `data-attach-to="body|head|legs"` (which group it connects to)
- Parts should have flat contact edges that "stack" visually without overlap gaps
- Include a "base template" SVG per character set showing the assembly silhouette with dotted outlines where parts go
- All parts for one character set must use the same viewBox width so they align horizontally

### Mystery Reveal Requirements (Section 28.2)

For color-by-number and color-by-shape assets:

- Each section must be a separate `<path>` with `data-section-number="3"` or `data-section-shape="circle"`
- Sections must have visible borders (`stroke-width: 1`) so kids can see where to color
- Include a `--completed` variant showing the fully colored result (answer key)
- Number/shape labels must be placed at the visual center of each section using `<text>` elements

---

## Golden Reference Examples

> Engineering will provide a small reference pack before production begins. These remove interpretation risk for the trickiest categories.

| Example SVG                                           | Category          | What It Demonstrates                                                         |
| ----------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------- |
| `letters/uppercase/A--trace-path-arrows.svg`          | Tracing           | Correct `<marker>` usage, `data-stroke-order` attributes, directional arrows |
| `themes/ocean/coral-reef--scene.svg`                  | Hidden Picture    | `data-hidden-object` groups, camouflaged objects, answer-key companion       |
| `animals/farm/cow--labeled.svg`                       | Labeling Diagram  | `<circle>` anchor points, `<path>` leader lines, `<text>` answer-key labels  |
| `prewriting/roads/bee-to-flower--trace-path.svg`      | Pre-Writing Roads | `data-role="start"` / `data-role="end"` groups, difficulty attribute         |
| `manipulatives/cards/card-front--2x3-grid.svg`        | Manipulatives     | `data-card-slot` attributes, `--cut-guide` dashed lines                      |
| `wow-packs/build-a-character/robot-head--style-2.svg` | Build-a-Character | `data-anchor-point`, `data-attach-to`, flat contact edges                    |
| `wow-packs/mystery-reveal/dinosaur--segmented.svg`    | Mystery Reveal    | `data-section-number`, section borders, `--completed` variant                |

---

## Glossary

| Term                      | Definition                                                                                                                                                            |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Forge**                 | The Canvas Forge renderer — the server-side engine that composes SVG assets into printable PDF worksheets                                                             |
| **Generator**             | One of 13 worksheet types (Tracing, Recognition, Matching, Counting, Sorting, Sequence, Pattern, Fill-in-Blank, Dot-Connect, Hidden-Picture, Labeling, Cutting, Maze) |
| **Variant suffix**        | The `--` suffix on a filename (e.g., `--outline`, `--trace-path`) indicating the visual treatment of the base asset                                                   |
| **Micro-scene**           | A small decorative backdrop strip (sky, grass, underwater) placed at the top/bottom of a worksheet for visual polish                                                  |
| **Manipulative**          | A cut-out physical piece (card, sorting mat, spinner) that transforms a worksheet into a hands-on activity                                                            |
| **Tier 0**                | The highest-priority batch of assets (~374 SVGs) that should be produced first — pre-writing strokes, A–Z picture vocab, Ember mascot, worksheet guides, speech bubbles |
| **Ember**                 | The primary app-wide mascot — a baby dragon (sage green, warm cream belly) that appears across all 16 engines, loading states, and UI. See MASCOT_SPECIFICATION.md      |
| **Slug**                  | The base filename without variant suffix or path (e.g., `cow` from `animals/farm/cow--happy.svg`)                                                                     |
| **Age group enum**        | `"toddler"` (2–3), `"preschool"` (3–4), `"pre_k"` (4–5), `"school_age"` (5+)                                                                                          |
| **CSS custom properties** | Theme-swappable color variables (`var(--forge-primary)`, etc.) that the renderer replaces at render time                                                              |
| **SVGO**                  | SVG Optimizer — a tool that minifies SVG files by removing unnecessary metadata, comments, and redundant attributes                                                   |

---

## Version History

| Version | Date       | Changes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1.0     | 2026-02-07 | Initial creation — full SVG asset library requirements (20 categories, ~2,834 SVGs)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2.0     | 2026-02-07 | Age 2–5 optimization: Added 8 enhancement packs (Sections 21–28): pre-writing strokes, alphabet picture vocabulary, color-safe objects, routines/SEL scenes, inclusive kid/family characters with mascots, micro-scenes, manipulatives templates, wow-factor packs. Re-balanced priority tiers (Tier 0 for toddler foundations). Added manifest metadata fields (difficulty, visualComplexity, minStrokeWidthClass, inkCoverage, safeToRecolor, phonicsLetter). Added design guidelines for characters, pre-writing, manipulatives, build-a-character, mystery reveal. New total: ~3,729 SVGs across 28 categories |
| 2.1     | 2026-02-08 | Design handoff prep: Status → READY FOR DESIGN HANDOFF. Fixed total target mismatches (Section 21: 55→89, Section 23: 96→98). Resolved `<path>` vs `<line>` rule contradiction. Standardized `preK` → `pre_k` enum. Changed `fairy_tale` → `fairy-tale` (kebab-case). Added `<text>` font policy. Added Designer Quick Start, Definition of Done checklist, Manifest Ownership workflow, Golden Reference Examples, and Glossary sections                                                                                                                                                                          |
| 3.0     | 2026-02-09 | Mascot finalization: Promoted baby dragon to PRIMARY app-wide mascot, renamed Blaze→Ember. Demoted Starry (penguin) and Rosie (fox) to worksheet-only guide characters (Canvas engine). Expanded Ember to 17 expression variants (from 10). Added anatomy rules, color system (sage green `#9CAF88` + warm cream `#F5EDE0` + gold `#F5C842` reward accent). Created companion MASCOT_SPECIFICATION.md with full designer brief, Lottie state machine, engine-to-expression mapping, and frequency rules. Updated Tier 0 total (367→374), Section 25 total (146→153), grand total (3,729→3,736) |
| 3.1     | 2026-02-09 | Design review integration: Added `vector-effect="non-scaling-stroke"` requirement to SVG format spec (stroke width scaling fix). Added skin-tone variants (6 tones) for finger counting hands (+60 SVGs, Section 2.4). Added CJK stroke order structural requirement for Tier 5 multi-locale letter sets. Added contrast check rule for color-safe recolorable objects. Added 8 new educational categories: Telling Time (2.5), Base Ten Blocks (2.6), Visual Fractions (2.7), Play Money (2.8), Tangrams (3.4), ASL Alphabet with skin-tones (22.3), Pre-Coding Logic Arrows (Section 29), Geography & Maps (Section 30). Updated totals: Section 2 (183→299), Section 3 (200→215), Section 22 (252→460), Tier 3 (660→778), Tier 4 (376→428), Tier 5 (1,200→1,376), grand total (3,796→4,122). Now 30 sections total |

---

## Related Documents

- [Mascot Specification — Ember the Dragon](MASCOT_SPECIFICATION.md)
- [Canvas Engine Spec](../03-SIGNATURE-ENGINES/03-CANVAS.md)
- [Canvas Studio (Hub Content Management)](../04-BUSINESS-MODULES/HUB/03-CONTENT-LIBRARY/CANVAS_STUDIO.md)
- [Localization & Multi-Currency](../02-PLATFORM-CORE/LOCALIZATION_MULTI_CURRENCY.md)
