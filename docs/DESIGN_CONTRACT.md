# Design Contract

## Source

This contract is based on the approved Codex design-mockup direction created
before implementation. The preview image is stored at:

```text
docs/design/cliplot-homepage-mockup.png
```

The image is a visual direction, not a pixel-perfect implementation contract.
This markdown file is the controlling design contract.

## Design Goal

The site must look like a mature Czech e-commerce shop designed by a human. It
must not look AI-generated.

## Audience

- Czech users age 15-65.
- Mobile, laptop, and desktop.
- Modern and older devices.
- Mixed technical confidence.

## Visual System

| Token | Value | Use |
| --- | --- | --- |
| Background | `#FAFAF7` | Page background |
| Text | `#1F2421` | Primary text |
| Secondary text | `#6F766D` | Metadata |
| CTA | `#2F6B4F` | Primary actions |
| CTA hover | `#24543E` | Hover/active |
| Divider | `#E3E0D8` | Borders |
| Soft block | `#F1EFE8` | Subtle bands |
| Price accent | `#8A3A36` | Prices only, sparingly |

Typography:

- neutral sans-serif;
- no decorative display font;
- body 16-18px;
- buttons 15-16px;
- H1 only where there is a true first-viewport heading;
- no negative letter spacing.

## Homepage Structure

First viewport must include:

- compact header;
- `Cliplot` brand;
- category navigation;
- search;
- cart;
- product/category image;
- price in Kč;
- stock state `Skladem`;
- delivery estimate `Doručení 1-2 dny`;
- CTA `Do košíku` or `Koupit`;
- trust strip.

Avoid a generic marketing hero. Products and purchase action come first.

## Mobile Structure

- Sticky header with brand, search, and cart.
- Product image before explanatory copy.
- Price and CTA visible without long scrolling.
- Sticky add-to-cart on product detail.
- Two-column product grid where space allows.
- Forms readable at 360px width.

## Czech Trust Copy

Use concrete Czech labels:

- `Kategorie`
- `Novinky`
- `Akce`
- `Doprava a platba`
- `Skladem`
- `Doručení 1-2 dny`
- `Do košíku`
- `Koupit`
- `Bezpečná platba`
- `Vrácení zboží`
- `Česká podpora`

## Anti-AI Rules

Forbidden:

- purple/blue gradients;
- glowing orbs;
- glassmorphism;
- abstract 3D decoration;
- sterile fake AI people;
- generic "future of shopping" copy;
- cards inside cards;
- excessive shadows;
- purely atmospheric product images.

Required:

- concrete products;
- visible prices;
- visible delivery;
- real-life product photography direction;
- restrained UI;
- clear checkout path.
