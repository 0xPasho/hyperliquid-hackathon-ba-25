# App Store-Style Landing Page Implementation Guide

## 📋 Table of Contents
1. [Visual Analysis](#visual-analysis)
2. [Component Architecture](#component-architecture)
3. [Header Implementation](#header-implementation)
4. [Hero Carousel Implementation](#hero-carousel-implementation)
5. [Section Layouts](#section-layouts)
6. [Game Card Components](#game-card-components)
7. [Styling Specifications](#styling-specifications)
8. [Animation & Interactions](#animation--interactions)
9. [Implementation Steps](#implementation-steps)

---

## 🎨 Visual Analysis

### Overall Theme
- **Background**: Deep dark gradient (`#0a0a0a` to `#141414`)
- **Primary Text**: White (`#ffffff`)
- **Secondary Text**: Gray-400 (`#9ca3af`)
- **Accent Color**: Bright Blue (`#007aff` - iOS blue)
- **Card Background**: Dark with subtle transparency (`rgba(28, 28, 30, 0.7)`)
- **Blur Effects**: Backdrop blur for glassmorphism (`backdrop-blur-xl`)

### Typography Scale
- **Hero Title**: 72px, Bold (font-weight: 700)
- **Section Titles**: 32px, Bold
- **Game Titles**: 17px, Semibold (font-weight: 600)
- **Subtitles**: 15px, Regular (font-weight: 400)
- **Labels**: 13px, Medium (font-weight: 500)

### Spacing System
- **Section Vertical Spacing**: 80px between sections
- **Card Gaps**: 20px horizontal, 24px vertical
- **Container Padding**: 80px on desktop, 24px on mobile
- **Card Internal Padding**: 20px

---

## 🏗️ Component Architecture

```
LandingPage
├── LandingHeader (sticky)
├── HeroCarousel (full-width, hover arrows)
├── GameSection[] (repeating sections)
│   ├── SectionHeader
│   └── GameRow (horizontal scroll)
│       └── GameCard[]
├── RankingSection (numbered cards)
│   └── RankingCard[]
└── LandingFooter
```

### File Structure
```
src/modules/landing/
├── screens/
│   └── LandingScreen.tsx
├── components/
│   ├── LandingHeader.tsx
│   ├── HeroCarousel.tsx
│   ├── GameSection.tsx
│   ├── GameCard.tsx
│   ├── GameRow.tsx
│   ├── RankingSection.tsx
│   └── RankingCard.tsx
└── hooks/
    └── useHoverArrows.ts
```

---

## 🎯 Header Implementation

### Visual Specifications

**Height**: 52px (consistent with App Store)
**Background**:
- Base: `rgba(0, 0, 0, 0.8)`
- Backdrop blur: `blur(20px)`
- Border bottom: `1px solid rgba(255, 255, 255, 0.1)`

**Layout**:
```
┌────────────────────────────────────────────────────┐
│  [Logo]    [Nav Items]         [Search]  [Profile] │
└────────────────────────────────────────────────────┘
```

### Component Code

```tsx
// src/modules/landing/components/LandingHeader.tsx
"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 h-[52px] bg-black/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-[1440px] mx-auto h-full px-8 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <a href="/" className="text-xl font-semibold tracking-tight">
            Degu.Games
          </a>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#games" className="text-sm text-gray-300 hover:text-white transition-colors">
              Games
            </a>
            <a href="#trending" className="text-sm text-gray-300 hover:text-white transition-colors">
              Trending
            </a>
            <a href="#indie" className="text-sm text-gray-300 hover:text-white transition-colors">
              Indie
            </a>
            <a href="#free" className="text-sm text-gray-300 hover:text-white transition-colors">
              Free
            </a>
          </nav>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search games..."
              className="pl-10 w-[240px] h-9 bg-white/5 border-white/10 text-sm focus:bg-white/10 focus:border-white/20"
            />
          </div>

          {/* Profile/Login */}
          <Button variant="ghost" size="sm" className="text-sm">
            Sign In
          </Button>
        </div>
      </div>
    </header>
  );
}
```

### Styling Details

**Sticky Behavior**:
```css
.landing-header {
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
```

**Smooth Scroll Offset** (for anchor links):
```css
html {
  scroll-padding-top: 52px; /* Header height */
}
```

---

## 🎪 Hero Carousel Implementation

### Visual Specifications

**Dimensions**:
- Height: 600px on desktop, 500px on tablet, 400px on mobile
- Width: 100% with max-width 1280px centered
- Border Radius: 24px
- Margin: 24px horizontal on desktop

**Hover State**:
- Left/Right arrows appear on hover with fade-in animation
- Arrow buttons: 44x44px, semi-transparent background
- Arrow position: 40px from edges

**Slide Content Layout**:
```
┌─────────────────────────────────────────────┐
│                                             │
│   Background Image (full)                   │
│                                             │
│   ┌─────────────────────────────┐           │
│   │  [Label]                    │           │
│   │  [Title - Large]            │           │
│   │  [Subtitle]                 │           │
│   │                             │           │
│   │  [Icon] [Game Title]        │           │
│   │         [Description]       │           │
│   │         [View Button]       │           │
│   └─────────────────────────────┘           │
│                                             │
└─────────────────────────────────────────────┘
```

### Component Implementation

```tsx
// src/modules/landing/components/HeroCarousel.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSlide {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  backgroundImage: string;
  gameIcon: string;
  gameName: string;
  gameDescription: string;
  ctaText: string;
  ctaLink: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: "clusterduck",
    label: "NOW AVAILABLE",
    title: "Clusterduck",
    subtitle: "Clone your favorite quackers",
    backgroundImage: "/hero/clusterduck-bg.jpg",
    gameIcon: "/games/clusterduck-icon.png",
    gameName: "Clusterduck",
    gameDescription: "Breed weird and wacky ducks",
    ctaText: "View",
    ctaLink: "/games/clusterduck",
  },
  // Add more slides...
];

export function HeroCarousel() {
  const [isHovered, setIsHovered] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      duration: 30, // Smooth transition (30ms)
    },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <section className="relative w-full px-6 py-12">
      <div
        className="relative max-w-[1280px] mx-auto rounded-3xl overflow-hidden group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Embla Container */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {HERO_SLIDES.map((slide) => (
              <div
                key={slide.id}
                className="flex-[0_0_100%] min-w-0 relative h-[600px]"
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${slide.backgroundImage})` }}
                >
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>

                {/* Content Overlay */}
                <div className="relative h-full flex flex-col justify-end p-16">
                  {/* Label */}
                  <div className="text-sm font-medium text-gray-300 tracking-wider mb-2">
                    {slide.label}
                  </div>

                  {/* Title */}
                  <h2 className="text-7xl font-bold mb-4 tracking-tight">
                    {slide.title}
                  </h2>

                  {/* Subtitle */}
                  <p className="text-xl text-gray-300 mb-12">
                    {slide.subtitle}
                  </p>

                  {/* Game Info Card */}
                  <div className="flex items-center gap-5 max-w-md">
                    {/* Game Icon */}
                    <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 shadow-2xl">
                      <img
                        src={slide.gameIcon}
                        alt={slide.gameName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">
                        {slide.gameName}
                      </h3>
                      <p className="text-sm text-gray-400 mb-3">
                        {slide.gameDescription}
                      </p>
                      <Button
                        className="bg-[#007aff] hover:bg-[#0051d5] text-white rounded-full px-6 h-9 text-sm font-medium"
                        asChild
                      >
                        <a href={slide.ctaLink}>{slide.ctaText}</a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows - Appear on Hover */}
        <button
          onClick={scrollPrev}
          className={`
            absolute left-10 top-1/2 -translate-y-1/2 z-10
            w-11 h-11 rounded-full bg-black/40 backdrop-blur-md
            flex items-center justify-center
            border border-white/10
            transition-all duration-300
            hover:bg-black/60 hover:scale-110
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `}
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={scrollNext}
          className={`
            absolute right-10 top-1/2 -translate-y-1/2 z-10
            w-11 h-11 rounded-full bg-black/40 backdrop-blur-md
            flex items-center justify-center
            border border-white/10
            transition-all duration-300
            hover:bg-black/60 hover:scale-110
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `}
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}
```

### Autoplay Configuration

```typescript
Autoplay({
  delay: 5000,              // 5 seconds per slide
  stopOnInteraction: false, // Continue after user interaction
  stopOnMouseEnter: true,   // Pause on hover
  stopOnFocusIn: true       // Pause on focus
})
```

---

## 📦 Section Layouts

### Section Header Component

**Visual Specs**:
- Section title: 32px, bold
- Subtitle: 15px, gray-400
- Right arrow (›): 28px, appears on hover
- Margin bottom: 24px

```tsx
// src/modules/landing/components/SectionHeader.tsx
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
}

export function SectionHeader({ title, subtitle, href }: SectionHeaderProps) {
  const content = (
    <div className="group cursor-pointer">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-[32px] font-bold tracking-tight">
          {title}
        </h2>
        {href && (
          <ChevronRight className="w-7 h-7 text-gray-400 transition-transform group-hover:translate-x-1" />
        )}
      </div>
      {subtitle && (
        <p className="text-[15px] text-gray-400">
          {subtitle}
        </p>
      )}
    </div>
  );

  if (href) {
    return <a href={href}>{content}</a>;
  }

  return content;
}
```

### Game Row (Horizontal Scroll)

**Visual Specs**:
- Horizontal scroll with no scrollbar visible
- Snap to items on scroll
- Peek effect: Shows partial next/previous cards
- Gap: 20px between cards

```tsx
// src/modules/landing/components/GameRow.tsx
"use client";

import { useRef } from "react";
import { GameCard } from "./GameCard";

interface Game {
  id: string;
  icon: string;
  name: string;
  description: string;
  ctaText?: string;
  ctaLink: string;
}

interface GameRowProps {
  games: Game[];
}

export function GameRow({ games }: GameRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="
          flex gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory
          pb-4 -mb-4 px-8 -mx-8
          scroll-smooth
        "
      >
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      {/* Custom CSS for smooth scroll */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
```

---

## 🎮 Game Card Components

### Standard Game Card

**Visual Specs**:
- Width: 340px
- Aspect ratio varies by section
- Background: `rgba(28, 28, 30, 0.7)` with backdrop blur
- Border: 1px solid `rgba(255, 255, 255, 0.1)`
- Border radius: 16px
- Padding: 20px
- Hover: Scale 1.02, border brightens to `rgba(255, 255, 255, 0.2)`

```tsx
// src/modules/landing/components/GameCard.tsx
"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface GameCardProps {
  game: {
    id: string;
    icon: string;
    name: string;
    description: string;
    ctaText?: string;
    ctaLink: string;
  };
}

export function GameCard({ game }: GameCardProps) {
  return (
    <motion.div
      className="
        flex-shrink-0 w-[340px] snap-start
        bg-[#1c1c1e]/70 backdrop-blur-xl
        border border-white/10
        rounded-2xl p-5
        transition-all duration-300
        hover:scale-[1.02] hover:border-white/20
      "
      whileHover={{ y: -4 }}
    >
      <div className="flex items-center gap-5">
        {/* Game Icon */}
        <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg">
          <img
            src={game.icon}
            alt={game.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[17px] font-semibold mb-1 truncate">
            {game.name}
          </h3>
          <p className="text-[15px] text-gray-400 line-clamp-2 mb-3">
            {game.description}
          </p>
          <Button
            className="
              bg-transparent hover:bg-white/5
              text-[#007aff] border-0
              rounded-full px-6 h-8 text-[13px] font-medium
              transition-all
            "
            asChild
          >
            <a href={game.ctaLink}>
              {game.ctaText || "View"}
            </a>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
```

### Ranking Card (Top Games)

**Visual Specs**:
- Width: 280px
- Height: 320px
- Large rank number: 48px, positioned top-left
- Centered game icon: 120x120px
- Background: Darker than standard cards

```tsx
// src/modules/landing/components/RankingCard.tsx
export function RankingCard({ rank, game }: RankingCardProps) {
  return (
    <div className="
      w-[280px] h-[320px] flex-shrink-0 snap-start
      bg-[#1c1c1e] backdrop-blur-xl
      border border-white/10
      rounded-3xl p-6
      relative overflow-hidden
      transition-all duration-300
      hover:scale-[1.02] hover:border-white/20
    ">
      {/* Rank Number */}
      <div className="absolute top-6 left-6 text-5xl font-bold text-white/10">
        {rank}
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center gap-4">
        {/* Game Icon */}
        <div className="w-[120px] h-[120px] rounded-[28px] overflow-hidden shadow-2xl">
          <img
            src={game.icon}
            alt={game.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-1">
            {game.name}
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            {game.category}
          </p>
          <Button
            className="bg-transparent hover:bg-white/5 text-[#007aff] text-sm"
            asChild
          >
            <a href={game.link}>View</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎨 Styling Specifications

### Color Palette (CSS Variables)

```css
/* globals.css - Add to existing theme */
:root {
  /* App Store Theme Colors */
  --appstore-bg-primary: #0a0a0a;
  --appstore-bg-secondary: #141414;
  --appstore-card-bg: rgba(28, 28, 30, 0.7);
  --appstore-border: rgba(255, 255, 255, 0.1);
  --appstore-border-hover: rgba(255, 255, 255, 0.2);
  --appstore-text-primary: #ffffff;
  --appstore-text-secondary: #9ca3af;
  --appstore-accent: #007aff;
  --appstore-accent-hover: #0051d5;
}
```

### Glassmorphism Effect

```css
.glassmorphism {
  background: rgba(28, 28, 30, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Tailwind Extensions

```typescript
// tailwind.config.ts - Add to existing config
export default {
  theme: {
    extend: {
      colors: {
        appstore: {
          'bg-primary': '#0a0a0a',
          'bg-secondary': '#141414',
          'card-bg': 'rgba(28, 28, 30, 0.7)',
          'border': 'rgba(255, 255, 255, 0.1)',
          'border-hover': 'rgba(255, 255, 255, 0.2)',
          'text-primary': '#ffffff',
          'text-secondary': '#9ca3af',
          'accent': '#007aff',
          'accent-hover': '#0051d5',
        },
      },
      backdropBlur: {
        'appstore': '20px',
      },
      borderRadius: {
        'appstore-card': '16px',
        'appstore-large': '24px',
      },
    },
  },
}
```

---

## ✨ Animation & Interactions

### Hover Animations

**Card Hover Effect**:
```tsx
// Using Framer Motion
<motion.div
  whileHover={{
    scale: 1.02,
    y: -4,
  }}
  transition={{
    type: "spring",
    stiffness: 300,
    damping: 20
  }}
>
  {/* Card content */}
</motion.div>
```

**Arrow Fade-In on Carousel Hover**:
```tsx
const [isHovered, setIsHovered] = useState(false);

<div
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
>
  <button
    className={`
      transition-opacity duration-300
      ${isHovered ? 'opacity-100' : 'opacity-0'}
    `}
  >
    <ChevronLeft />
  </button>
</div>
```

### Scroll Animations

**Fade-in on Scroll** (using Intersection Observer):
```tsx
// src/modules/landing/hooks/useFadeInOnScroll.ts
import { useEffect, useRef, useState } from "react";

export function useFadeInOnScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

// Usage
const { ref, isVisible } = useFadeInOnScroll();

<div
  ref={ref}
  className={`
    transition-all duration-700
    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
  `}
>
  {/* Section content */}
</div>
```

### Smooth Horizontal Scroll

```tsx
// Smooth scroll with momentum
<div
  className="overflow-x-auto scroll-smooth"
  style={{
    scrollBehavior: 'smooth',
    WebkitOverflowScrolling: 'touch',
  }}
>
  {/* Cards */}
</div>
```

---

## 🚀 Implementation Steps

### Step 1: Create Module Structure

```bash
mkdir -p src/modules/landing/{screens,components,hooks}
touch src/modules/landing/screens/LandingScreen.tsx
touch src/modules/landing/components/{LandingHeader,HeroCarousel,SectionHeader,GameRow,GameCard,RankingSection,RankingCard}.tsx
touch src/modules/landing/hooks/{useFadeInOnScroll,useHoverArrows}.ts
```

### Step 2: Install Dependencies (if needed)

```bash
# Framer Motion for advanced animations
npm install framer-motion

# Already have Embla Carousel installed ✓
```

### Step 3: Update Global Styles

Add App Store theme variables to `globals.css`:
```css
@layer base {
  :root {
    --appstore-bg-primary: #0a0a0a;
    --appstore-bg-secondary: #141414;
    --appstore-card-bg: rgba(28, 28, 30, 0.7);
    --appstore-border: rgba(255, 255, 255, 0.1);
    --appstore-border-hover: rgba(255, 255, 255, 0.2);
    --appstore-accent: #007aff;
    --appstore-accent-hover: #0051d5;
  }
}

/* Smooth scroll behavior */
html {
  scroll-behavior: smooth;
  scroll-padding-top: 52px;
}

/* Hide scrollbars but keep functionality */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

### Step 4: Create Components (In Order)

1. **LandingHeader** - Sticky header with navigation
2. **HeroCarousel** - Hero carousel with hover arrows
3. **SectionHeader** - Reusable section titles
4. **GameCard** - Standard game card
5. **GameRow** - Horizontal scrolling row
6. **RankingCard** - Numbered ranking cards
7. **RankingSection** - Top games section

### Step 5: Create Main Landing Screen

```tsx
// src/modules/landing/screens/LandingScreen.tsx
import { LandingHeader } from "../components/LandingHeader";
import { HeroCarousel } from "../components/HeroCarousel";
import { GameSection } from "../components/GameSection";
import { RankingSection } from "../components/RankingSection";

export function LandingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#141414]">
      <LandingHeader />

      <main className="pb-24">
        <HeroCarousel />

        <div className="max-w-[1440px] mx-auto px-8 space-y-20">
          <GameSection
            title="What We're Playing"
            subtitle="These favorites are always a great choice"
            games={whatWerePlayingGames}
          />

          <GameSection
            title="Must-Play Games"
            subtitle="Evolving worlds filled with exciting events"
            games={mustPlayGames}
          />

          <RankingSection
            title="Top Played Games"
            games={topPlayedGames}
          />

          <GameSection
            title="Our Favorite Indie Games"
            subtitle="Creative, innovative, and unforgettable"
            games={indieGames}
          />
        </div>
      </main>
    </div>
  );
}
```

### Step 6: Create New Landing Page Route

```tsx
// src/app/landing/page.tsx
import { LandingScreen } from "@/modules/landing/screens/LandingScreen";

export default function LandingPage() {
  return <LandingScreen />;
}
```

### Step 7: Responsive Breakpoints

```typescript
// Tailwind breakpoints used throughout
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1440px' // Max content width
}

// Usage in components:
className="
  px-6 sm:px-8 lg:px-12 xl:px-16
  text-4xl sm:text-5xl lg:text-7xl
  h-[400px] sm:h-[500px] lg:h-[600px]
"
```

### Step 8: Testing Checklist

- [ ] Header stays sticky on scroll
- [ ] Hero carousel auto-plays with 5s interval
- [ ] Arrows appear/disappear on hero hover
- [ ] Cards scale up on hover
- [ ] Horizontal rows scroll smoothly
- [ ] Ranking cards display correctly
- [ ] Responsive on mobile, tablet, desktop
- [ ] Dark theme colors match App Store
- [ ] All links work correctly
- [ ] Images load properly with fallbacks

---

## 📱 Responsive Behavior

### Mobile (< 640px)
- Header: Hamburger menu, full-width search
- Hero: 400px height, simplified layout
- Cards: Stack vertically, full-width
- Horizontal scroll: Enabled with touch
- Font sizes: Reduced by ~30%

### Tablet (640px - 1024px)
- Header: Partial navigation visible
- Hero: 500px height
- Cards: 2-3 visible in row
- Font sizes: Reduced by ~15%

### Desktop (> 1024px)
- Header: Full navigation
- Hero: 600px height
- Cards: 3-4 visible in row
- Full hover effects enabled

---

## 🎯 Key Features to Match App Store

✅ **Sticky Header** - Blurred background, stays on top
✅ **Hero Carousel** - Auto-play with hover arrows
✅ **Horizontal Scroll Rows** - Smooth, no visible scrollbar
✅ **Glassmorphism Cards** - Backdrop blur, subtle borders
✅ **Hover Effects** - Scale, border glow, arrow animations
✅ **Dark Theme** - Deep blacks with subtle gradients
✅ **Typography Scale** - iOS-style font sizing
✅ **Ranking Display** - Large numbers, centered icons
✅ **Section Headers** - Bold titles with chevron
✅ **CTA Buttons** - iOS blue (#007aff) accent
✅ **Responsive Design** - Mobile-first approach

---

## 📝 Notes

- **Embla Carousel** is already installed and working in the codebase
- **Shadcn UI components** provide the base for buttons, inputs, etc.
- **Tailwind CSS v4** is configured and ready to use
- **Dark theme** is already established in the design system
- **Framer Motion** is optional but recommended for smooth animations

---

## 🔗 References

- Embla Carousel Docs: https://www.embla-carousel.com/
- Tailwind CSS Docs: https://tailwindcss.com/docs
- Framer Motion Docs: https://www.framer.com/motion/
- Shadcn UI: https://ui.shadcn.com/

---

**Implementation Priority**:
1. Header (core navigation)
2. Hero Carousel (main visual)
3. Game Cards & Rows (content display)
4. Ranking Section (unique layout)
5. Animations & Polish (final touches)
