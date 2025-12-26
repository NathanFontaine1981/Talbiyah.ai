# Image Generation Manual - Nano Banana Pro

> **Model:** Google Gemini 3 Pro Image (Nano Banana Pro)
> **Capability:** State-of-the-art AI image generation and editing via Claude Code
> **Access:** Terminal command via Python script

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Command](#core-command)
3. [All Parameters](#all-parameters)
4. [Aspect Ratios](#aspect-ratios)
5. [Resolutions](#resolutions)
6. [Reference Images](#reference-images)
7. [Image Editing](#image-editing)
8. [Background Removal (True Transparency)](#background-removal)
9. [Advanced Prompting](#advanced-prompting)
10. [Creative Use Cases](#creative-use-cases)
11. [Project-Specific Examples](#project-specific-examples)
12. [Batch Operations](#batch-operations)
13. [Troubleshooting](#troubleshooting)

---

## Quick Start

Generate any image with a single command:

```bash
source ~/.zshrc && python3 ~/.claude/skills/imagegen/scripts/generate_image.py "your prompt" output.png
```

That's it. Claude Code should automatically determine aspect ratio and size based on context.

---

## Core Command

```bash
source ~/.zshrc && python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "PROMPT" \
  OUTPUT_PATH \
  --aspect RATIO \
  --size SIZE \
  --input IMAGE_TO_EDIT \
  --ref REFERENCE_IMAGE
```

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `"PROMPT"` | Yes | Text description of the image |
| `OUTPUT_PATH` | Yes | Where to save (e.g., `assets/logo.png`) |
| `--aspect` | No | Aspect ratio (default: 1:1) |
| `--size` | No | Resolution: 1K, 2K, 4K (default: 1K) |
| `--input` | No | Image to edit/modify (can use multiple) |
| `--ref` | No | Reference image for style/objects (can use multiple, max 14) |

---

## All Parameters

### Aspect Ratios (`--aspect` or `-a`)

| Ratio | Dimensions | Best For |
|-------|------------|----------|
| `1:1` | Square | Icons, avatars, app icons, logos, social posts, profile pictures |
| `2:3` | Portrait | Posters, Pinterest pins, mobile portraits, book covers |
| `3:2` | Landscape | Photos, business cards, horizontal photos |
| `3:4` | Portrait | Instagram portrait, mobile screenshots, tablets |
| `4:3` | Landscape | Presentations, tablets, old TV format, slides |
| `4:5` | Portrait | Instagram portrait posts, social media |
| `5:4` | Landscape | Print photos, large format prints |
| `9:16` | Tall | Instagram/TikTok Stories, mobile wallpapers, Reels, Snapchat |
| `16:9` | Wide | YouTube thumbnails, banners, desktop wallpapers, hero images, Twitter headers |
| `21:9` | Ultra-wide | Cinematic banners, ultra-wide monitors, hero sections, Netflix-style |

### Resolutions (`--size` or `-s`)

| Size | Quality | Use Case | Generation Speed |
|------|---------|----------|------------------|
| `1K` | Good | Thumbnails, web previews, quick iterations | Fast |
| `2K` | High | Standard web use, most production assets | Medium |
| `4K` | Maximum | Print, wallpapers, hero images, high-DPI displays | Slower |

---

## Reference Images

Nano Banana Pro can learn from reference images to maintain consistency, transfer styles, or combine elements.

### Limits

- **Maximum total:** 14 reference images
- **Object references:** Up to 6 (high-fidelity object inclusion)
- **Human references:** Up to 5 (character consistency)

### Syntax

```bash
# Single reference
--ref image.png

# Multiple references
--ref style1.png --ref style2.png --ref style3.png

# Short form
-r style.png -r colors.png
```

### Reference Image Use Cases

#### Style Transfer
Learn visual style from existing images:
```bash
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "website hero image in this visual style" hero.png \
  --ref existing_brand_image.png \
  --aspect 16:9 --size 2K
```

#### Brand Consistency
Maintain brand colors and aesthetic:
```bash
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "new product announcement banner" banner.png \
  --ref brand_guidelines.png --ref previous_banner.png \
  --aspect 16:9 --size 2K
```

#### Character Consistency
Keep the same character across multiple images:
```bash
# Create base character
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "friendly robot mascot, 3D render, smiling" mascot_base.png \
  --aspect 1:1 --size 2K

# Create variations using the base as reference
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "the same robot mascot waving hello" mascot_wave.png \
  --ref mascot_base.png --aspect 1:1 --size 2K

python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "the same robot mascot giving thumbs up" mascot_thumbsup.png \
  --ref mascot_base.png --aspect 1:1 --size 2K
```

#### Combining Elements
Merge styles/elements from multiple sources:
```bash
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "combine these design elements into a cohesive logo" combined_logo.png \
  --ref element1.png --ref element2.png --ref color_palette.png \
  --aspect 1:1 --size 2K
```

#### Color Palette Extraction
Use an image just for its colors:
```bash
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "abstract background using only these colors" bg.png \
  --ref color_source.png \
  --aspect 16:9 --size 2K
```

#### Mood/Atmosphere Transfer
```bash
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "product photo with this lighting and mood" product.png \
  --ref mood_reference.jpg \
  --aspect 1:1 --size 2K
```

---

## Image Editing

Edit existing images with natural language instructions.

### Syntax

```bash
# Single image edit
--input image_to_edit.png

# Multiple images (for compositing)
--input image1.png --input image2.png

# Short form
-i image.png
```

### Editing Use Cases

#### Background Replacement
```bash
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "replace the background with a sunset beach" edited.png \
  --input product_photo.png
```

#### Object Addition
```bash
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "add a coffee cup on the desk" edited.png \
  --input office_scene.png
```

#### Object Removal
```bash
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "remove the person in the background" cleaned.png \
  --input photo.png
```

#### Style Transformation
```bash
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "convert this to watercolor painting style" artistic.png \
  --input photo.png
```

#### Color Grading
```bash
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "apply warm vintage film color grading" graded.png \
  --input photo.png
```

#### Extend/Outpaint
```bash
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "extend this image to show more of the landscape on the sides" extended.png \
  --input original.png \
  --aspect 21:9
```

#### Combine Edit + Reference
Edit an image using style from another:
```bash
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "apply this artistic style to the photo" stylized.png \
  --input photo.png \
  --ref art_style.png
```

---

## True Transparency (Difference Matting)

**IMPORTANT:** Nano Banana Pro's API does NOT output true PNG transparency. When you request "transparent background", it renders the checkerboard pattern as actual pixels.

**Solution:** Use `--transparent` flag for perfect transparency using difference matting.

### Syntax

```bash
--transparent
# or
-t
# or
--remove-bg  (alias, same thing)
```

### How It Works

1. Generate image on **WHITE** background
2. Use AI to edit to **BLACK** background (keeping subject identical)
3. Apply mathematical difference matting to extract true alpha
4. Saves as PNG with RGBA (true transparency)

### Why It's Perfect

- **Mathematical precision** - not AI guessing
- **Never misses parts** - complete cutouts every time
- **Preserves semi-transparency** - glass, shadows, glows all work
- **No edge artifacts** - clean edges, no halos
- **Works for everything** - logos, products, UI, icons

### Examples

#### Glass/Holographic UI
```bash
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "futuristic glass HUD interface, holographic panels" hud.png \
  -t --size 2K
```

#### Logo with Glow
```bash
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "neon logo with glow effect" logo.png \
  -t --aspect 1:1 --size 2K
```

#### Product with Shadow
```bash
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "floating sneaker with soft shadow below" sneaker.png \
  --transparent --size 2K
```

#### App Icon
```bash
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "iOS app icon, simple geometric shape" icon.png \
  -t --aspect 1:1 --size 2K
```

#### Sticker/Overlay
```bash
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "cute cartoon cat waving, kawaii style" sticker.png \
  -t --size 1K
```

### Note

Difference matting uses 2 API calls (white background → black background → math). This ensures perfect results every time, with no missed edges or incomplete cutouts.

### Verification

To verify an image has true transparency:
```python
from PIL import Image
img = Image.open("image.png")
print(f"Mode: {img.mode}")  # Should be "RGBA"
print(f"Has alpha: {'A' in img.mode}")  # Should be True
```

---

## Advanced Prompting

### Prompt Structure

```
[Subject] + [Style] + [Details] + [Lighting/Mood] + [Technical specs]
```

### Style Keywords

| Category | Keywords |
|----------|----------|
| **Render Type** | photorealistic, 3D render, illustration, vector, flat design, isometric, low poly |
| **Art Style** | minimalist, maximalist, abstract, geometric, organic, hand-drawn, sketch |
| **Photography** | studio lighting, natural light, golden hour, dramatic lighting, soft focus, bokeh |
| **Aesthetic** | modern, vintage, retro, futuristic, cyberpunk, vaporwave, brutalist, corporate |
| **Medium** | oil painting, watercolor, digital art, pencil sketch, charcoal, pastel |

### Quality Boosters

Add these to improve output:
- `highly detailed`
- `professional quality`
- `award-winning`
- `trending on artstation/dribbble`
- `8K resolution`
- `sharp focus`
- `masterpiece`

### Negative Guidance

Describe what you DON'T want:
- `clean design, no clutter`
- `simple, not busy`
- `professional, not cartoonish`

### Text in Images

Nano Banana Pro has advanced text rendering:
```bash
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "modern logo with the text 'ACME CORP' in bold sans-serif font, blue gradient background" \
  logo.png --aspect 1:1 --size 2K
```

For best text results:
- Put text in quotes within the prompt: `"the word 'HELLO' in..."`
- Specify font style: `serif, sans-serif, bold, italic, handwritten`
- Keep text short (1-3 words work best)

---

## Creative Use Cases

### 1. Logo Design System
```bash
# Primary logo
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "minimalist tech logo, letter N formed by circuit paths, blue gradient, professional" \
  logo_primary.png --aspect 1:1 --size 2K

# Icon version (simplified)
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "simplified app icon version of this logo, works at small sizes" \
  logo_icon.png --ref logo_primary.png --aspect 1:1 --size 2K

# Dark mode version
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "dark mode version, white/light colors on dark background" \
  logo_dark.png --ref logo_primary.png --aspect 1:1 --size 2K

# Wide/horizontal version
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "horizontal lockup with icon left and company name right" \
  logo_wide.png --ref logo_primary.png --aspect 3:1 --size 2K
```

### 2. Social Media Kit
```bash
# Instagram post
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "announcement post: 'Coming Soon' with abstract tech background" \
  social_ig_post.png --aspect 1:1 --size 2K

# Instagram story
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "vertical story format of the same announcement" \
  social_ig_story.png --ref social_ig_post.png --aspect 9:16 --size 2K

# Twitter/LinkedIn header
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "wide banner version for social headers" \
  social_header.png --ref social_ig_post.png --aspect 3:1 --size 2K

# YouTube thumbnail
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "eye-catching YouTube thumbnail with bold text 'NEW FEATURE'" \
  yt_thumb.png --aspect 16:9 --size 2K
```

### 3. Product Mockups
```bash
# Phone mockup
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "iPhone showing app on screen, floating at angle, soft shadow, studio lighting" \
  mockup_phone.png --input app_screenshot.png --aspect 4:5 --size 2K

# Laptop mockup
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "MacBook Pro showing website, modern desk setup, shallow depth of field" \
  mockup_laptop.png --input website_screenshot.png --aspect 16:9 --size 2K

# Multi-device mockup
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "responsive design showcase: phone, tablet, laptop showing same website" \
  mockup_responsive.png --aspect 16:9 --size 2K
```

### 4. App Icon Variations
```bash
# iOS style
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "iOS app icon, rounded square, gradient background, simple geometric symbol, glossy" \
  icon_ios.png --aspect 1:1 --size 2K

# Android adaptive icon (foreground)
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "app icon foreground layer only, centered symbol, transparent areas" \
  icon_android_fg.png --aspect 1:1 --size 2K

# macOS style
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "macOS app icon, slightly tilted, subtle shadow, Big Sur style" \
  icon_macos.png --aspect 1:1 --size 2K
```

### 5. Illustration Series
```bash
# Create base style
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "flat illustration, person working at computer, soft pastel colors, minimal" \
  illust_base.png --aspect 4:3 --size 2K

# Create series with consistent style
for scene in "team meeting" "coffee break" "video call" "brainstorming"; do
  python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
    "flat illustration of $scene, same style" \
    "illust_${scene// /_}.png" \
    --ref illust_base.png --aspect 4:3 --size 2K
done
```

### 6. E-commerce Product Images
```bash
# Main product shot
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "product on white background, studio lighting, centered" \
  product_main.png --input raw_product.png --aspect 1:1 --size 2K

# Lifestyle shot
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "product in use, lifestyle setting, natural lighting" \
  product_lifestyle.png --input raw_product.png --aspect 4:5 --size 2K

# Detail shot
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "close-up detail shot showing texture and quality" \
  product_detail.png --input raw_product.png --aspect 1:1 --size 2K
```

### 7. Blog/Article Graphics
```bash
# Technical article header
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "abstract visualization of machine learning, neural networks, data flow, blue tech aesthetic" \
  blog_ml_header.png --aspect 16:9 --size 1K

# How-to article
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "isometric illustration of step-by-step process, numbered steps, clean design" \
  blog_howto.png --aspect 16:9 --size 1K

# Opinion/thought piece
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "abstract conceptual art, thinking, ideas, lightbulbs, connections" \
  blog_opinion.png --aspect 16:9 --size 1K
```

### 8. Presentation Slides
```bash
# Title slide background
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "professional presentation background, subtle gradient, geometric shapes, corporate" \
  slide_bg_title.png --aspect 16:9 --size 2K

# Section divider
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "bold section divider graphic, abstract, same color scheme" \
  slide_bg_section.png --ref slide_bg_title.png --aspect 16:9 --size 2K

# Content background (subtle)
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "very subtle, light background for content slides, minimal distraction" \
  slide_bg_content.png --ref slide_bg_title.png --aspect 16:9 --size 2K
```

### 9. Email Marketing Graphics
```bash
# Email header
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "email header banner, 'Summer Sale' text, bright colors, engaging" \
  email_header.png --aspect 3:1 --size 1K

# Product feature block
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "product feature highlight, clean white background, floating product" \
  email_product.png --aspect 1:1 --size 1K
```

### 10. Game/Interactive Assets
```bash
# Character sprites
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "pixel art character, 16-bit style, idle pose, transparent background" \
  character_idle.png --aspect 1:1 --size 1K

# Background tiles
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "seamless tileable grass texture, top-down game view, pixel art" \
  tile_grass.png --aspect 1:1 --size 1K

# UI elements
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "game UI button, fantasy style, ornate border, 'START' text" \
  ui_button.png --aspect 3:1 --size 1K
```

---

## Project-Specific Examples

### Web Application

```bash
# Directory structure
mkdir -p public/images assets/icons

# Generate all assets
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "modern SaaS logo, abstract S shape, gradient blue to purple" \
  public/images/logo.png --aspect 1:1 --size 2K

python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "favicon version, simplified, works at 32x32" \
  public/favicon.png --ref public/images/logo.png --aspect 1:1 --size 1K

python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "hero section background, abstract waves, same color scheme, subtle" \
  public/images/hero-bg.png --ref public/images/logo.png --aspect 21:9 --size 2K

python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "open graph social preview image, logo centered, branded background" \
  public/images/og-image.png --ref public/images/logo.png --aspect 2:1 --size 1K
```

### Mobile App

```bash
mkdir -p assets/images

# App icon
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "mobile app icon, rounded, gradient, simple symbol, iOS style" \
  assets/icon.png --aspect 1:1 --size 2K

# Splash screen
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "app splash screen, centered logo, gradient background matching icon" \
  assets/splash.png --ref assets/icon.png --aspect 9:16 --size 2K

# Onboarding illustrations
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "onboarding illustration: person using phone, flat style, friendly" \
  assets/images/onboard1.png --aspect 1:1 --size 1K

python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "onboarding illustration: notifications concept, same style" \
  assets/images/onboard2.png --ref assets/images/onboard1.png --aspect 1:1 --size 1K

python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "onboarding illustration: success/completion, same style" \
  assets/images/onboard3.png --ref assets/images/onboard1.png --aspect 1:1 --size 1K

# Empty states
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "empty state illustration: no messages, friendly, minimal" \
  assets/images/empty_messages.png --aspect 1:1 --size 1K
```

### Landing Page

```bash
mkdir -p public/images

# Hero
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "stunning hero image, person using modern software, bright, optimistic, professional photography style" \
  public/images/hero.png --aspect 16:9 --size 2K

# Feature icons
for feature in "speed" "security" "analytics" "collaboration"; do
  python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
    "simple icon representing $feature, line art, single color, minimal" \
    "public/images/icon-$feature.png" --aspect 1:1 --size 1K
done

# Testimonial backgrounds
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "abstract background for testimonials section, soft gradient, professional" \
  public/images/testimonials-bg.png --aspect 16:9 --size 1K

# CTA section
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "eye-catching call-to-action background, energetic, gradient, modern" \
  public/images/cta-bg.png --aspect 21:9 --size 2K
```

### Blog/Content Site

```bash
mkdir -p content/images

# Default featured image
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "generic tech blog featured image, abstract, modern, versatile" \
  content/images/default-featured.png --aspect 16:9 --size 1K

# Category images
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "category image: tutorials, hands-on learning visualization" \
  content/images/cat-tutorials.png --aspect 16:9 --size 1K

python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "category image: news, information flow, updates concept" \
  content/images/cat-news.png --aspect 16:9 --size 1K

# Author avatar placeholder
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "generic author avatar, friendly face silhouette, professional" \
  content/images/author-placeholder.png --aspect 1:1 --size 1K
```

---

## Batch Operations

### Shell Script for Multiple Images

```bash
#!/bin/bash
# generate_assets.sh

source ~/.zshrc
SCRIPT="python3 ~/.claude/skills/imagegen/scripts/generate_image.py"

# Array of prompts and outputs
declare -a IMAGES=(
  "logo|assets/logo.png|1:1|2K"
  "hero banner|assets/hero.png|16:9|2K"
  "icon|assets/icon.png|1:1|1K"
)

for item in "${IMAGES[@]}"; do
  IFS='|' read -r prompt output aspect size <<< "$item"
  $SCRIPT "$prompt" "$output" --aspect "$aspect" --size "$size"
done
```

### Generating Variations

```bash
# Base image
python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
  "abstract logo concept" v1.png --aspect 1:1 --size 2K

# Generate 5 variations
for i in {2..5}; do
  python3 ~/.claude/skills/imagegen/scripts/generate_image.py \
    "create a different variation of this design" "v$i.png" \
    --ref v1.png --aspect 1:1 --size 2K
done
```

---

## Claude Code Integration

### Automatic Context Understanding

Claude Code will automatically:

1. **Determine aspect ratio** based on asset type:
   - Icon request → 1:1
   - Banner request → 16:9 or 21:9
   - Story/mobile → 9:16

2. **Choose resolution** based on use:
   - Quick preview → 1K
   - Production web → 2K
   - Print/wallpaper → 4K

3. **Select output path** based on project structure:
   - Next.js → `public/images/`
   - React → `src/assets/`
   - Mobile → `assets/`

### Natural Language Commands

Just tell Claude Code what you need:

- "Create a logo for this project"
- "I need a hero image for the landing page"
- "Generate an app icon"
- "Make a banner for the blog post about AI"
- "Create variations of the logo in different colors"
- "Edit this image to have a sunset background"

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `GEMINI_API_KEY not set` | Run `source ~/.zshrc` or restart terminal |
| Request timeout | Try simpler prompt or smaller size |
| No image in response | Content policy may have blocked; rephrase prompt |
| Wrong aspect ratio | Explicitly specify `--aspect` |

### Environment Check

```bash
# Verify API key is loaded
echo $GEMINI_API_KEY

# If empty, reload:
source ~/.zshrc

# Test basic generation
python3 ~/.claude/skills/imagegen/scripts/generate_image.py "test image, blue square" test.png
```

---

## API Limits & Costs

- **Model:** gemini-3-pro-image-preview
- **Max reference images:** 14
- **Timeout:** 180 seconds per request
- **Supported output:** PNG

---

## File Locations

| File | Path |
|------|------|
| Script | `~/.claude/skills/imagegen/scripts/generate_image.py` |
| Skill docs | `~/.claude/skills/imagegen/SKILL.md` |
| This manual | `~/.claude/skills/imagegen/IMAGE_GENERATION_MANUAL.md` |
| Global config | `~/.claude/CLAUDE.md` |
| API key | `~/.zshrc` (GEMINI_API_KEY) |

---

## Version

- **Created:** December 2024
- **Model:** Nano Banana Pro (gemini-3-pro-image-preview)
- **Features:** Text-to-image, image editing, multi-reference, 4K output, advanced text rendering

---

*Drop this file into any project's `/docs` folder to give Claude Code full context on image generation capabilities.*
