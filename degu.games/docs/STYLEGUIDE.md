# Design Styleguide - Betting Games Platform

> **Version**: 1.0  
> **Last Updated**: November 2025  
> **Mode**: Dark Mode Only  
> **Inspired By**: Apple App Store Design Language

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Interactive Elements](#interactive-elements)
7. [Cards & Content](#cards--content)
8. [Navigation](#navigation)
9. [Effects & Motion](#effects--motion)
10. [Accessibility](#accessibility)

---

## Design Philosophy

### Core Principles

1. **Content First**: Let game content and user creations take center stage. UI should be elegant but never compete with content.
2. **Data-Driven Design**: Financial information (entry fees, prize pools, player counts) should be immediately scannable and prominent.
3. **Trust Through Clarity**: Use clear hierarchy and consistent patterns to build confidence in transactions and game integrity.
4. **Comfortable Darkness**: Pure black (#000000) base with layered elevation, inspired by premium crypto/trading platforms.
5. **Spatial Depth**: Use subtle shadows, borders, and elevation to create depth without being heavy-handed.
6. **Purposeful Animation**: Motion should guide attention and provide feedback, never distract.
7. **Professional Gamification**: Balance serious trading aesthetics with playful gaming elements - think Pump.fun's energy meets OpenSea's professionalism.

---

## Color System

### Base Colors

```
Background Hierarchy:
├── Primary Background: #000000 (Pure black - main canvas)
├── Secondary Background: #0A0A0A (Elevated surfaces)
├── Tertiary Background: #1C1C1E (Cards, panels)
└── Quaternary Background: #2C2C2E (Hover states, subtle separation)
```

### Semantic Colors

```
Interface Grays:
├── Gray 1 (Dividers, hairlines): #38383A
├── Gray 2 (Disabled states): #48484A
├── Gray 3 (Tertiary text): #636366
├── Gray 4 (Secondary text): #98989D
├── Gray 5 (Primary text): #F5F5F7
└── Pure White (Headlines, emphasis): #FFFFFF
```

### Accent Colors

```
Primary Accent (Actions):
├── Blue Primary: #0A84FF (Primary CTAs, links)
├── Blue Hover: #409CFF
├── Blue Pressed: #0077ED
└── Blue Subtle: rgba(10, 132, 255, 0.15) (Backgrounds)

Success (Positive/Profit):
├── Green: #30D158 (Use for profits, positive changes)
├── Green Bright: #34C759 (Active lobbies, "ready" states)
└── Green Subtle: rgba(48, 209, 88, 0.15)

Warning (Caution):
├── Yellow/Orange: #FFD60A (Waiting states, pending)
├── Orange: #FF9F0A (Warnings)
└── Orange Subtle: rgba(255, 159, 10, 0.15)

Error/Danger (Negative/Loss):
├── Red: #FF453A (Use for losses, negative changes)
└── Red Subtle: rgba(255, 69, 58, 0.15)

Purple (Featured/Premium):
├── Purple: #BF5AF2 (Premium features, special badges)
└── Purple Subtle: rgba(191, 90, 242, 0.15)

Crypto/Trading Specific:
├── Chart Green: #26A69A (Upward trends)
├── Chart Red: #EF5350 (Downward trends)
└── Neutral Gray: #B0B0B0 (No change indicators)
```

### Gradient System

```
Hero Gradients (for featured content):
├── Gradient 1: linear-gradient(135deg, #667EEA 0%, #764BA2 100%)
├── Gradient 2: linear-gradient(135deg, #F093FB 0%, #F5576C 100%)
├── Gradient 3: linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)
├── Gradient 4: linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)
└── Gradient 5: linear-gradient(135deg, #FA709A 0%, #FEE140 100%)

Subtle Overlays:
├── Dark Scrim: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%)
└── Top Fade: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)
```

---

## Typography

### Font Stack

```
Primary (UI):
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
             "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

Monospace (Code, Stats):
font-family: "SF Mono", "Monaco", "Cascadia Code",
             "Consolas", monospace;
```

### Type Scale

```
Display Levels (Headlines, Hero):
├── Display XL: 56px / 64px line-height / -0.5px letter-spacing / Weight 700
├── Display L:  48px / 56px / -0.5px / Weight 700
├── Display M:  40px / 48px / -0.4px / Weight 700
└── Display S:  32px / 40px / -0.3px / Weight 700

Headings:
├── H1: 28px / 34px / -0.3px / Weight 700
├── H2: 24px / 30px / -0.2px / Weight 600
├── H3: 20px / 26px / -0.2px / Weight 600
├── H4: 18px / 24px / -0.1px / Weight 600
└── H5: 16px / 22px / -0.1px / Weight 600

Body Text:
├── Body Large:   17px / 24px / 0px / Weight 400
├── Body Regular: 15px / 21px / 0px / Weight 400
├── Body Small:   13px / 18px / 0px / Weight 400
└── Caption:      11px / 16px / 0px / Weight 400

Labels & UI:
├── Label Large:   15px / 20px / 0px / Weight 600
├── Label Regular: 13px / 18px / 0px / Weight 600
└── Label Small:   11px / 16px / 0px / Weight 600
```

### Font Weights

```
├── Regular: 400 (Body text, descriptions)
├── Medium:  500 (Subtle emphasis)
├── Semibold: 600 (Labels, buttons, section headers)
└── Bold: 700 (Headlines, numbers, strong emphasis)
```

### Text Colors

```
Primary Text:   #F5F5F7 (Main content)
Secondary Text: #98989D (Descriptions, metadata)
Tertiary Text:  #636366 (Timestamps, subtle info)
Accent Text:    #0A84FF (Links, interactive text)
```

---

## Spacing & Layout

### Spacing Scale (8px base unit)

```
├── XXS: 4px   (Tight spacing, inline elements)
├── XS:  8px   (Compact spacing)
├── S:   12px  (Related elements)
├── M:   16px  (Standard spacing - default)
├── L:   24px  (Section spacing)
├── XL:  32px  (Major sections)
├── XXL: 48px  (Content blocks)
└── XXXL: 64px (Page sections)
```

### Layout Grid

```
Container Widths:
├── Max Width: 1440px (main content container)
├── Content Width: 1200px (text-heavy content)
└── Narrow Width: 800px (forms, focused content)

Columns:
├── Desktop: 12 columns (1fr grid with 24px gap)
├── Tablet:  8 columns (1fr grid with 20px gap)
└── Mobile:  4 columns (1fr grid with 16px gap)

Side Padding:
├── Desktop: 48px
├── Tablet:  32px
└── Mobile:  16px
```

### Sidebar (Apple-style)

```
Width: 260px (fixed)
Background: #000000
Padding: 16px
Items:
  - Padding: 8px 12px
  - Border Radius: 8px
  - Font: 15px / Weight 600
  - Active Background: #1C1C1E
  - Hover Background: rgba(255,255,255,0.05)
```

---

## Components

### Buttons

#### Primary Button (CTA)

```
Background: #0A84FF
Text Color: #FFFFFF
Font: 15px / Weight 600
Padding: 12px 24px
Border Radius: 12px
Height: 44px (minimum touch target)

States:
├── Hover:    Background #409CFF
├── Pressed:  Background #0077ED + scale(0.98)
├── Disabled: Background #38383A + Text #636366
└── Focus:    Outline 2px #0A84FF + 4px offset
```

#### Secondary Button (Outline)

```
Background: transparent
Border: 1px solid #48484A
Text Color: #F5F5F7
Font: 15px / Weight 600
Padding: 12px 24px
Border Radius: 12px
Height: 44px

States:
├── Hover:    Background rgba(255,255,255,0.05)
├── Pressed:  Background rgba(255,255,255,0.08)
└── Disabled: Border #38383A + Text #636366
```

#### Tertiary Button (Ghost)

```
Background: transparent
Border: none
Text Color: #0A84FF
Font: 15px / Weight 600
Padding: 12px 16px
Border Radius: 8px
Height: 44px

States:
├── Hover:    Background rgba(10,132,255,0.1)
└── Pressed:  Background rgba(10,132,255,0.15)
```

#### Button Sizes

```
Large:
  Height: 50px
  Padding: 14px 28px
  Font: 17px / Weight 600
  Border Radius: 14px

Regular:
  Height: 44px
  Padding: 12px 24px
  Font: 15px / Weight 600
  Border Radius: 12px

Small:
  Height: 36px
  Padding: 8px 16px
  Font: 13px / Weight 600
  Border Radius: 10px
```

### Input Fields

```
Background: #1C1C1E
Border: 1px solid transparent
Text Color: #F5F5F7
Placeholder: #636366
Font: 15px / Weight 400
Padding: 12px 16px
Border Radius: 10px
Height: 44px

States:
├── Focus:   Border #0A84FF + Background #2C2C2E
├── Error:   Border #FF453A
├── Success: Border #30D158
└── Disabled: Background #0A0A0A + Text #48484A

Label:
  Font: 13px / Weight 600
  Color: #98989D
  Margin Bottom: 8px
```

### Search Bar

```
Background: #1C1C1E
Border: none
Text Color: #F5F5F7
Placeholder: #636366
Font: 15px / Weight 400
Padding: 10px 16px 10px 40px (left padding for icon)
Border Radius: 12px
Height: 40px

Icon:
  Position: Absolute left 12px
  Color: #636366
  Size: 18px

States:
├── Focus: Background #2C2C2E + Icon Color #0A84FF
└── Filled: Icon Color #F5F5F7
```

### Badges

```
Default Badge:
├── Background: #2C2C2E
├── Text Color: #F5F5F7
├── Font: 11px / Weight 600 / Uppercase
├── Padding: 4px 8px
├── Border Radius: 6px
└── Letter Spacing: 0.5px

Status Badges:
├── Success: Background #30D158 + Text #000000
├── Warning: Background #FF9F0A + Text #000000
├── Error:   Background #FF453A + Text #FFFFFF
├── Info:    Background #0A84FF + Text #FFFFFF
└── Premium: Background linear-gradient(135deg, #667EEA, #764BA2) + Text #FFFFFF
```

### Tags (for categories)

```
Background: rgba(255,255,255,0.1)
Text Color: #F5F5F7
Font: 13px / Weight 500
Padding: 6px 12px
Border Radius: 20px (pill shape)
Border: 1px solid rgba(255,255,255,0.1)

States:
├── Hover:    Background rgba(255,255,255,0.15)
└── Selected: Background #0A84FF + Border transparent
```

---

## Cards & Content

### Standard Content Card

```
Background: #1C1C1E
Border: 1px solid rgba(255,255,255,0.05)
Border Radius: 16px
Padding: 0 (content manages its own padding)
Overflow: hidden

States:
├── Hover: Border rgba(255,255,255,0.1) + translate Y -2px
└── Pressed: scale(0.98)

Transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)
```

### Card with Image (Game Card)

```
Structure:
├── Image Container
│   ├── Aspect Ratio: 16:9 or 1:1
│   ├── Object Fit: cover
│   └── Overlay: linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.8))
├── Content Padding: 16px
├── Title: 17px / Weight 600 / Color #F5F5F7
├── Description: 13px / Weight 400 / Color #98989D
└── Meta: 11px / Weight 400 / Color #636366

Badge Position: Absolute top 12px, right 12px
```

### Featured Hero Card

```
Background: Gradient (from gradient system)
Border Radius: 24px
Padding: 40px
Min Height: 400px
Overlay: linear-gradient(135deg, rgba(0,0,0,0.2), rgba(0,0,0,0.6))

Content:
├── Eyebrow: 13px / Weight 600 / Uppercase / Color rgba(255,255,255,0.8)
├── Title: 48px / Weight 700 / Color #FFFFFF
├── Description: 17px / Weight 400 / Color rgba(255,255,255,0.9)
└── CTA Button: Primary style with white background + dark text
```

### List Item Card

```
Background: transparent
Border Bottom: 1px solid #38383A
Padding: 16px 0
Display: flex / align-items: center

Structure:
├── Icon/Thumbnail: 48px × 48px / Border Radius 12px
├── Content: flex-grow: 1 / margin: 0 16px
│   ├── Title: 15px / Weight 600
│   └── Subtitle: 13px / Weight 400 / Color #98989D
└── Action: Chevron or button

Hover: Background rgba(255,255,255,0.03)
```

### Section Container

```
Background: #0A0A0A (optional, for separation)
Border Radius: 20px
Padding: 32px
Margin Bottom: 32px

Section Header:
├── Title: 24px / Weight 600 / Color #F5F5F7
├── Subtitle: 15px / Weight 400 / Color #98989D / Margin Top 4px
└── Action Link: 15px / Weight 600 / Color #0A84FF (optional "View All")

Spacing: 24px between header and content grid
```

---

## Interactive Elements

### Links

```
Default State:
├── Color: #0A84FF
├── Text Decoration: none
└── Font: inherit parent

States:
├── Hover: Color #409CFF + underline
├── Visited: Color #BF5AF2
└── Focus: Outline 2px #0A84FF + 2px offset

Inline Links: Use default text color but underline on hover
Navigation Links: No underline, use background color change
```

### Tabs

```
Container:
├── Background: #1C1C1E
├── Border Radius: 12px
├── Padding: 4px
└── Display: flex / gap 4px

Tab Item:
├── Background: transparent
├── Color: #98989D
├── Font: 15px / Weight 600
├── Padding: 10px 20px
├── Border Radius: 8px
└── Transition: all 0.2s ease

Active Tab:
├── Background: #2C2C2E
└── Color: #F5F5F7

Hover (inactive):
└── Background: rgba(255,255,255,0.05)
```

### Toggle Switch

```
Track:
├── Width: 51px
├── Height: 31px
├── Background: #39393D (off) / #30D158 (on)
├── Border Radius: 16px
└── Padding: 2px

Thumb:
├── Size: 27px × 27px
├── Background: #FFFFFF
├── Border Radius: 50%
├── Position: Left 2px (off) / Right 2px (on)
└── Transition: transform 0.2s ease
```

### Checkbox

```
Size: 20px × 20px
Border: 2px solid #636366
Border Radius: 6px
Background: transparent (unchecked) / #0A84FF (checked)

Checkmark:
├── Color: #FFFFFF
├── Icon: SVG checkmark
└── Size: 12px

States:
├── Hover: Border Color #98989D
├── Focus: Outline 2px #0A84FF + 2px offset
└── Disabled: Border #38383A + Background #1C1C1E
```

### Radio Button

```
Size: 20px × 20px
Border: 2px solid #636366
Border Radius: 50%
Background: transparent

Selected State:
├── Border Color: #0A84FF
└── Inner Circle: 10px / Background #0A84FF

States:
├── Hover: Border Color #98989D
└── Focus: Outline 2px #0A84FF + 2px offset
```

### Slider

```
Track:
├── Height: 4px
├── Background: #48484A
├── Border Radius: 2px
└── Position: relative

Progress:
├── Background: #0A84FF
├── Height: 4px
└── Border Radius: 2px

Thumb:
├── Size: 20px × 20px
├── Background: #FFFFFF
├── Border Radius: 50%
├── Box Shadow: 0 2px 8px rgba(0,0,0,0.3)
└── Position: absolute / top -8px

States:
├── Hover: Thumb scale(1.1)
├── Active: Thumb scale(0.95)
└── Focus: Thumb outline 2px #0A84FF + 2px offset
```

### Dropdown/Select

```
Trigger:
├── Background: #1C1C1E
├── Border: 1px solid transparent
├── Padding: 12px 40px 12px 16px (right padding for icon)
├── Border Radius: 10px
├── Height: 44px
├── Font: 15px / Weight 400
└── Icon: Chevron down (absolute right 12px)

States:
├── Hover: Background #2C2C2E
├── Open: Border Color #0A84FF
└── Focus: Border Color #0A84FF

Menu:
├── Background: #2C2C2E
├── Border: 1px solid rgba(255,255,255,0.1)
├── Border Radius: 12px
├── Padding: 8px
├── Box Shadow: 0 8px 24px rgba(0,0,0,0.4)
├── Max Height: 300px
└── Overflow: auto

Menu Item:
├── Padding: 10px 12px
├── Border Radius: 8px
├── Font: 15px / Weight 400
├── Hover: Background rgba(255,255,255,0.1)
└── Selected: Background #0A84FF + Color #FFFFFF
```

---

## Navigation

### Top Navigation Bar

```
Background: rgba(0,0,0,0.8)
Backdrop Filter: blur(20px)
Height: 64px
Border Bottom: 1px solid rgba(255,255,255,0.1)
Position: sticky / top 0
Z-index: 100

Content:
├── Logo: Height 32px / Margin Right auto
├── Nav Items: Display flex / gap 24px
│   ├── Font: 15px / Weight 600
│   ├── Color: #98989D
│   ├── Padding: 8px 12px
│   ├── Border Radius: 8px
│   ├── Active: Color #F5F5F7 + Background rgba(255,255,255,0.1)
│   └── Hover: Color #F5F5F7
└── User Avatar: Size 36px / Border Radius 50%
```

### Sidebar Navigation (Apple App Store style)

```
Width: 260px
Background: #000000
Padding: 16px
Border Right: 1px solid rgba(255,255,255,0.1)

Section:
├── Header: 11px / Weight 600 / Uppercase / Color #636366 / Padding 12px
└── Items List: gap 4px

Nav Item:
├── Padding: 10px 12px
├── Border Radius: 10px
├── Font: 15px / Weight 600
├── Color: #98989D
├── Display: flex / align-items center / gap 12px
├── Icon: Size 20px / Color inherit
├── Active: Background #1C1C1E + Color #F5F5F7
└── Hover: Background rgba(255,255,255,0.05)
```

### Breadcrumbs

```
Display: flex / align-items center / gap 8px
Font: 13px / Weight 400
Color: #636366

Item:
├── Color: #636366
└── Hover: Color #0A84FF

Active/Current:
└── Color: #F5F5F7

Separator:
├── Content: "›" or chevron icon
├── Color: #48484A
└── Size: 14px
```

### Pagination

```
Container: Display flex / gap 8px / justify-content center

Button:
├── Size: 36px × 36px
├── Border Radius: 8px
├── Background: transparent
├── Border: 1px solid #48484A
├── Color: #F5F5F7
├── Font: 13px / Weight 600

States:
├── Hover: Background rgba(255,255,255,0.05)
├── Active: Background #0A84FF + Border transparent
└── Disabled: Color #48484A + Border #38383A
```

---

## Effects & Motion

### Shadows

```
Elevation Levels:

Level 1 (Subtle):
box-shadow: 0 1px 2px rgba(0,0,0,0.3),
            0 1px 3px rgba(0,0,0,0.2);

Level 2 (Cards):
box-shadow: 0 2px 8px rgba(0,0,0,0.3),
            0 4px 12px rgba(0,0,0,0.2);

Level 3 (Modals, Dropdowns):
box-shadow: 0 8px 24px rgba(0,0,0,0.4),
            0 16px 48px rgba(0,0,0,0.3);

Level 4 (Major Elements):
box-shadow: 0 16px 48px rgba(0,0,0,0.5),
            0 24px 64px rgba(0,0,0,0.4);

Glow Effects:
├── Blue Glow:   0 0 24px rgba(10,132,255,0.3)
├── Purple Glow: 0 0 24px rgba(191,90,242,0.3)
└── Green Glow:  0 0 24px rgba(48,209,88,0.3)
```

### Border Styles

```
Hairline:
border: 1px solid rgba(255,255,255,0.05)

Subtle:
border: 1px solid rgba(255,255,255,0.1)

Standard:
border: 1px solid #38383A

Prominent:
border: 1px solid #48484A

Accent:
border: 2px solid #0A84FF
```

### Border Radius

```
├── XS: 6px   (Badges, small elements)
├── S:  8px   (Buttons, inputs)
├── M:  12px  (Cards, panels)
├── L:  16px  (Large cards)
├── XL: 20px  (Sections)
├── XXL: 24px (Hero elements)
└── Pill: 9999px (Pills, tags)
```

### Transitions

```
Standard:
transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);

Smooth:
transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);

Snappy:
transition: all 0.15s cubic-bezier(0.4, 0.0, 0.2, 1);

Elastic:
transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

### Animation Patterns

```
Fade In:
├── opacity: 0 → 1
├── Duration: 0.3s
└── Easing: ease-out

Slide Up:
├── transform: translateY(20px) → translateY(0)
├── opacity: 0 → 1
├── Duration: 0.4s
└── Easing: cubic-bezier(0.4, 0.0, 0.2, 1)

Scale In:
├── transform: scale(0.95) → scale(1)
├── opacity: 0 → 1
├── Duration: 0.2s
└── Easing: cubic-bezier(0.4, 0.0, 0.2, 1)

Hover Lift:
├── transform: translateY(0) → translateY(-4px)
├── box-shadow: level 1 → level 2
├── Duration: 0.2s
└── Easing: ease-out
```

### Loading States

```
Skeleton Loader:
├── Background: linear-gradient(90deg, #1C1C1E 0%, #2C2C2E 50%, #1C1C1E 100%)
├── Animation: shimmer 1.5s infinite
└── Border Radius: inherit from element

Spinner:
├── Size: 24px (default)
├── Border: 2px solid rgba(255,255,255,0.1)
├── Border Top: 2px solid #0A84FF
├── Animation: spin 0.6s linear infinite
└── Border Radius: 50%

Progress Bar:
├── Height: 4px
├── Background: #38383A
├── Progress Color: #0A84FF
├── Border Radius: 2px
└── Animation: progress 1s ease-in-out
```

### Blur & Filters

```
Backdrop Blur (for nav, modals):
backdrop-filter: blur(20px) saturate(180%);

Frosted Glass:
background: rgba(28,28,30,0.8);
backdrop-filter: blur(40px) saturate(180%);

Disabled State:
filter: grayscale(50%) opacity(0.5);
```

---

## Accessibility

### Focus Indicators

```
Default Focus:
outline: 2px solid #0A84FF;
outline-offset: 2px;
border-radius: inherit;

Dark Focus (for light backgrounds):
outline: 2px solid #0077ED;

Focus Visible (keyboard only):
:focus-visible {
  outline: 2px solid #0A84FF;
  outline-offset: 2px;
}

:focus:not(:focus-visible) {
  outline: none;
}
```

### Minimum Touch Targets

```
All interactive elements:
├── Minimum Height: 44px
├── Minimum Width: 44px
└── Padding: ensure 44×44 hit area even if visual is smaller
```

### Color Contrast Ratios

```
Must Meet WCAG AA:
├── Normal Text: 4.5:1 minimum
├── Large Text (18px+): 3:1 minimum
└── UI Components: 3:1 minimum

Current Palette Compliance:
├── #F5F5F7 on #000000: 18.5:1 ✓
├── #98989D on #000000: 9.2:1 ✓
├── #0A84FF on #000000: 8.1:1 ✓
└── #636366 on #000000: 4.8:1 ✓ (for large text only)
```

### Screen Reader Support

```
Always Include:
├── Semantic HTML (nav, main, article, section, etc.)
├── Alt text for images
├── aria-label for icon-only buttons
├── aria-expanded for collapsible elements
├── aria-selected for tabs
├── aria-current for active navigation
└── role attributes when needed

Skip Links:
<a href="#main-content" class="skip-link">Skip to content</a>

.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  z-index: 1000;
}

.skip-link:focus {
  top: 0;
}
```

### Reduced Motion

```
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Specialized Components

### Modal/Dialog

```
Overlay:
├── Background: rgba(0,0,0,0.75)
├── Backdrop Filter: blur(8px)
└── Z-index: 1000

Modal Container:
├── Background: #1C1C1E
├── Border: 1px solid rgba(255,255,255,0.1)
├── Border Radius: 20px
├── Padding: 32px
├── Max Width: 600px
├── Box Shadow: Level 4
└── Animation: Scale In + Fade In

Header:
├── Title: 24px / Weight 600
├── Close Button: absolute top right
└── Margin Bottom: 24px

Content:
├── Max Height: 70vh
└── Overflow: auto

Footer:
├── Display: flex / justify-content flex-end / gap 12px
├── Margin Top: 24px
└── Buttons: Secondary + Primary
```

### Toast Notification

```
Container:
├── Background: #2C2C2E
├── Border: 1px solid rgba(255,255,255,0.1)
├── Border Radius: 12px
├── Padding: 16px
├── Min Width: 300px
├── Max Width: 400px
├── Box Shadow: Level 3
└── Animation: Slide Up from bottom

Variants:
├── Success: Border Left 4px solid #30D158
├── Warning: Border Left 4px solid #FF9F0A
├── Error: Border Left 4px solid #FF453A
└── Info: Border Left 4px solid #0A84FF

Content:
├── Icon: 20px / margin right 12px
├── Title: 15px / Weight 600
├── Message: 13px / Weight 400 / Color #98989D
└── Close: Icon button / absolute top right

Position: Fixed / bottom 24px / right 24px / z-index 2000
Duration: Auto-dismiss after 5s (or manual close)
```

### Tooltip

```
Container:
├── Background: #2C2C2E
├── Border: 1px solid rgba(255,255,255,0.1)
├── Border Radius: 8px
├── Padding: 8px 12px
├── Font: 13px / Weight 400
├── Color: #F5F5F7
├── Max Width: 200px
├── Box Shadow: Level 2
└── Z-index: 1500

Arrow:
├── Size: 6px
├── Color: #2C2C2E
└── Position: calculated based on placement

Animation:
├── Fade In: 0.15s
└── Delay: 0.3s (before showing)
```

### Avatar

```
Sizes:
├── XS: 24px
├── S:  32px
├── M:  40px
├── L:  48px
├── XL: 64px
└── XXL: 96px

Styles:
├── Border Radius: 50%
├── Object Fit: cover
├── Border: 2px solid #38383A (optional)
└── Background: #2C2C2E (placeholder)

Placeholder (if no image):
├── Display: User initials
├── Background: Gradient from accent colors
├── Text: Centered / Weight 600 / Color #FFFFFF
└── Font Size: size / 2.5
```

### Stat Card (for crypto/betting stats)

```
Container:
├── Background: rgba(255,255,255,0.03)
├── Border: 1px solid rgba(255,255,255,0.08)
├── Border Radius: 12px
├── Padding: 16px
└── Display: flex / flex-direction column / gap 4px

Label:
├── Font: 11px / Weight 600 / Uppercase
├── Color: #636366
├── Letter Spacing: 0.5px
└── Margin Bottom: 4px

Value:
├── Font: 20px / Weight 700
├── Color: #F5F5F7
└── Font Family: SF Mono (for numbers)

Secondary Info:
├── Font: 13px / Weight 400
├── Color: #98989D
└── Display: flex / align-items center / gap 4px

Change Indicator:
├── Positive: Color #30D158 / Icon ↑
├── Negative: Color #FF453A / Icon ↓
└── Neutral: Color #98989D / Icon →

Variants:
├── Compact: Padding 12px / Value 17px
└── Inline: Flex direction row / Justify space-between
```

### Price Display (for entry fees, prizes)

```
Container:
├── Display: inline-flex / align-items baseline / gap 4px
└── Font Family: SF Mono

Amount:
├── Font: 24px / Weight 700
├── Color: #F5F5F7
└── Tabular Nums (for alignment)

Currency:
├── Font: 17px / Weight 600
├── Color: #98989D
└── Text Transform: uppercase

USD Equivalent:
├── Font: 13px / Weight 400
├── Color: #636366
├── Margin Left: 8px
└── Format: ($X.XX)

Sizes:
├── Large: Amount 32px / Currency 20px (Hero displays)
├── Regular: Amount 24px / Currency 17px (Cards)
├── Small: Amount 17px / Currency 13px (Lists)
└── Compact: Amount 15px / Currency 11px (Dense tables)
```

### Empty States

```
Container:
├── Padding: 64px 32px
├── Text Align: center
└── Max Width: 400px / margin auto

Icon:
├── Size: 64px
├── Color: #48484A
└── Margin Bottom: 24px

Title:
├── Font: 20px / Weight 600
├── Color: #F5F5F7
└── Margin Bottom: 8px

Description:
├── Font: 15px / Weight 400
├── Color: #98989D
└── Margin Bottom: 24px

Action:
└── Primary Button (CTA)
```

---

## Implementation Notes

### Shadcn/UI Integration

Most Shadcn components can be customized using these color variables in your `globals.css`:

```css
@layer base {
    :root {
        --background: 0 0% 0%;
        --foreground: 0 0% 96%;
        --card: 0 0% 11%;
        --card-foreground: 0 0% 96%;
        --popover: 0 0% 17%;
        --popover-foreground: 0 0% 96%;
        --primary: 211 100% 52%;
        --primary-foreground: 0 0% 100%;
        --secondary: 0 0% 17%;
        --secondary-foreground: 0 0% 96%;
        --muted: 0 0% 22%;
        --muted-foreground: 0 0% 60%;
        --accent: 0 0% 17%;
        --accent-foreground: 0 0% 96%;
        --destructive: 4 90% 60%;
        --destructive-foreground: 0 0% 100%;
        --border: 0 0% 22%;
        --input: 0 0% 22%;
        --ring: 211 100% 52%;
        --radius: 0.75rem;
    }
}
```

### CSS Custom Properties

Define these in your root for easy theme management:

```css
:root {
    /* Colors */
    --color-bg-primary: #000000;
    --color-bg-secondary: #0a0a0a;
    --color-bg-tertiary: #1c1c1e;
    --color-bg-quaternary: #2c2c2e;

    --color-text-primary: #f5f5f7;
    --color-text-secondary: #98989d;
    --color-text-tertiary: #636366;

    --color-accent: #0a84ff;
    --color-success: #30d158;
    --color-warning: #ff9f0a;
    --color-error: #ff453a;

    /* Spacing */
    --space-unit: 8px;
    --space-xxs: calc(var(--space-unit) * 0.5);
    --space-xs: var(--space-unit);
    --space-s: calc(var(--space-unit) * 1.5);
    --space-m: calc(var(--space-unit) * 2);
    --space-l: calc(var(--space-unit) * 3);
    --space-xl: calc(var(--space-unit) * 4);
    --space-xxl: calc(var(--space-unit) * 6);
    --space-xxxl: calc(var(--space-unit) * 8);

    /* Border Radius */
    --radius-xs: 6px;
    --radius-s: 8px;
    --radius-m: 12px;
    --radius-l: 16px;
    --radius-xl: 20px;
    --radius-xxl: 24px;
    --radius-pill: 9999px;
}
```

---

## File Structure

Recommended project organization:

```
src/
├── styles/
│   ├── globals.css (Tailwind + custom properties)
│   └── variables.css (CSS custom properties)
├── components/
│   ├── ui/ (Shadcn components - customized)
│   └── custom/ (Your custom components)
└── lib/
    └── utils.ts (Helper functions, cn() utility)
```

---

## Quick Reference: Do's and Don'ts

### DO:

✓ Use consistent spacing from the 8px scale
✓ Maintain minimum 44×44px touch targets
✓ Apply subtle hover states to all interactive elements
✓ Use semantic color variables, not hardcoded values
✓ Implement loading and empty states for all async content
✓ Provide focus indicators for keyboard navigation
✓ Use backdrop blur for overlays and floating nav
✓ Apply border radius consistently per element type
✓ Ensure sufficient color contrast (WCAG AA minimum)
✓ Test with reduced motion preferences

### DON'T:

✗ Use pure white (#FFFFFF) for body text (use #F5F5F7)
✗ Exceed 3 levels of visual hierarchy on one screen
✗ Animate elements longer than 0.4s without reason
✗ Use red for anything other than errors/destructive actions
✗ Create custom components when Shadcn has a solution
✗ Forget hover states on interactive elements
✗ Use borders when shadows/backgrounds can separate
✗ Make buttons smaller than 44×44px
✗ Hardcode colors - always use CSS variables
✗ Use Comic Sans 😄

---

**Version History:**

-   v1.0 - November 2025 - Initial styleguide creation

**Questions or clarifications? Please provide feedback to refine this guide!**
