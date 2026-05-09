---
name: Tinfoil Hat
version: 1.0.0
format: DESIGN.md
brand:
  tagline: Conspiracy Inspired • Alt Thinking • UFO Culture • Fringe Ideas
  essence: A modern apparel brand for conspiracy-minded thinkers, signal chasers, and fringe-culture enthusiasts. Clean, geometric, mysterious, and intentionally off-grid.
  attributes:
    - subversive
    - intelligent
    - minimalist
    - geometric
    - cryptic
    - monochrome
    - signal-driven
    - otherworldly
    - streetwear
    - editorial
colors:
  background-light:
    value: "#F5F3EF"
    role: primary background, light layout canvas
    usage: Use as the default page background and for clean editorial sections.
  off-white:
    value: "#ECE9E3"
    role: alternate background, elevated light panels
    usage: Use for cards, modals, and tonal layering against the main background.
  ink-black:
    value: "#111111"
    role: primary ink, major type, core UI, logo reproduction
    usage: Use for headlines, navigation, buttons, and all high-contrast elements.
  graphite:
    value: "#36383C"
    role: secondary dark neutral
    usage: Use for secondary headings, hover states, and structured UI accents.
  signal-gray:
    value: "#70757C"
    role: muted text, dividers, secondary iconography
    usage: Use for captions, helper text, dividers, inactive controls, and subtle metadata.
  foil-silver:
    value: "#B9BDC3"
    role: metallic accent, tin-foil reference
    usage: Use sparingly for logo support graphics, icon fills, metallic surfaces, and subtle highlights.
  fog-gray:
    value: "#D5D8DC"
    role: quiet background accent
    usage: Use for panels, borders, and soft contrast zones.
  white:
    value: "#FFFFFF"
    role: reversed text and contrast support
    usage: Use on dark backgrounds and dark photo overlays.
semanticColors:
  background: "#F5F3EF"
  surface: "#ECE9E3"
  text: "#111111"
  textMuted: "#70757C"
  border: "#D5D8DC"
  accent: "#B9BDC3"
  accentDark: "#36383C"
  success: "#70757C"
  warning: "#B9BDC3"
  error: "#7A2F23"
typography:
  display:
    fontFamily: "Space Grotesk, Sora, Montserrat, Arial, sans-serif"
    fallback: "Arial, sans-serif"
    fontSize: "clamp(3rem, 8vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "0.12em"
    textTransform: uppercase
    usage: Hero headlines, campaign titles, major brand moments.
  h1:
    fontFamily: "Space Grotesk, Sora, Montserrat, Arial, sans-serif"
    fallback: "Arial, sans-serif"
    fontSize: "clamp(2.5rem, 6vw, 4.75rem)"
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: "0.1em"
    textTransform: uppercase
  h2:
    fontFamily: "Space Grotesk, Sora, Montserrat, Arial, sans-serif"
    fallback: "Arial, sans-serif"
    fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "0.08em"
    textTransform: uppercase
  h3:
    fontFamily: "Space Grotesk, Sora, Montserrat, Arial, sans-serif"
    fallback: "Arial, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.06em"
    textTransform: uppercase
  body:
    fontFamily: "Inter, Helvetica Neue, Arial, sans-serif"
    fallback: "Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "0.01em"
  body-small:
    fontFamily: "Inter, Helvetica Neue, Arial, sans-serif"
    fallback: "Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
  label-caps:
    fontFamily: "IBM Plex Sans, Space Grotesk, Arial, sans-serif"
    fallback: "Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.22em"
    textTransform: uppercase
  nav:
    fontFamily: "IBM Plex Sans, Space Grotesk, Arial, sans-serif"
    fallback: "Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.18em"
    textTransform: uppercase
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  xxl: "64px"
  section: "96px"
rounded:
  none: "0px"
  sm: "4px"
  md: "8px"
  lg: "14px"
  pill: "999px"
borders:
  thin: "1px solid rgba(17, 17, 17, 0.14)"
  hairline: "1px solid rgba(17, 17, 17, 0.08)"
  heavy: "2px solid #111111"
  signal: "1px solid rgba(112, 117, 124, 0.4)"
shadows:
  none: "none"
  soft: "0 10px 30px rgba(17, 17, 17, 0.07)"
  elevated: "0 18px 50px rgba(17, 17, 17, 0.12)"
texture:
  paperNoise: false
  foilTexture: true
  microGrain: true
  glossyEffects: false
  distortionHeavy: false
components:
  buttonPrimary:
    background: "#111111"
    color: "#F5F3EF"
    border: "1px solid #111111"
    borderRadius: "999px"
    font: label-caps
    padding: "14px 22px"
    hoverBackground: "#36383C"
    hoverColor: "#FFFFFF"
  buttonSecondary:
    background: transparent
    color: "#111111"
    border: "1px solid rgba(17, 17, 17, 0.2)"
    borderRadius: "999px"
    font: label-caps
    padding: "14px 22px"
    hoverBackground: "#ECE9E3"
    hoverColor: "#111111"
  card:
    background: "#FFFFFF"
    border: "1px solid rgba(17, 17, 17, 0.08)"
    borderRadius: "14px"
    shadow: soft
    padding: "24px"
  productCard:
    background: "#FFFFFF"
    border: "1px solid rgba(17, 17, 17, 0.08)"
    borderRadius: "14px"
    imageTreatment: clean neutral background, no loud colors, allow monochrome editorial framing
    hover: subtle lift, darker border, minimal shadow increase
  input:
    background: "#FFFFFF"
    color: "#111111"
    border: "1px solid rgba(17, 17, 17, 0.14)"
    borderRadius: "10px"
    focusBorder: "#70757C"
    placeholderColor: "#70757C"
  badge:
    background: "rgba(185, 189, 195, 0.18)"
    color: "#111111"
    border: "1px solid rgba(112, 117, 124, 0.3)"
    borderRadius: "999px"
    font: label-caps
layout:
  maxWidth: "1220px"
  contentWidth: "760px"
  gridGap: "24px"
  sectionPaddingDesktop: "96px 32px"
  sectionPaddingMobile: "64px 20px"
  preferredAlignment: centered editorial with strong symmetry, generous whitespace, and structured product grids
logoSystem:
  primaryLogo: all-seeing eye with foil triangle hat, signal antenna, radiating lines, and stacked wordmark
  brandMark: icon-only eye and foil hat symbol
  wordMark: geometric all-caps TINFOIL HAT wordmark with stylized O and A
  clearspace: at least the height of the logo eye around all sides
  minimumSize:
    primaryLogo: "160px wide digital"
    brandMark: "48px wide digital"
    wordMark: "140px wide digital"
graphicElements:
  motifs:
    - all-seeing eye
    - foil triangle hat texture
    - radio-wave / signal arcs
    - radiating line bursts
    - centered dots and divider lines
    - geometric target-like circles
  rules:
    - Use graphic motifs with restraint.
    - Keep compositions symmetrical or intentionally grid-aligned.
    - Prefer thin linework and minimal ornament over clutter.
imagery:
  style: monochrome editorial product photography, UFO-adjacent minimalism, signal diagrams, stark lifestyle imagery, clean studio apparel photography
  avoid:
    - cartoon aliens unless used in specific merchandise graphics
    - rainbow psychedelic palettes
    - glossy cyberpunk gradients
    - cluttered collage layouts
    - distressed grunge overload unrelated to the logo system
    - playful comic treatment for core site UI
---

# Tinfoil Hat DESIGN.md

## Overview

Tinfoil Hat is a conspiracy-inspired apparel brand with a clean, modern, geometric identity. The visual world should feel intelligent, mysterious, slightly subversive, and culturally aware. The site should not feel like novelty merch. It should feel like a real brand for people who live at the intersection of fringe thinking, UFO culture, internet lore, and modern streetwear.

The design direction should draw directly from the selected logo concept: monochrome palette, all-seeing eye iconography, foil-textured triangle hat, radio-wave signal arcs, centered compositions, and precise geometric typography. The site should feel minimal first, weird second.

## Brand Essence

The brand voice is for people who question everything. It should feel observant, clever, conspiratorial, and self-aware. The design should communicate hidden signals, coded systems, and underground culture without becoming chaotic.

Core mood words:

- observant
- cryptic
- irreverent
- modern
- underground
- signal-based
- clean
- outsider

## Design Principles

1. **Minimal but loaded**  
   Use simple layouts with visual tension. Let symbols carry meaning.

2. **Monochrome first**  
   Black, off-white, silver, and gray should do most of the work.

3. **Symmetry matters**  
   Favor centered logo treatment, balanced sections, and disciplined spacing.

4. **Streetwear, not costume**  
   The brand should feel wearable and credible, not novelty-shop goofy.

5. **Signals over clutter**  
   Use a few recurring motifs repeatedly: eye, foil, waves, targets, dots, dividers.

## Logo Usage

### Primary Logo
Use the full lockup when introducing the brand, in the header, hero, packaging, and branded sections.

Preferred treatment:
- centered
- high contrast
- light background or fully black background
- generous clearspace

### Brand Mark
Use the icon-only mark for:
- favicon
- social avatars
- embroidery references
- sleeve marks
- small UI moments
- loading marks

### Word Mark
Use the word mark for:
- navigation header
- footer branding
- apparel labels
- editorial section breaks
- product image overlays when the full logo is too dense

### Logo Do Nots
- Do not recolor the logo in bright hues.
- Do not stretch or skew the logo.
- Do not place it over busy imagery without a clean field.
- Do not add glow, chrome, or meme-style effects.
- Do not overuse the foil texture outside the designated symbol areas.

## Color Direction

The site should remain mostly neutral. Silver is an accent, not the main event. Large fields should stay restrained and clean.

### Recommended Balance
- 60% light backgrounds (`background-light`, `off-white`)
- 25% dark ink and structure (`ink-black`, `graphite`)
- 10% muted neutrals (`signal-gray`, `fog-gray`)
- 5% accent and metallic detail (`foil-silver`)

## Typography Direction

### Display Type
Use a geometric sans with strong tracking and all-caps behavior. Headlines should feel like a custom wordmark system, similar in spirit to the selected Tinfoil Hat mark.

Best fits:
- Space Grotesk
- Sora
- Montserrat

### Supporting Type
Use a highly readable neutral sans for paragraphs, product descriptions, and UI copy.

Best fits:
- Inter
- Helvetica Neue
- IBM Plex Sans

### Typographic Rules
- Default to uppercase for headlines, navigation, and labels.
- Keep letter spacing generous.
- Keep body copy readable and not overly stylized.
- Avoid script fonts, retro serif fonts, or novelty sci-fi fonts for core UI.

## Graphic Language

### Core Motifs
- all-seeing eye
- metallic foil triangle hat
- signal antenna and radio arcs
- line-burst rays
- center dots and divider markers
- target-like circular forms

### How to Use Them
- Use motifs as framing devices, not as decoration everywhere.
- Prefer one strong motif per section.
- Keep linework thin and deliberate.
- Favor repetition and rhythm over randomness.

### Divider System
Use thin divider lines, centered dots, and subtle geometric ornaments to break sections. Dividers should feel precise and diagrammatic.

## Layout Guidance

### General Layout
The site should be editorial and product-led with generous whitespace. It should feel premium and structured.

### Recommended Sections
- Hero with strong logo or wordmark
- New drops / featured products
- Category navigation for tees / hoodies / hats / accessories
- Brand manifesto or “Why we question everything” section
- Featured graphics / best sellers
- Social proof or lifestyle editorial strip
- Email signup / club invite style CTA
- Footer with wordmark and coded microcopy

### Grid Behavior
- 12-column desktop grid preferred
- 2–4 column product grids
- centered hero messaging
- mobile layouts should stay clean and stacked with strong spacing

## UI Component Guidance

### Buttons
Buttons should feel clean, high contrast, and slightly mysterious.

Preferred styles:
- black pill button with uppercase label
- outline pill button with subtle gray border
- no glossy gradients
- no cartoon call-to-action styling

### Cards
Cards should be clean and minimal. Apparel needs to stay central.

Rules:
- use white or off-white surfaces
- keep borders subtle
- allow product photography to breathe
- introduce symbolism in micro-details only

### Navigation
Navigation should be tight, uppercase, and clean.

Include:
- Shop
- New Drops
- Graphics
- About
- Contact
- Cart / Account

Optional voice-driven labels are fine in select places, but keep primary nav practical.

## Photography & Image Direction

Photography should look like a modern apparel brand, not a novelty conspiracy blog.

Preferred:
- clean studio product photography
- black, white, gray, concrete, brushed metal, paper, and urban neutrals
- direct flash or crisp soft-light editorial imagery
- minimal lifestyle shots with attitude
- details of fabric, print, embroidery, labels, and texture

Avoid:
- neon sci-fi overload
- cheesy UFO clip-art
- low-grade meme visuals in core layout
- rainbow tie-dye treatment for site UI

## Motion Guidance

Keep animation restrained.

Good motion ideas:
- subtle fade-ins
- slow line reveals
- gentle hover lift on product cards
- minimal signal pulse on icons
- divider line draw animations

Avoid:
- aggressive parallax
- constant floating effects
- glitch abuse
- spinning UFO gimmicks in main UI

## Voice & Microcopy

Copy should feel dry, clever, and slightly conspiratorial.

Examples of good tone:
- “Question everything.”
- “Broadcasting from the fringe.”
- “For the observant.”
- “Uniforms for signal chasers.”
- “Nothing to see here.”

Avoid overexplaining the joke. The tone should trust the audience.

## Accessibility & Practical Notes

- Maintain strong contrast for all text.
- Ensure body text remains readable on all backgrounds.
- Preserve adequate touch targets on mobile.
- Use semantic heading structure.
- Keep decorative motifs from interfering with readability.
- Make product pages simple and fast.

## Codex Implementation Notes

When building the site:

- prioritize a clean ecommerce layout
- use the token values in the YAML frontmatter as source-of-truth design tokens
- keep styling minimal and consistent
- preserve whitespace generously
- keep the brand mark and word mark reusable as components
- create utility classes or tokens for divider lines, signal arcs, dot markers, and centered editorial sections
- treat metallic/foil accents as occasional supporting texture, not as the dominant UI skin

## Final Creative Summary

Build Tinfoil Hat like a premium streetwear brand with conspiracy aesthetics, not a parody merch store. The site should feel sharp, clean, coded, and self-aware. Minimalist geometry and hidden-signal symbolism should define the experience.
