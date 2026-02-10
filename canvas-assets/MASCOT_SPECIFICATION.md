# Mascot Specification — Ember the Dragon

**Version:** 1.3
**Status:** LOCKED — READY FOR DESIGN
**Last Updated:** 2026-02-09
**Related:** [Canvas Forge SVG Asset Library](CANVAS_FORGE_SVG_ASSET_LIBRARY.md), [Canvas Engine Spec](../03-SIGNATURE-ENGINES/03-CANVAS.md)

---

## Decision Record

**Decision:** Baby dragon selected as primary app-wide mascot for Canopy OS.
**Date:** 2026-02-09
**Rationale:**

| Criterion | Dragon | Penguin | Fox |
|-----------|--------|---------|-----|
| Competitive whitespace | No ed-tech competitor uses a baby dragon companion | JiJi (ST Math), Pudgy Penguins | Little Fox, Clever Fox |
| Emotional range | Very high (wings, tail, glow, full face) | Medium (limited natural facial features) | Good (expressive ears + eyes) |
| Growth narrative | Perfect ("growing wings" = Journey milestones) | Weak | Weak |
| Cross-age appeal (2-5) | High if baby-fied; peaks at 4-5 when fantasy play accelerates | Very high for 2-3; flattens at 4-5 | Medium for 2-3; good for 4-5 |
| Adult-screen credibility | "Ember is preparing your packet..." works | "Starry is loading..." borderline | "Rosie suggests..." borderline |
| Gender neutrality | Excellent (fantasy creature, no real-world bias) | Good | Good |
| Cultural neutrality | Excellent (no cultural ownership) | Good | Trickster archetype in some cultures |
| Brand tie to Canopy | Strong ("baby dragon living under the canopy, glowing softly like an ember under leaves") | Weak (arctic ≠ canopy) | Moderate (woodland ≠ canopy) |

**Sources:** Khan Academy Kids character system, Duolingo mascot strategy, DreamWorks Toothless design principles, ST Math JiJi research, Faunalytics child-animal preference studies, Frontiers for Young Minds research on children's animal interest.

---

## 1. Identity

| Property | Value |
|----------|-------|
| **Name** | Ember |
| **Species** | Baby dragon |
| **Role** | Primary app-wide mascot and guide |
| **Personality** | Gentle, curious, encouraging. Not hyperactive or silly. Calm presence that glows brighter during achievements |
| **Tagline** | "A tiny glow that grows" |
| **Voice** | Ember does not speak in words. Communicates through expressions, gestures, and soft glow effects. Text in speech bubbles comes from the system, attributed as Ember's "thought" |
| **Age feel** | Baby/toddler (relatable to the target audience) |
| **Narrative arc** | Ember grows alongside the child. In Journey milestones, Ember gains slightly larger wings, a brighter glow, or a new accessory — representing developmental progress |

---

## 2. Design Brief for Designer

### 2.1 Core Design Intent

Ember represents **potential, calm growth, and gentle guidance**. Ember does NOT breathe fire — it **glows softly**, like a warm light under leaves. Think "plush toy dragon," not "fantasy RPG dragon."

**Design north star:** If a 2-year-old saw Ember as a stuffed animal on a shelf, they would reach for it immediately.

### 2.1b Visual Reference Image

> **Reference file:** `docs/assets/ember-reference.png`

An AI-generated reference image has been approved as the **visual source of truth** for Ember's proportions, expression, color feel, and overall style. This image captures the correct:

- Head-to-body ratio (~1:3)
- Sage green body with warm cream belly
- Big warm brown eyes with white highlights
- Tiny nub horns (cream-colored)
- Stubby rounded wings (cream membrane)
- Soft tail curl
- Rounded paws (no claws)
- No visible teeth
- Rosy cheek blush (subtle warmth)
- Plush toy proportions and feel

**How to use this reference:**
- Use it as style, proportion, expression, and color reference
- Do NOT trace or animate the PNG directly
- Rebuild Ember as **clean vector layers** in Illustrator or Figma (see Section 2.1c)
- The reference shows the `--idle` expression — all other expressions derive from this base

**Known discrepancies in reference image (MUST FIX during vector reconstruction):**

| Issue | In Reference | Spec Requirement | Fix |
|-------|-------------|-----------------|-----|
| **Claws** | Distinct white claws/toes visible | "Rounded paws (NO claws)" (Section 2.2) | Remove white tips. Make soft, monochromatic nubbins (teddy bear paw pads) |
| **Dorsal spines** | Ridge of small spikes down head/back | "No spines on back or tail" (Section 2.2) | Smooth out head and back completely. Keep only the two nub horns |
| **Rendering style** | Complex gradients, rim lighting, subsurface scattering (pinkish cheek glow) | SVGs must be under 15KB, render instantly | Adopt **flat / cell-shaded** vector style (see Section 2.5b) |

### 2.1c Vector Reconstruction Instructions (for Designer)

> **Critical:** Ember must be reconstructed as clean vector shapes for both SVG export and Lottie animation. Do NOT attempt to animate the reference PNG.

**Step-by-step workflow:**

1. **Rebuild in Illustrator or Figma** — Recreate Ember as clean vector layers using the reference image as an underlay
2. **Separate into animation-ready groups** — Each body part must be an independent layer/group:
   - `head` (head shape + horns)
   - `eyes_open` / `eyes_closed` / `eyes_half` / `eyes_squint`
   - `mouth_smile` / `mouth_open` / `mouth_hmm` / `mouth_o` / `mouth_neutral`
   - `brows_neutral` / `brows_raised` / `brows_asymmetric`
   - `body` (torso + belly)
   - `wings_folded` / `wings_raised` / `wings_spread`
   - `tail_curled` / `tail_up` / `tail_straight`
   - `arm_left` / `arm_right` (separate for poses)
   - `legs` (front paws)
   - `glow` (optional gold celebration effect)
   - `accessory` (optional: book, magnifying glass, etc.)
3. **Export SVGs** — One SVG per expression, with layers composed per the expression matrix (Section 3)
4. **Import into After Effects** — As shape layers (NOT as raster)
5. **Animate via Bodymovin** — Export as Lottie JSON
6. **No raster layers** in the final output
7. **No blur, glow, or unsupported AE effects** — Stick to transforms, opacity, and path morphing

**Layer naming convention (non-negotiable):**

```
ember_head
ember_eyes_open
ember_eyes_closed
ember_eyes_half
ember_eyes_squint
ember_mouth_smile
ember_mouth_open
ember_mouth_hmm
ember_mouth_o
ember_mouth_neutral
ember_brows_neutral
ember_brows_raised
ember_brows_asymmetric
ember_body
ember_belly
ember_wings_folded
ember_wings_raised
ember_wings_spread
ember_tail_curled
ember_tail_up
ember_arm_left
ember_arm_right
ember_legs
ember_glow
ember_accessory
ember_cheek_blush
```

**After Effects composition hierarchy (simplified view):**

```
Ember/
 ├─ head
 │   ├─ eyes_open
 │   ├─ eyes_closed
 │   ├─ mouth_neutral
 │   ├─ mouth_smile
 ├─ body
 ├─ belly
 ├─ left_arm
 ├─ right_arm
 ├─ left_wing
 ├─ right_wing
 ├─ tail
```

Consistent naming enables:
- Future procedural expression changes (swap eye layers programmatically)
- Reuse across SVG and Lottie exports from the same source file
- Easier iteration without rebuilding from scratch

### 2.2 Anatomy Specification

```
          ╭──────╮
         │  ○  ○  │  ← Big eyes (warm brown, NOT black)
         │   ◡    │  ← Small mouth (minimal, usually closed)
         ╰──┬┬──╯   ← Tiny nub horns (2 small bumps)
            ││
    ╭╮  ╭──┴┴──╮  ╭╮
    ╰╯  │ BODY  │  ╰╯  ← Stubby rounded wings (non-threatening)
        │       │
        ╰─┬──┬─╯
          │  │      ← Rounded paws (NO claws)
          ╰──╯
             ╰~     ← Soft tail curl (never spiky)
```

| Body Part | Constraint | Rationale |
|-----------|-----------|-----------|
| **Head** | Oversized (1:3 head-to-body ratio) | Toddler proportions = relatable + cute |
| **Eyes** | Large, round, warm brown `#5C4033` | Eyes do 70% of expression work. NOT black (too harsh) |
| **Mouth** | Small, minimal. Usually a soft curve or dot | Prevents "scary" reads. Mouth is secondary to eyes |
| **Horns** | Tiny nubs only (2 small rounded bumps) | Must not read as "dangerous" at any size |
| **Wings** | Stubby, rounded, non-threatening | Think butterfly wings, not bat wings |
| **Tail** | Soft curl, rounded tip | Never spiky, never pointed |
| **Paws** | Rounded, mitten-like | NO visible claws or sharp nails |
| **Teeth** | NEVER visible | Non-negotiable. No exceptions, not even in "happy" open mouth |
| **Fire/flames** | NEVER | Ember glows; it does not breathe fire |
| **Belly** | Lighter warm cream area | Creates visual softness and contrast |
| **Spines/spikes** | None | No dorsal ridge, no spines on back or tail |

### 2.3 Color System

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| **Body** | Sage green | `#9CAF88` | Primary fill — ties to "Canopy" brand (nature, growth) |
| **Belly / inner wings** | Warm cream | `#F5EDE0` | Softness, contrast, approachability |
| **Eyes** | Warm brown | `#5C4033` | Deep, friendly, NOT black |
| **Eye highlights** | White | `#FFFFFF` | Single small highlight circle per eye |
| **Horns / nubs** | Darker sage | `#7A9468` | Subtle differentiation from body |
| **Celebration glow** | Warm gold | `#F5C842` | REWARD COLOR ONLY — used for achievements, milestones, pride moments |

**Color Rules:**

1. **Gold is NOT a default UI color.** It appears ONLY during celebrations, achievements, and "proud" moments. This preserves calm and makes reward moments feel special.
2. For grayscale printing, the body/belly contrast must remain distinguishable.
3. The sage green connects Ember to the Canopy OS brand palette. Do NOT change the body color per theme — Ember's color is consistent across all contexts.
4. CSS custom properties are NOT used for Ember's body colors (unlike regular clipart). Ember's identity is color-locked.

### 2.4 Size & Readability Requirements

| Size | Context | Requirement |
|------|---------|-------------|
| **32x32px** | `--tiny` corner stamp, favicon, tab icon | Silhouette must be recognizable. Only body shape matters |
| **48x48px** | Loading indicator, notification badge | Expression must be readable (happy vs thinking vs confused) |
| **96x96px** | Worksheet corner guide, sidebar companion | Full detail visible |
| **200x200px** | Full illustration, Zen Mode, Journey milestone | Maximum detail. Wings, tail, accessories visible |

**Test rule:** Every expression must pass the "squint test" at 48px — if you squint at the icon, can you tell what emotion Ember is showing?

### 2.5 SVG Technical Requirements

All Ember SVGs follow the same technical spec as the main SVG library (see CANVAS_FORGE_SVG_ASSET_LIBRARY.md), plus:

- **ViewBox:** `0 0 200 200` for all expression variants
- **Layering:** Use `<g>` groups with semantic IDs:
  - `<g id="ember-body">` — torso, limbs, tail
  - `<g id="ember-head">` — head shape, horns
  - `<g id="ember-face">` — eyes, mouth, brows (this changes per expression)
  - `<g id="ember-wings">` — wing shapes
  - `<g id="ember-glow">` — optional gold glow effect (celebration only)
  - `<g id="ember-accessory">` — optional held items (book, magnifying glass)
- **ID prefix:** All internal IDs use `ember-` prefix
- **File naming:** `characters/ember/ember--{expression}.svg`

### 2.5b Vector Rendering Style

> **Critical:** The reference image uses photorealistic rendering (gradients, rim lighting, subsurface scattering). The production vectors must NOT replicate this.

**Style: Flat / Cell-Shaded**

| Rule | Details |
|------|---------|
| **Fill style** | Solid color blocks only. Use 1–2 shade steps per region (e.g., body has base sage + one darker sage shadow) |
| **No gradients** | No linear or radial gradients. No mesh gradients. Shadows are flat shapes with a slightly darker fill |
| **No blur/glow effects** | No `<feGaussianBlur>`, no drop shadows, no outer glow via filters |
| **Outline optional** | If using outlines, match the stroke weight to the asset library spec (see CANVAS_FORGE). Outlines must use `vector-effect="non-scaling-stroke"` for consistent rendering across sizes |
| **Cheek blush** | Render as a simple pink/rosy ellipse at low opacity — NOT a radial gradient |
| **Celebration glow** | Render as a simple radial shape behind Ember with gold fill at 30% opacity — NOT a luminance effect |
| **Max file size** | Each expression SVG must remain under **15KB** |
| **Print test** | Every SVG must print cleanly at 150 DPI on white paper. No lost detail, no invisible fills |

**Why flat?** Flat vectors: render instantly on mobile, scale to any size without artifacts, export cleanly to Lottie via Bodymovin, and keep file sizes tiny. The "plush toy" feel comes from the proportions and expressions, not from rendering complexity.

### 2.6 Dark Mode & Zen Mode Contrast

Ember's sage green body (`#9CAF88`) can lose contrast against dark backgrounds (dark green, dark gray, near-black). Since Ember's body color is **identity-locked** and cannot change per theme, a separation strategy is required.

| Context | Background | Ember Treatment |
|---------|-----------|----------------|
| **Light mode** | White / light gray | Default — no special treatment needed |
| **Dark mode** | Dark gray / charcoal | Add a subtle **cream outer glow** (`#F5EDE0` at 15–20% opacity, 4px blur radius) behind Ember's body to lift it from the background |
| **Zen Mode** | Deep dark (near black) | Ember's belly cream and eye highlights provide natural contrast. Add the cream outer glow. The `--dreaming` gold pulse adds additional separation |
| **High contrast mode** | Black / white | Use `--silhouette` variant (solid dark shape on light, solid light shape on dark) |

**Rules:**
- The outer glow is NOT a design element — it is purely functional (contrast separation). Keep it invisible on light backgrounds
- Never darken or desaturate Ember's body color. The sage green is non-negotiable
- The glow uses the belly cream color (`#F5EDE0`), NOT white, to maintain warmth
- In CSS: implement via `filter: drop-shadow()` or a background `<div>` — NOT via SVG filter elements (keeps the SVG clean)

---

## 3. Expression States (v1)

### 3.1 Expression Matrix

| # | Expression | Eyes | Mouth | Body/Wings | Glow | Use Case |
|---|-----------|------|-------|-----------|------|----------|
| 1 | `--idle` | Open, neutral, looking forward | Closed, slight upward curve | Sitting, tail curled, wings folded | None | Default resting state everywhere |
| 2 | `--happy` | Squinted (smile lines), slight upward curve | Open smile (no teeth!) | Wings slightly raised, tail up | Soft warm | Task completion, positive feedback |
| 3 | `--thinking` | Looking up-left, one slightly squinted | Small pursed "hmm" shape | One arm/paw on chin, head tilted | None | Loading states, processing, "working on it" |
| 4 | `--confused` | One eyebrow raised (asymmetric), wide | Small wavy line | Head tilted, wings slightly spread | None | Error states, validation failures, "try again" |
| 5 | `--sleepy` | Half-closed, droopy lids | Slightly open (gentle yawn) | Curled up, wings wrapped around body | None | Zen Mode, nap tracker, idle timeout |
| 6 | `--dreaming` | Fully closed, peaceful curves | Gentle closed smile | Curled up, small z's floating above | Faint warm | Zen Mode deep state, background rest |
| 7 | `--celebrating` | Wide, sparkly (star highlights) | Big open grin (still no teeth) | Wings fully spread, jumping/bouncing | **Gold glow active** | Milestones, achievements, Journey growth |
| 8 | `--relieved` | Soft, exhaling (slightly closed) | Small gentle exhale curve | Shoulders dropping, wings relaxing | Fading warm | After a difficult task completed |
| 9 | `--pointing` | Looking toward pointed direction | Neutral smile | One arm/wing extended outward | None | Tutorials, directions, "look here" |
| 10 | `--peeking` | Wide, curious, looking sideways | Small surprised "o" | Half-hidden behind an edge (only head + one paw visible) | None | Worksheet corners, "Find Me!" game |
| 11 | `--waving` | Friendly, open | Open smile | One arm raised, waving | Soft warm | Greetings, onboarding, welcome screens |
| 12 | `--reading` | Focused, looking downward | Neutral, slightly open | Holding a tiny book, sitting | None | Story time, content areas, documentation |
| 13 | `--surprised` | Wide circles, raised position | Open "o" shape | Wings popped up, tail straight | Brief flash | Discovery moments, new content revealed |
| 14 | `--encouraging` | Warm, direct eye contact | Confident smile | Thumbs-up (claw-up), leaning forward | Soft warm | "You can do it!" prompts, retry encouragement |
| 15 | `--speech-bubble` | Neutral/happy | Neutral smile | Standing with empty speech bubble attached | None | System messages attributed to Ember |
| 16 | `--tiny` | Simplified (two dots + curve) | Simplified curve | Minimal silhouette, recognizable at 32px | None | Corner stamps, favicons, micro-presence |
| 17 | `--silhouette` | None (solid fill) | None | Full body solid shape | None | Placeholder, mystery/locked content |

### 3.2 Expression Design Principles

1. **Eyes are primary.** 70% of the emotion is communicated through eye shape, position, and openness. If you can't tell the expression from the eyes alone, redesign.
2. **Mouth is secondary.** Keep it minimal — small curves, dots, or simple shapes. Never show teeth.
3. **Body is tertiary.** Wing position, tail curl, and posture support the expression but shouldn't be required to read it.
4. **Glow is special.** The gold glow appears ONLY on `--celebrating`, and faintly on `--happy`, `--waving`, `--dreaming`, `--encouraging`, and `--relieved`. All other states have NO glow.
5. **Reduced motion support.** For users with `prefers-reduced-motion`, glow effects and floating z's become static. The expression is still readable without animation.

---

## 4. Engine-to-Expression Mapping

This table defines which Ember expression appears in each of the 16 Canopy OS engines and platform contexts.

### 4.1 Engine Mapping

| Engine | Primary Expression | Secondary Expressions | Context |
|--------|-------------------|----------------------|---------|
| **Journey** (Developmental Assessment) | `--encouraging` | `--celebrating` (milestone), `--happy` (progress), `--reading` (viewing assessments) | Ember grows alongside the child. At major milestones, Ember's wings are slightly larger |
| **Atlas** (AI Curriculum Planning) | `--thinking` | `--happy` (plan generated), `--pointing` (suggested activities) | "Ember is planning..." |
| **Canvas** (Educational Marketplace) | `--peeking` | `--waving` (welcome), `--pointing` (featured content), `--happy` (download complete) | Worksheet corner presence |
| **Connect** (Real-Time Communication) | `--idle` | `--waving` (new message), `--surprised` (notification) | Minimal presence — this is adult-facing |
| **Spark** (Voice AI Interface) | `--thinking` | `--happy` (response ready), `--confused` (didn't understand) | Voice processing indicator |
| **Ledger** (Invoice Management) | `--idle` | `--happy` (payment received), `--pointing` (action needed) | Adult-facing — Ember is subtle |
| **Pulse** (Finance & CACFP) | `--idle` | `--happy` (meal recorded), `--pointing` (missing data) | "Ember noticed something" |
| **Compass** (Smart Suggestions) | `--thinking` | `--surprised` (new suggestion), `--pointing` (recommendation) | "Ember has an idea!" |
| **Beacon** (Contextual Help) | `--reading` | `--pointing` (help topic), `--encouraging` (reassurance) | Help overlay companion |
| **Vista** (Tour CRM) | `--waving` | `--happy` (tour booked), `--celebrating` (enrollment) | Parent-facing warmth |
| **Mosaic** (Memory & Keepsakes) | `--happy` | `--celebrating` (keepsake created), `--reading` (viewing memories) | Emotional context |
| **Scribe** (PDF Form Calibration) | `--thinking` | `--happy` (form ready), `--confused` (calibration issue) | Background processing |
| **Sage** (AI Gateway) | `--thinking` | `--happy` (response ready), `--confused` (processing error) | AI processing state |
| **Trust** (Background Checks) | `--idle` | `--happy` (cleared), `--thinking` (processing) | Subtle — compliance context |
| **Orbit** (Parent Engagement) | `--waving` | `--happy` (recap sent), `--celebrating` (parent milestone) | Parent warmth |
| **Haven** (Health & Safety) | `--sleepy` / `--dreaming` | `--encouraging` (safety reminder), `--relieved` (incident resolved) | **Zen Mode primary home** — Ember sleeps here |

### 4.2 Platform Context Mapping

| Context | Expression | Behavior |
|---------|-----------|----------|
| **Onboarding (first launch)** | `--waving` → `--happy` | Ember waves, then smiles when user completes setup step |
| **Loading / Processing** | `--thinking` | Replaces generic spinner. "Ember is working on it..." |
| **Error / Failure** | `--confused` | "Something went wrong. Ember is confused too." |
| **Empty state** | `--peeking` | Ember peeks from corner: "Nothing here yet!" |
| **Success / Completion** | `--happy` | Brief appearance after successful action |
| **Major milestone** | `--celebrating` | Full celebration with gold glow. Reserved for significant achievements |
| **Idle timeout (>5 min)** | `--sleepy` | Ember starts to nod off. Engaging microinteraction |
| **Zen Mode (active)** | `--dreaming` | Ember is curled up, softly glowing, z's floating |
| **Retry prompt** | `--encouraging` | "You've got this!" with thumbs-up |
| **Help / Tooltip** | `--reading` or `--pointing` | Context-dependent guidance |
| **Worksheet corner (Canvas)** | `--peeking` or `--tiny` | Minimal decorative presence |
| **Sticker / Reward** | `--celebrating` or `--happy` | Reward sheet / progress stamp |
| **Notification badge** | `--surprised` | "Something new!" |

---

## 5. Lottie Animation State Machine

Ember's expressions can be static SVGs (for print, worksheets) or animated Lottie files (for web/mobile UI). This section defines the animation state machine.

### 5.1 State Diagram

```
                              ┌──────────┐
                   ┌─────────→│  IDLE    │←────────────┐
                   │          └────┬─────┘             │
                   │               │                   │
              (timeout 5m)    (user action)       (complete)
                   │               │                   │
              ┌────┴─────┐   ┌────▼─────┐       ┌────┴─────┐
              │ SLEEPY   │   │ THINKING │──────→│  HAPPY   │
              └────┬─────┘   └────┬─────┘       └────┬─────┘
                   │              │                   │
              (continued)    (error)             (milestone?)
                   │              │                   │
              ┌────▼─────┐  ┌────▼─────┐      ┌─────▼──────┐
              │ DREAMING │  │ CONFUSED │      │CELEBRATING │
              └──────────┘  └──────────┘      └────────────┘
```

### 5.2 Phase 1 — Core System States (Ship First)

These five animations cover ~80% of Ember's UI use cases. They are the **minimum viable set for launch**. A designer can ship these five and the app is fully functional.

| State | Lottie File | Duration | Loop | Transition Out |
|-------|------------|----------|------|----------------|
| `idle` | `ember_idle.json` | 4–5s | Yes (gentle breathing, subtle tail sway) | Any trigger |
| `thinking` | `ember_thinking.json` | 3s | Yes (head tilt loop, eye drift up-left) | success → happy, error → confused |
| `happy` | `ember_happy.json` | 2s | No (play once, return to idle) | Auto → idle after 2s |
| `sleeping` | `ember_sleeping.json` | 5–6s | Yes (slow breathing, curled up, wings wrapped) | Any interaction → idle |
| `celebrating` | `ember_celebrate.json` | 1.5–2s | No (play once with gold burst) | Auto → happy → idle |

> **Why these five?** `idle` is the resting state. `thinking` replaces loading spinners. `happy` is the universal positive feedback. `sleeping` powers Zen Mode and nap tracker. `celebrating` drives milestone moments. Every other UI state can fall back to one of these.

### 5.2b Phase 2 — Delight Animations (Post-Launch)

Added after launch for personality depth and engagement. Not required for core UX flow. These five add "charming moments" that make children want to find Ember on every screen.

| State | Lottie File | Duration | Loop | Transition Out |
|-------|------------|----------|------|----------------|
| `peeking` | `ember_peekaboo.json` | 2s | Yes (slight bobbing peek from edge) | Hover → waving, dismiss → idle |
| `playing` | `ember_playing.json` | 3s | Yes (bouncing, playful mini wing flaps) | Auto → idle after loop |
| `walking` | `ember_walking.json` | 2s | Yes (waddle walk cycle) | Arrives at destination → idle |
| `confused` | `ember_confused.json` | 1.5s | No (play once, hold last frame) | retry → thinking, dismiss → idle |
| `reading` | `ember_reading.json` | 3s | Yes (page turn every 3s) | Context exit → idle |

### 5.2c Future Animations (Backlog)

These expressions exist as **static SVGs** (Section 3) and in the transition table (Section 5.3) but do not have Lottie animations yet. They fall back to their static SVG key frame until animated:

| Expression | Mapped Lottie Fallback | Notes |
|-----------|----------------------|-------|
| `--dreaming` | Use `sleeping` + floating z's overlay | Zen Mode deep state |
| `--relieved` | Use `happy` (close enough emotionally) | Post-difficulty exhale |
| `--pointing` | Static SVG only | Tutorial direction |
| `--waving` | Use `idle` entering from offscreen | Greeting wave |
| `--surprised` | Use `happy` with brief scale pop | Discovery moment |
| `--encouraging` | Static SVG only | Thumbs-up nod |

### 5.3 Transition Rules

```typescript
// Pseudo-code for Ember state machine
type EmberState =
  | 'idle' | 'happy' | 'thinking' | 'confused'
  | 'sleepy' | 'dreaming' | 'celebrating' | 'relieved'
  | 'pointing' | 'peeking' | 'waving' | 'reading'
  | 'surprised' | 'encouraging';

type EmberEvent =
  | 'action_start'     // User initiated an action (API call, save, etc.)
  | 'action_success'   // Action completed successfully
  | 'action_error'     // Action failed
  | 'milestone'        // Major achievement reached
  | 'idle_timeout'     // No interaction for 5 minutes
  | 'zen_enter'        // Entered Zen Mode
  | 'zen_exit'         // Exited Zen Mode
  | 'user_interact'    // Any user interaction (click, tap, type)
  | 'notification'     // New notification received
  | 'help_open'        // Help panel opened
  | 'help_close'       // Help panel closed
  | 'retry'            // User chose to retry
  | 'onboard_step'     // Onboarding step completed
  | 'dismiss';         // User dismissed Ember's state

// State transitions
const transitions: Record<EmberState, Partial<Record<EmberEvent, EmberState>>> = {
  idle: {
    action_start: 'thinking',
    idle_timeout: 'sleepy',
    zen_enter: 'dreaming',
    notification: 'surprised',
    help_open: 'reading',
  },
  thinking: {
    action_success: 'happy',
    action_error: 'confused',
    milestone: 'celebrating',
  },
  happy: {
    // Auto-returns to idle after animation completes
    action_start: 'thinking',
  },
  confused: {
    retry: 'thinking',
    dismiss: 'idle',
    action_start: 'thinking',
  },
  sleepy: {
    user_interact: 'idle',
    zen_enter: 'dreaming',
  },
  dreaming: {
    zen_exit: 'idle',
    user_interact: 'idle',
  },
  celebrating: {
    // Auto-transitions: celebrating → happy → idle
    dismiss: 'idle',
  },
  relieved: {
    // Auto-returns to idle after animation
  },
  pointing: {
    dismiss: 'idle',
    user_interact: 'idle',
  },
  peeking: {
    user_interact: 'waving',
    dismiss: 'idle',
  },
  waving: {
    // Auto-returns to idle after animation
    action_start: 'thinking',
  },
  reading: {
    help_close: 'idle',
    dismiss: 'idle',
  },
  surprised: {
    user_interact: 'happy',
    dismiss: 'idle',
  },
  encouraging: {
    action_start: 'thinking',
    dismiss: 'idle',
  },
};
```

### 5.4 Animation Technical Requirements

| Property | Requirement |
|----------|-------------|
| **Format** | Lottie JSON (exported from After Effects via Bodymovin or Figma plugin) |
| **Frame rate** | 30fps (sufficient for UI; saves file size) |
| **Max file size** | 50KB per animation file |
| **Canvas size** | 200x200px (matches SVG viewBox) |
| **Background** | Transparent — no background layer in any animation file |
| **Proportions** | Identical across all animation files — same canvas, same Ember size/position |
| **Color system** | Use Lottie color slots that map to Ember's palette for potential theming |
| **Reduced motion** | Every animation must have a static fallback frame (first frame or key pose) |
| **Looping** | Phase 1 loops: `ember_idle`, `ember_thinking`, `ember_sleeping`. Phase 2 loops: `ember_peekaboo`, `ember_playing`, `ember_walking`, `ember_reading`. All others play once |
| **Easing** | Use ease-in-out for all transitions. No linear motion (feels robotic) |

### 5.4b Animation Style Rules (Non-Negotiable)

Ember's animations must feel calm, warm, and safe. These rules keep Ember appropriate for nap time, professional for adult screens, and adorable for children.

**Motion rules:**

| Rule | Details |
|------|---------|
| **Slow, calm timing** | No fast bounces, no snap movements. Everything is gentle and unhurried |
| **Ease-in-out only** | Every property keyframe uses ease-in-out. No linear, no ease-out-bounce, no spring physics |
| **Loop-friendly** | Looping animations must have seamless start/end — no visible "reset" or hard cut |
| **Readable at 48px** | Every animation must communicate its emotion when the Lottie player is only 48x48px |
| **No squash & stretch** | Minimal scale transforms only. No rubber-hose cartoon physics |
| **No fast rotation** | Head tilts max 15°. No spinning, no flipping |
| **No shake or vibrate** | Even for `confused` — use slow head tilt, not trembling |

**Emotion rules:**

| Rule | Details |
|------|---------|
| **Eyes do 70% of the work** | Eye shape change (open → squint → closed → wide) carries most emotional weight |
| **Minimal mouth movement** | Mouth changes are subtle shifts between preset shapes. No lip-sync, no rapid open/close |
| **Body supports, doesn't lead** | Wing position, tail curl, and posture reinforce the eyes but should not be required to read the emotion |
| **No implied sound effects** | No "!" pop-ups, no musical notes, no speed lines. Ember is silent |
| **Glow is reserved** | Gold glow only in `celebrating`. Subtle warm tint in `happy`. All other states: no glow |
| **Breathing is the baseline** | `idle` and `sleeping` both feature soft rhythmic breathing (chest rise/fall). This is Ember's heartbeat |

### 5.5 Lottie File Structure

One JSON file per animation. All files share the same canvas size, Ember proportions, color palette, and rig.

```
ember-lottie/
├── ember_idle.json           ← Gentle breathing loop (Phase 1)
├── ember_thinking.json       ← Head tilt + eye drift loop (Phase 1)
├── ember_happy.json          ← Squint-smile, play once (Phase 1)
├── ember_sleeping.json       ← Curled up breathing loop (Phase 1)
├── ember_celebrate.json      ← Wings spread + gold burst, play once (Phase 1)
├── ember_peekaboo.json       ← Peek from edge, bobbing loop (Phase 2)
├── ember_playing.json        ← Bouncing + mini wing flaps loop (Phase 2)
├── ember_walking.json        ← Waddle walk cycle loop (Phase 2)
├── ember_confused.json       ← Head tilt + brow raise, play once (Phase 2)
├── ember_reading.json        ← Page turn loop (Phase 2)
├── _static-fallbacks/        ← PNG key frames for prefers-reduced-motion
│   ├── ember_idle.png
│   ├── ember_thinking.png
│   ├── ember_happy.png
│   ├── ember_sleeping.png
│   ├── ember_celebrate.png
│   ├── ember_peekaboo.png
│   ├── ember_playing.png
│   ├── ember_walking.png
│   ├── ember_confused.png
│   └── ember_reading.png
└── README.md
```

**File rules:**
- One loop per file — do NOT combine multiple states into a single Lottie file
- Transparent background — no solid background layer
- Same canvas size (200x200px) — Ember sits at the same position/scale in every file
- Same proportions — switching from `ember_idle.json` to `ember_happy.json` should feel like swapping a face, not jumping to a different character
- Same color palette — all files use the locked Ember palette (Section 2.3)
- Same rig — all files share the same layer hierarchy and anchor points
- Layer names must match the convention in Section 2.1c (e.g., `ember_eyes_open`, `ember_mouth_smile`)

### 5.6 Phase 1 — Per-Animation Motion Briefs

Detailed motion specifications for each Phase 1 animation. These are the exact keyframe descriptions a motion designer needs.

---

#### `ember_idle.json` — Default State

**Purpose:** Default resting state. Appears everywhere Ember is visible with no active event.

| Property | Value |
|----------|-------|
| **Breathing** | Body scale Y oscillates ±2% (very subtle chest rise/fall) |
| **Tail** | Slow pendulum sway ±5° from resting curl |
| **Blink** | Occasional blink every 4–6s (eyes_open → eyes_closed → eyes_open, ~0.3s total) |
| **Head** | Stationary, looking forward |
| **Wings** | Folded, no movement |
| **Loop** | 4–5s, seamless |

**Mood:** Calm, present, content. Like a sleeping cat that's actually awake.

---

#### `ember_thinking.json` — Loading / Processing

**Purpose:** Replaces generic loading spinners. Shows Ember working on something.

| Property | Value |
|----------|-------|
| **Head** | Slow tilt ±8° (left-right-center cycle) |
| **Eyes** | Drift up-left (the "remembering" direction), slow blink |
| **Pause** | Tiny hold at each tilt extreme (0.3s) — feels deliberate, not twitchy |
| **Body** | Subtle breathing continues from idle |
| **Wings** | Folded, no movement |
| **Loop** | 3s, seamless |

**Mood:** Thoughtful, focused. Not anxious or frantic.

---

#### `ember_happy.json` — Success / Confirmation

**Purpose:** Positive feedback after a completed action. Universal "good job" moment.

| Property | Value |
|----------|-------|
| **Bounce** | Small upward translate (~5% canvas height), ease-in-out |
| **Eyes** | Squint to smile lines (eyes_half or eyes_squint) |
| **Mouth** | Shift to mouth_smile |
| **Wings** | Very subtle wiggle (±3° rotation on each wing, staggered) |
| **Glow** | Faint warm tint (not gold — just slightly brighter body fill) |
| **Loop** | 2s, play once then hold last frame or return to idle |

**Mood:** Pleased, warm. A gentle "yay" — not a party.

---

#### `ember_sleeping.json` — Zen Mode / Nap Time

**Purpose:** Zen Mode primary state. Also used for nap tracker and deep idle.

| Property | Value |
|----------|-------|
| **Eyes** | Closed throughout (eyes_closed) |
| **Breathing** | Body scale Y oscillates ±3% (slightly deeper than idle breathing) |
| **Tail** | Gently curled, minimal movement |
| **Wings** | Wrapped around body |
| **Optional** | Tiny dream bob — very slight Y drift (±1%) every 5s, like floating |
| **Loop** | 5–6s, seamless. Calmest animation in the entire set |

**Mood:** Peaceful, safe, quiet. This plays during nap time — it must not be stimulating.

---

#### `ember_celebrate.json` — Milestones / Achievements

**Purpose:** Reserved for significant moments — Journey milestones, first enrollment, major achievements.

| Property | Value |
|----------|-------|
| **Jump** | Small upward hop (~8% canvas height), with ease-in-out return |
| **Wings** | Flutter open (wings_folded → wings_spread → wings_folded, 2–3 cycles) |
| **Eyes** | Wide, sparkly (eyes_open with star highlights overlay) |
| **Mouth** | Big smile (mouth_smile, open variant) |
| **Glow** | **Gold glow active** — `#F5C842` radial burst behind Ember, fading over duration |
| **Loop** | 1.5–2s, can be played once OR looped (configurable) |

**Mood:** Proud, delighted. The biggest emotional peak in Ember's range — but still calm. No confetti, no fireworks. Just warm gold light.

---

## 6. Frequency & Appearance Rules

### 6.1 Ember Visibility Levels

Not every screen needs Ember. Overexposure kills delight. These rules control when and where Ember appears.

| Visibility Level | Description | Ember Presence | Screens |
|-----------------|-------------|---------------|---------|
| **Always On** | Ember is a persistent UI element | Tiny icon in corner/header (32-48px) | Dashboard, Zen Mode, Journey |
| **Contextual** | Ember appears during specific interactions | Appears on action, disappears after | Loading states, errors, successes, milestones |
| **On Request** | Ember appears only when invoked | Hidden until user opens help/tips | Beacon (help), settings, admin screens |
| **Absent** | No Ember | None | Login, signup, legal pages, pure data tables |

### 6.2 Per-Screen Rules

| Screen / Feature | Visibility | Size | Position | Notes |
|-----------------|-----------|------|----------|-------|
| **Dashboard** | Always On | 48px | Header bar or sidebar | `--idle` default, reacts to actions |
| **Zen Mode** | Always On | 200px | Center stage | `--dreaming` or `--sleepy` — this is Ember's home |
| **Journey milestones** | Always On | 96-200px | Inline with milestone | `--celebrating` at milestones. Wings slightly larger at each stage |
| **Canvas worksheets** | Contextual | 48-96px | Bottom-right corner | `--peeking` or `--tiny`. "Find Me!" game |
| **Loading spinner** | Contextual | 48px | Replaces spinner | `--thinking` replaces generic spinner |
| **Error message** | Contextual | 48px | Inline with error | `--confused` next to error text |
| **Success toast** | Contextual | 32px | Inside toast | `--happy` mini icon |
| **Empty state** | Contextual | 96px | Center of empty area | `--peeking` with "Nothing here yet!" |
| **Onboarding** | Contextual | 96px | Alongside instructions | `--waving` → `--pointing` → `--celebrating` |
| **Meal recording (Pulse)** | Contextual | 48px | After recording | `--happy` briefly |
| **Help panel (Beacon)** | On Request | 48px | Help panel header | `--reading` when open |
| **Settings** | Absent | — | — | Admin context, no mascot |
| **Billing / Subscription** | Absent | — | — | Compliance context, no mascot |
| **Staff management** | Absent | — | — | HR context, no mascot |
| **Reports / Analytics** | On Request | 32px | Corner only | `--tiny` if present at all |
| **Login / Signup** | Absent | — | — | Clean, professional |

### 6.3 Frequency Caps (Anti-Fatigue)

| Rule | Limit | Rationale |
|------|-------|-----------|
| **Celebration frequency** | Max 1 `--celebrating` per session per engine | Prevents reward inflation |
| **Notification bounce** | Max 3 `--surprised` per hour | Prevents notification fatigue |
| **Idle-to-sleepy** | After 5 minutes of no interaction | Fun microinteraction, but only once per session |
| **Speaking (speech bubble)** | Max 2 per screen load | Ember shouldn't be chatty |
| **Absence after dismiss** | If user dismisses Ember, stay hidden for 30 minutes | Respect user preference |
| **New user grace period** | Full Ember presence for first 7 days | Build attachment during onboarding |
| **Power user fade** | After 30 days, reduce to Contextual only | Experienced users need less guidance |

### 6.4 Accessibility & User Control

| Feature | Behavior |
|---------|----------|
| **prefers-reduced-motion** | All Lottie animations become static. Show key frame only |
| **Screen reader** | Ember expressions have `aria-label`: "Ember the dragon mascot is thinking" |
| **Ember toggle** | User setting: "Show Ember" (on/off). Default: on. Persisted per account |
| **High contrast mode** | Ember renders as `--silhouette` variant (solid dark shape) |
| **Print mode** | Canvas worksheets use SVG `--tiny` or `--peeking`. No animations |

### 6.5 Sound Design (SFX Palette)

Ember does not speak, but Ember's animations can be paired with **subtle sound effects** to reinforce emotional moments. The audio palette must match the Canopy OS brand: organic, natural, warm.

**Sound direction: "Forest floor at dawn"** — wood, wind, water, chimes. No synthetic beeps, no cartoon boings.

| Ember State | SFX | Description |
|------------|-----|-------------|
| `idle` | None | Silence. Ember's presence is visual only in default state |
| `thinking` | None | Loading is silent — the animation alone communicates "working" |
| `happy` | Soft chime | A single wooden wind chime note, warm pitch. ~0.5s |
| `sleeping` | None | Silence preserves the nap-time mood |
| `celebrating` | Sparkle cascade | 2–3 ascending wind chime notes + a soft shimmer (like brushing leaves). ~1.5s |
| `confused` | Soft hum | A low-pitch breathy "hmm?" — like a curious animal sound. ~0.3s |
| `peeking` | Rustle | A tiny leaf rustle, like something peeking through bushes. ~0.3s |
| `level-up` | Rising chime sequence | 3–4 ascending chime notes with a warm reverb bloom at the end. ~2s |

**SFX rules:**

| Rule | Details |
|------|---------|
| **Volume** | All Ember SFX play at 30–50% system volume. Never startling |
| **Organic only** | Wood, wind, water, chimes, leaves. No electronic beeps, no "boings," no cartoon "zips" |
| **No vocal sounds** | Ember does not coo, giggle, or vocalize. SFX are environmental, not character-voiced |
| **Mute respects system** | If device is muted or `prefers-reduced-motion` is set, no SFX play |
| **Frequency cap** | SFX follow the same anti-fatigue rules as visual animations (Section 6.3) |
| **Optional toggle** | User setting: "Ember sounds" (on/off). Default: on. Independent of the "Show Ember" toggle |
| **No SFX on adult screens** | Sound only plays on child-facing or shared screens. Never on billing, settings, staff management |

---

## 7. Growth System (Journey Integration)

Ember evolves visually as the child progresses through Journey developmental stages. This is NOT a costume system — it's subtle anatomical growth that mirrors the child's development.

### 7.1 Growth Stages

| Journey Stage | Ember Visual Change | Unlocked At |
|--------------|-------------------|-------------|
| **Seedling** (baseline) | Default Ember — tiny wings, soft glow | Account creation |
| **Sprout** | Wings slightly larger, + 1 small leaf on head | 3 Journey milestones |
| **Bloom** | Wings noticeably larger, gentle glow around body | 10 Journey milestones |
| **Canopy** | Full wings (still rounded!), warm ambient glow, tiny crown of leaves | 25 Journey milestones |

### 7.2 Design Rules for Growth

- Growth is **additive only** — never remove features from earlier stages
- Changes must be subtle enough that parents notice and feel proud, but not so dramatic that children don't recognize Ember
- Each stage needs its own SVG variant set (4 stages x 17 expressions = 68 SVGs — produced in Tier 4+, not Tier 0)
- Default implementation uses **Seedling** stage until Growth System is built

### 7.3 Level-Up Ceremony Animation

When a child crosses a Journey stage threshold (Seedling → Sprout, Sprout → Bloom, Bloom → Canopy), the transition should be a **celebrated moment**, not a silent asset swap. This is the single highest-emotion event in the app.

**Sequence:**

```
1. Current Ember plays `ember_celebrate.json` (1.5–2s)
2. Gold glow intensifies → Ember fades into a "cocoon of light" (radial gold fill expands to cover Ember)
3. Hold cocoon (1s) — gentle pulse
4. Light recedes → New-stage Ember is revealed (slightly larger wings / leaf / crown)
5. New Ember plays `ember_happy.json`
6. Confetti-free sparkle (2–3 subtle gold dots float outward, fade)
```

| Property | Value |
|----------|-------|
| **Lottie file** | `ember_levelup.json` (special — not part of Phase 1 or 2, produced per stage) |
| **Duration** | 5–6s total |
| **Loop** | No — play once, then settle into new Ember `idle` |
| **Trigger** | Journey engine fires `milestone` event at stage boundary |
| **Frequency** | Max 3 times per child's lifetime in the app (Seedling→Sprout, Sprout→Bloom, Bloom→Canopy) |

**Design rules:**
- The "cocoon" effect must be warm gold, NOT white flash (no strobe risk)
- The new Ember must be recognizable as the same character — same face, same body color, just with additive features
- Parents and educators should feel "proud" watching this. Children should feel "special"
- This animation plays full-screen (200x200px minimum) — never at 32px or 48px

---

## 8. Worksheet Guide Characters (Canvas Only)

Starry the Penguin and Rosie the Fox are NOT app-wide mascots. They appear ONLY within Canvas engine worksheets for variety.

### 8.1 Usage Rules

| Rule | Details |
|------|---------|
| **Where they appear** | Canvas worksheets ONLY (PDF output, worksheet previews) |
| **Where they do NOT appear** | Platform UI, loading states, Zen Mode, Journey, notifications, onboarding, help panels |
| **Selection** | Randomly assigned per worksheet OR user preference in Canvas settings |
| **"Find Me!" game** | Starry and Rosie can appear as surprise "Find Me!" targets alongside Ember |

### 8.2 Design Consistency

- Starry and Rosie should match Ember's stroke weight and visual complexity level
- Same `--tiny` / `--peeking` pattern as Ember for worksheet corners
- Consistent head-to-body ratio with Ember (1:3)
- Both should feel like they "belong in the same world" as Ember

---

## 9. File Inventory

### 9.1 Tier 0 Deliverables (17 SVGs)

```
characters/ember/ember--idle.svg
characters/ember/ember--happy.svg
characters/ember/ember--thinking.svg
characters/ember/ember--confused.svg
characters/ember/ember--sleepy.svg
characters/ember/ember--dreaming.svg
characters/ember/ember--celebrating.svg
characters/ember/ember--relieved.svg
characters/ember/ember--pointing.svg
characters/ember/ember--peeking.svg
characters/ember/ember--waving.svg
characters/ember/ember--reading.svg
characters/ember/ember--surprised.svg
characters/ember/ember--encouraging.svg
characters/ember/ember--speech-bubble.svg
characters/ember/ember--tiny.svg
characters/ember/ember--silhouette.svg
```

### 9.2 Lottie Deliverables — Phase 1 (5 files)

Ship with SVGs. These replace generic UI spinners and provide core emotional feedback.

```
ember-lottie/ember_idle.json
ember-lottie/ember_thinking.json
ember-lottie/ember_happy.json
ember-lottie/ember_sleeping.json
ember-lottie/ember_celebrate.json
```

### 9.3 Lottie Deliverables — Phase 2 (5 files, post-launch)

```
ember-lottie/ember_peekaboo.json
ember-lottie/ember_playing.json
ember-lottie/ember_walking.json
ember-lottie/ember_confused.json
ember-lottie/ember_reading.json
```

### 9.4 Static Fallbacks (10 PNGs)

Key frame exports for `prefers-reduced-motion` — one per Lottie file:

```
ember-lottie/_static-fallbacks/ember_idle.png
ember-lottie/_static-fallbacks/ember_thinking.png
ember-lottie/_static-fallbacks/ember_happy.png
ember-lottie/_static-fallbacks/ember_sleeping.png
ember-lottie/_static-fallbacks/ember_celebrate.png
ember-lottie/_static-fallbacks/ember_peekaboo.png
ember-lottie/_static-fallbacks/ember_playing.png
ember-lottie/_static-fallbacks/ember_walking.png
ember-lottie/_static-fallbacks/ember_confused.png
ember-lottie/_static-fallbacks/ember_reading.png
```

### 9.5 Future Deliverables (Tier 4+)

- 4–6 additional Lottie files for backlog expressions (`dreaming`, `relieved`, `pointing`, `waving`, `surprised`, `encouraging`)
- 1 level-up ceremony Lottie (`ember_levelup.json`) per growth stage transition (3 variants)
- 51 growth stage SVGs (3 additional stages x 17 expressions)
- Turnaround reference sheet (front, 3/4, side, back — see Section 10)
- Ember Sticker Pack reward sheet (see Section 9.6)
- Seasonal variants (optional): Ember with Santa hat, Ember with pumpkin, etc.

### 9.6 Ember Sticker Pack (Canvas Forge Generator)

A dedicated **"Reward Sticker" generator** in Canvas Forge that fills a printable page (Avery-compatible) with 20–30 instances of Ember in different emotional states.

**Included expressions:** `--happy`, `--celebrating`, `--encouraging`, `--waving`, `--peeking`, `--reading`, `--tiny` (repeated at various sizes)

**Value:** Parents can print on Avery sticker paper. Ember exists physically in the child's life — reinforcing the app habit even when the screen is off. Stickers can be used as rewards alongside Journey milestones.

**Delivery:** Tier 4+ (after core SVGs and Lottie Phase 1 are complete)

---

## 10. Prop System (Future — "Ember's Corner")

A future enhancement where Ember's held accessory (`ember_accessory` layer) is context-aware within Canvas worksheets.

**Concept:** If a worksheet focuses on the letter "B", Ember holds a **Balloon** or a **Ball** from the SVG asset library. This requires a mapping between worksheet metadata (`data-phonics-letter`, `data-theme`) and available props.

### 10.1 Implementation Approach

| Component | Details |
|-----------|---------|
| **Prop attachment point** | `ember_arm_left` layer — props attach to Ember's left paw position |
| **Prop library** | A subset of the general SVG asset library, resized and positioned for Ember's hand |
| **Mapping** | Worksheet metadata → prop selection. e.g., `{ letter: "B", props: ["balloon", "ball", "book", "butterfly"] }` |
| **Fallback** | If no prop mapping exists, Ember appears without a prop (standard `--peeking` or `--idle`) |
| **Delivery** | Tier 5+ (requires both the Ember SVGs and the general asset library to be complete) |

### 10.2 Design Rules for Props

- Props must be simple, flat, recognizable silhouettes at 48px
- Props should not obscure Ember's face or expression
- Maximum 1 prop per Ember instance (no dual-wielding)
- Props use the general asset library color system (`--forge-*` custom properties), NOT Ember's locked palette

---

## 11. Golden Reference for Designer

Engineering will provide these reference files before production begins:

| Reference | What It Shows |
|-----------|--------------|
| `ember--idle.svg` (reference) | Correct anatomy proportions, `<g>` layering, ID prefixing |
| `ember--celebrating.svg` (reference) | Gold glow implementation, wing spread limits |
| `ember--tiny.svg` (reference) | 32px readability test, minimal detail approach |
| `ember--peeking.svg` (reference) | Partial body visibility, border-edge positioning |
| Expression sheet (PNG) | All 14 core expressions at 48px for squint-test validation |
| Turnaround sheet (PNG) | Front, 3/4, side, and back views of Ember at consistent scale. Required for geometric consistency and future 3D plushie/React Three Fiber use. Keep geometry simple (no complex fur textures) |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-09 | Initial creation. Locked Ember as primary mascot. Full designer brief, 17 expression states, engine-to-expression mapping, Lottie state machine, frequency rules, growth system, accessibility requirements |
| 1.1 | 2026-02-09 | Added visual reference image section (2.1b), vector reconstruction instructions with 26-layer naming convention (2.1c). Restructured Lottie into Phase 1 (5 core) and Phase 2 (5 delight) delivery. Added animation style rules (motion + emotion). Added Lottie file structure spec. Updated file inventory with phased Lottie and static fallback deliverables |
| 1.2 | 2026-02-09 | Integrated production Lottie design brief. Updated file naming to `ember_` prefix convention (`ember_idle.json`). Revised Phase 1 durations (idle 4-5s, thinking 3s, sleeping 5-6s, celebrate 1.5-2s). Added Section 5.6 per-animation motion briefs with exact keyframe specs (scale %, rotation degrees, timing). Added AE composition hierarchy to Section 2.1c. Updated all file paths to `ember-lottie/` directory |
| 1.3 | 2026-02-09 | Integrated design review feedback. Added reference image discrepancy table (claws, dorsal spines, rendering style) to 2.1b. Added flat/cell-shaded vector style rules (2.5b). Added dark mode/Zen Mode contrast strategy (2.6). Added Level-Up ceremony animation spec (7.3). Added Sound Design SFX palette (6.5). Added Prop System concept (Section 10). Added turnaround sheet to Golden Reference (Section 11). Added Sticker Pack generator (9.6). Renumbered Golden Reference to Section 11 |

---

## Related Documents

- [Canvas Forge SVG Asset Library](CANVAS_FORGE_SVG_ASSET_LIBRARY.md)
- [Canvas Engine Spec](../03-SIGNATURE-ENGINES/03-CANVAS.md)
- [Haven Engine Spec (Zen Mode)](../03-SIGNATURE-ENGINES/16-HAVEN.md)
- [Journey Engine Spec](../03-SIGNATURE-ENGINES/01-JOURNEY.md)
