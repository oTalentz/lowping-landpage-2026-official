# Design System Document

## 1. Overview & Creative North Star: "The Midnight Kinetic"

This design system is engineered to move away from the static, blocky layouts common in gaming hosting and toward a high-end, editorial digital experience. We are moving away from traditional "gamer aesthetics" (characterized by heavy glows and sharp borders) into a world of **The Midnight Kinetic**.

The Creative North Star—**The Midnight Kinetic**—represents a sophisticated, deep-space environment where UI elements aren't just buttons on a screen, but interactive modules floating in a pressurized, dark blue atmosphere. We achieve this through:
- **Intentional Asymmetry:** Breaking the grid to create motion. Hero sections should utilize overlapping elements and large-scale display type to draw the eye.
- **Tonal Depth:** Replacing harsh lines with a hierarchy of nested "plates" that use the midnight palette to imply physical distance.
- **High-Contrast Precision:** Using ultra-vibrant primary accents (the "Kinetic" energy) against deep slate backgrounds to guide the user's focus with surgical accuracy.

---

## 2. Colors: Tonal Atmosphere

This system relies on a "Midnight-to-Neon" contrast. The core philosophy is that light itself defines the space, not the geometry.

### The Palette
- **Background (`#11131a`):** The absolute foundation. All transitions start here.
- **Primary (`#adc6ff`):** Our cooling blue accent. Used for secondary actions and subtle branding.
- **Secondary (`#ffb2bb`):** The "Pulse." High-visibility pink/red for critical actions, CTAs, and active states.
- **Tertiary (`#6cdf65`):** The "Status." Used exclusively for positive feedback, "Online" states, and "Success" indicators.

### The "No-Line" Rule
**Explicit Instruction:** Traditional 1px solid borders are strictly prohibited for sectioning. To separate content, you must use a background color shift. 
- Example: If a section is `surface`, the nested card inside it should be `surface-container-low` or `surface-container-high`. 
- **The Glass & Gradient Rule:** For primary server configuration widgets, use a backdrop-blur (12px–20px) with a semi-transparent `surface-container` fill. 
- **Signature Textures:** Main CTAs should not be flat. Apply a subtle linear gradient (from `secondary` to `secondary_container`) at a 135-degree angle to provide a premium, tactile "sheen."

---

## 3. Typography: Editorial Authority

We use a mix of sophisticated geometric sans-serifs and a nod to the "pixel" heritage of Minecraft to create a tension between modern tech and the game's DNA.

- **Display Scale (`plusJakartaSans`):** Large-scale headers (3.5rem+) should be set with tight letter-spacing (-0.02em) to feel like a premium magazine title. This is where we break the grid—overlap these with images.
- **Headline Scale (`plusJakartaSans`):** Used for server features. It conveys "high-performance" through its clean, wide aperture.
- **Label Scale (`spaceGrotesk`):** Our technical font. Use this for RAM values (e.g., "8GB"), server locations, and status chips. It feels engineered and precise.
- **The "Pixeboy" Exception:** Use the `Pixeboy` font sparingly (max 10% of the UI) for decorative headings or specific "Gaming" markers to maintain a brand link without sacrificing the "Modern" aesthetic.

---

## 4. Elevation & Depth: Tonal Layering

We do not "box" content; we "layer" it. Depth is achieved by stacking the surface-container tiers.

- **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. This creates a soft "recessed" or "lifted" look without a single stroke.
- **Ambient Shadows:** For floating modals (like a server config pop-up), use a shadow with a blur radius of `24px` at `8%` opacity. The shadow color must be a dark blue tint (based on `background`), never a pure grey.
- **The Ghost Border:** If a boundary is required for accessibility (e.g., input fields), use the `outline-variant` token at **15% opacity**. This "Ghost Border" provides a hint of structure without interrupting the midnight atmosphere.
- **Glassmorphism:** Use `backdrop-filter: blur(12px)` on all hover states for cards to simulate the "Midnight Kinetic" atmosphere where elements feel suspended in liquid.

---

## 5. Components: Modern Modules

### Buttons
- **Primary (The Pulse):** Fills: `secondary_container`. Text: `on_secondary_container`. Use a `1.5rem` (xl) corner radius for a friendly but tech-focused feel. On hover, increase brightness and add a soft glow using the `secondary` token.
- **Secondary (The Slate):** Fills: `surface-container-highest`. Use the Ghost Border.

### Pricing Cards & Configuration Widgets
- **No Dividers:** Separate "RAM," "CPU," and "Price" using vertical white space (`spacing-8`) and `label-md` typography.
- **The "Active" Plate:** The selected server plan should not have a thick border. Instead, use a subtle `primary_container` glow and a `tertiary` (green) "Recommended" badge in the top right corner.

### Input Fields
- **Styling:** Use `surface-container-lowest` as the fill. 
- **States:** On focus, the Ghost Border opacity should increase to 40%, and a `0.5px` stroke of `primary` should appear only at the bottom of the field.

### Lists & Features
- **Strict Rule:** Forbid the use of horizontal divider lines. Use `spacing-4` padding and subtle background shifts (alternating `surface` and `surface-container-low`) to define list items.

---

## 6. Do's and Don'ts

### Do
- **Do** use `plusJakartaSans` for large, bold numerical values (like "99.9% Uptime").
- **Do** overlap images (e.g., a Minecraft render) over section boundaries to break the horizontal "stripe" layout.
- **Do** use `tertiary` (`#6cdf65`) for all "System Healthy" and "Server Online" indicators to provide a high-contrast safety signal.

### Don't
- **Don't** use solid white (#FFFFFF) for body text. Use `on_surface_variant` (`#c2c6d6`) to reduce eye strain against the midnight background.
- **Don't** use standard 4px or 8px shadows. They look "cheap" in a dark theme. Stick to the Ambient Shadow rule (large blur, low opacity).
- **Don't** align everything to a rigid center. Use the Spacing Scale to create "weighted" layouts where text is left-aligned and imagery is offset to the right.