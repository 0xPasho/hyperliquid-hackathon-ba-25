# Project Detail Page - OpenSea Design System (CORRECTED)

## Overview
This document defines the EXACT spacing, typography, and design patterns used for the project detail page, matching OpenSea's ACTUAL aesthetic after deep analysis.

## KEY PRINCIPLE: EXTREME MINIMALISM
OpenSea's design is characterized by:
- Ultra-flat design (no depth, no shadows)
- Barely visible borders (very low contrast)
- NO decorative containers or boxes
- Maximum use of whitespace
- Subtle, minimal interactions

## Color Palette (CORRECTED)

### Backgrounds
- `bg-background`: #0A0A0A (Main background - almost black)
- `bg-card`: #0F0F0F (Card/Panel background - barely lighter)
- `bg-muted`: #1A1A1A (Subtle hover states)

### Borders (ULTRA SUBTLE)
- `border-border`: #1A1A1A (Default borders - barely visible)
- `border-hover`: #252525 (Hover borders - slightly visible)

### Text (LOW CONTRAST)
- `text-foreground`: #E5E5E5 (Primary text - not pure white)
- `text-muted-foreground`: #8B8B8B (Secondary text - gray)
- `text-subtle`: #6B6B6B (Very subtle text)

## Spacing System

### Base Unit: 4px
All spacing follows a 4px grid system.

### Common Spacing Values
- `xs`: 4px (0.25rem)
- `sm`: 8px (0.5rem)
- `md`: 12px (0.75rem)
- `lg`: 16px (1rem)
- `xl`: 20px (1.25rem)
- `2xl`: 24px (1.5rem)
- `3xl`: 32px (2rem)
- `4xl`: 48px (3rem)

## Typography

### Tab Labels
- Font Size: 16px (1rem)
- Font Weight: 600 (Semibold)
- Line Height: 24px (1.5rem)
- Letter Spacing: -0.01em
- Color: text-muted-foreground (inactive), text-foreground (active)

### Accordion Triggers
- Font Size: 18px (1.125rem)
- Font Weight: 600 (Semibold)
- Line Height: 28px (1.75rem)
- Color: text-foreground

### Body Text
- Font Size: 14px (0.875rem)
- Font Weight: 400 (Regular)
- Line Height: 20px (1.25rem)
- Color: text-muted-foreground

### Small Text / Labels
- Font Size: 12px (0.75rem)
- Font Weight: 500 (Medium)
- Line Height: 16px (1rem)
- Color: text-muted-foreground
- Text Transform: Uppercase
- Letter Spacing: 0.05em

## Component Specifications (CORRECTED)

### Tab System (ULTRA MINIMAL)

#### Tab Container
```
- Border Bottom: 1px solid #1A1A1A (barely visible)
- Background: transparent
- NO padding, NO margin
- Width: 100%
```

#### Tab List
```
- Display: flex
- Gap: 40px (2.5rem) - MORE spacing between tabs
- Padding: 0
- Height: auto
- NO background
- NO border on container itself
```

#### Tab Trigger (PLAIN TEXT STYLE)
```
- Padding: 0px 0px 16px 0px (ONLY bottom padding)
- NO horizontal padding
- NO background
- NO border by default
- Font Size: 15px (slightly smaller)
- Font Weight: 400 (regular for inactive)
- Font Weight: 600 (semibold for active)
- Color: #8B8B8B (inactive)
- Color: #E5E5E5 (active)
- Border Bottom: 2px solid transparent (inactive)
- Border Bottom: 2px solid #E5E5E5 (active)
- Transition: all 150ms ease
- NO hover background
- Hover: color slightly lighter
```

#### Tab Content
```
- Padding Top: 16px (MINIMAL spacing, not 24px)
- NO animation
- Simple display swap
```

### Accordion System (FLAT & MINIMAL)

#### Accordion Container
```
- Display: flex
- Flex Direction: column
- Gap: 12px (0.75rem) - SMALLER gap
```

#### Accordion Item (BARELY VISIBLE BORDERS)
```
- Background: #0F0F0F (barely lighter than background)
- Border: 1px solid #1A1A1A (almost invisible)
- Border Radius: 8px (LESS rounded, more subtle)
- NO shadow
- NO depth effects
- Transition: border-color 150ms ease
- Hover: border-color -> #252525 (barely noticeable)
```

#### Accordion Trigger (NO DECORATIONS)
```
- Padding: 20px 24px (slightly less vertical)
- Display: flex
- Align Items: center
- Justify Content: space-between
- Width: 100%
- Background: transparent
- NO hover background change
- Font Size: 18px
- Font Weight: 600
- Color: #E5E5E5
```

#### Accordion Trigger Icon Layout (NO CONTAINERS)
```
- Icon directly next to text
- NO background box
- NO container
- Icon size: 18px (smaller)
- Icon color: #E5E5E5 (same as text)
- Gap between icon and text: 12px
- Icon is simple, outline style
```

#### Accordion Chevron
```
- Size: 16px (SMALLER)
- Color: #6B6B6B (very subtle)
- Stroke width: 2px
- Transition: transform 200ms ease
- Transform: rotate(180deg) when open
- NO color change on hover
```

#### Accordion Content
```
- Padding: 0px 24px 20px 24px (less bottom padding)
- NO top padding (flows from trigger)
- NO background change
- Font Size: 14px
- Line Height: 1.6
- Color: #8B8B8B (muted)
```

### Icon Specifications

#### Icon Sizes
- Small: 16px (1rem) - Used in small buttons, inline text
- Medium: 20px (1.25rem) - Used in accordion triggers
- Large: 24px (1.5rem) - Used in empty states, headers

#### Icon Colors
- Default: text-muted-foreground (#A3A3A3)
- Active/Hover: text-foreground (#FFFFFF)

### Content Sections

#### Section Spacing
```
- Margin Top between major sections: 24px (1.5rem)
- Margin Bottom: 0 (use margin-top for consistency)
```

#### Card Grid (More from Creator)
```
- Grid Columns: 1 (mobile), 2 (tablet), 3 (desktop)
- Gap: 16px (1rem)
- Card Border Radius: 12px (0.75rem)
- Card Padding: 0 (image fills to edge, text has internal padding)
```

#### Card Internal Content
```
- Image Aspect Ratio: 16:9 or 4:3
- Text Padding: 12px (0.75rem)
- Title Font Size: 14px (0.875rem)
- Title Font Weight: 600
- Description Font Size: 12px (0.75rem)
- Description Color: text-muted-foreground
```

## Layout Structure

### Main Container
```
- Max Width: 800px (for right panel content)
- Padding: 0px 24px (mobile), 0px 32px (tablet+)
```

### Content Flow
1. Title Section (no top border)
2. Action Buttons (margin-top: 24px)
3. Tabs Section (margin-top: 24px, has border-top)
4. Tab Content (padding-top: 24px from tabs)
5. Comments Section (margin-top: 24px, has border-top)

## Interaction States

### Hover States
- Tabs: Color changes to text-foreground
- Accordion Triggers: Background -> bg-muted/50
- Cards: Border -> border-accent
- Buttons: Opacity 90% or darker shade

### Active States
- Tab: Bottom border visible, color text-foreground
- Accordion: Chevron rotated 180deg

### Focus States
- Ring: 2px solid blue-500
- Ring Offset: 2px
- Outline: none

## Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile Adjustments
- Padding: 16px instead of 24px
- Tab Gap: 24px instead of 32px
- Font Sizes: Reduce by 1-2px for body text
- Grid: 1 column

### Tablet Adjustments
- Padding: 20px
- Grid: 2 columns
- Maintain desktop font sizes

## Animation Timing

### Standard Transitions
- Duration: 200ms
- Easing: ease or cubic-bezier(0.4, 0, 0.2, 1)

### Accordion Expand/Collapse
- Duration: 300ms
- Easing: cubic-bezier(0.4, 0, 0.2, 1)

### Hover Effects
- Duration: 150ms
- Easing: ease

## Implementation Notes

### Shadcn Components to Use
1. `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
2. `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`
3. `Card` (for project cards in "More from creator")
4. `Button` (for action buttons)
5. `Badge` (for metadata pills)

### Custom Styling Required
- Override default Shadcn spacing to match exact values
- Customize accordion item styling (no separation lines between items in closed state)
- Custom tab underline animation
- Proper icon sizing and spacing

### Key Differences from Default Shadcn
- Accordion items have 16px gap (not flush)
- Tabs use bottom border, not background fill
- More generous padding throughout
- Darker background colors
- Monospace feel for certain numeric displays
