# Degu.Games - Strategic Redesign Implementation Plan

> **Platform Goal**: Transform Degu.Games into a premium betting games platform that combines Apple's design excellence, OpenSea's professional data presentation, and Pump.fun's energetic user experience.

> **Design Philosophy**: Professional trading aesthetics meets gamified betting - clean, data-driven, and premium dark UI.

---

## Overview

This plan provides detailed instructions for redesigning Degu.Games without including actual code. It's designed to be used by AI agents to understand what needs to be built and how it should look and behave. Always reference the STYLEGUIDE.md for exact specifications.

---

## Phase 1: Foundation & Theme Setup

### 1.1 Color System Implementation

**What to do**: Set up the complete color palette as CSS custom properties and configure Tailwind.

**Background colors needed**:

-   Four layers of black backgrounds for depth (pure black, then progressively lighter)
-   This creates elevation without heavy shadows

**Text colors needed**:

-   Three levels: primary for main content, secondary for descriptions, tertiary for metadata
-   Never use pure white for body text

**Accent colors needed**:

-   Blue for primary actions
-   Green for profits and positive states
-   Red for losses and destructive actions
-   Yellow for pending/waiting states
-   Purple for premium features
-   Separate crypto chart colors (teal green for up, coral red for down)

**How it should work**:

-   All colors should be defined as CSS variables
-   Tailwind should be configured to use these variables
-   Color values should use HSL format for better manipulation
-   Create semantic color names (not just color names like "blue-500")

### 1.2 Typography Setup

**What to do**: Establish font stacks, sizes, and usage rules.

**Font families needed**:

-   System font stack for UI (starting with -apple-system, SF Pro Display)
-   Monospace font stack for numbers (SF Mono, Monaco, Consolas)

**Font sizes needed**:

-   Display sizes (56px down to 32px) for heroes and major headlines
-   Heading sizes (28px down to 16px) for page structure
-   Body sizes (17px, 15px, 13px, 11px) for content

**Font weights needed**:

-   Regular (400) for body text
-   Semibold (600) for labels and emphasis
-   Bold (700) for headlines and numbers

**Special rules**:

-   All numbers must use tabular numerals (for alignment in tables)
-   Display sizes need negative letter-spacing
-   Uppercase text needs increased letter-spacing
-   Monospace fonts should be used for all monetary values and wallet addresses

### 1.3 Spacing System

**What to do**: Define consistent spacing scale based on 8px units.

**Spacing values**: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px

**Container widths**:

-   Maximum: 1440px
-   Standard content: 1200px
-   Narrow (forms): 800px

**Grid system**:

-   Desktop: 12 columns, 24px gaps
-   Tablet: 8 columns, 20px gaps
-   Mobile: 4 columns, 16px gaps

**Padding**:

-   Desktop: 48px sides
-   Tablet: 32px sides
-   Mobile: 16px sides

### 1.4 Border Radius Standards

**What to do**: Define corner rounding for all UI elements.

**Sizes needed**:

-   6px: Badges, pills
-   8px: Buttons, inputs
-   12px: Cards, dropdowns
-   16px: Large cards
-   20px: Section containers
-   24px: Hero elements
-   Pill (9999px): Tags, status indicators

---

## Phase 2: Component Customization

### 2.1 Button System

**What to do**: Create button variants with proper states and feedback.

**Primary button**:

-   Blue background, white text
-   44px height minimum
-   12px border radius
-   15px font, semibold
-   Hover: lighter blue
-   Active: darker blue + scale down to 98%
-   Disabled: gray with reduced opacity

**Secondary button** (Outline):

-   Transparent with border
-   Same dimensions
-   Hover: subtle white background overlay

**Ghost button**:

-   No background or border
-   Blue text
-   Hover: blue background overlay

**Button sizes**:

-   Large: 50px height
-   Regular: 44px height
-   Small: 36px height

**Icon buttons**:

-   Square dimensions
-   Centered icon
-   Same states as text buttons

### 2.2 Card Components

**What to do**: Create elevated surface cards with interaction states.

**Standard card**:

-   Tertiary background level
-   Subtle border (white at 5% opacity)
-   16px border radius
-   Hover: border brighter + translate up 2px
-   Active: scale down slightly
-   Smooth transitions (200ms)

**Card sections**:

-   Header: padding, optional bottom border
-   Content: padding, no borders
-   Footer: padding, optional top border

**Featured card**:

-   Larger radius (24px)
-   Can use gradient backgrounds
-   Stronger shadow

### 2.3 Input Fields

**What to do**: Create accessible, clear input components.

**Text input**:

-   Tertiary background
-   44px height
-   10px border radius
-   15px font
-   Invisible border that appears on focus
-   Focus: blue border + lighter background
-   Error: red border
-   Success: green border

**Search input**:

-   Icon positioned inside on left
-   Extra left padding for icon
-   Icon brightens on focus

**Labels**:

-   13px semibold
-   Secondary text color
-   8px below label

### 2.4 Badge & Tag System

**What to do**: Create visual indicators for status and categories.

**Default badge**:

-   Quaternary background
-   11px uppercase font, semibold
-   Small padding
-   6px radius

**Status badges**:

-   Success: green background, black text
-   Warning: yellow background, black text
-   Error: red background, white text
-   Premium: gradient background, white text

**Tags**:

-   Pill-shaped
-   White overlay background
-   Hover: brighter background
-   Selected: blue background

---

## Phase 3: Layout Architecture

### 3.1 Sidebar Navigation

**What to do**: Build fixed left sidebar like Apple App Store.

**Structure**:

-   Fixed to left edge
-   260px width
-   Pure black background
-   Right border

**Sections from top to bottom**:

1. **Logo area**: 64px height, logo + home link
2. **Main navigation**: List of nav items with icons
3. **Create button**: Full-width CTA
4. **Category section**: Secondary navigation
5. **User profile**: Fixed at bottom

**Navigation items**:

-   Icon + text layout
-   10px rounded corners
-   Active: tertiary background
-   Hover: subtle overlay

**User profile section**:

-   Avatar + name + wallet address
-   Truncated wallet address
-   Hover effect

### 3.2 Top Navigation Bar

**What to do**: Create sticky top bar with search and actions.

**Layout**:

-   64px height
-   Sticky positioning
-   Starts transparent
-   On scroll: dark background with blur + border

**Contents**:

-   Search bar (left, grows to fill space)
-   Wallet button (shows balance)
-   Notification button (with dot indicator)
-   User menu button (with avatar)

### 3.3 Main Content Area

**What to do**: Content container with proper spacing.

**Layout**:

-   Left margin: 260px (sidebar width)
-   Padding: 24px all sides
-   Pure black background
-   Minimum full viewport height

**Section spacing**:

-   48px between major sections
-   Each section needs clear separation

---

## Phase 4: Page Structures

### 4.1 Home Page

**What to do**: Create engaging landing with multiple sections.

**Hero section**:

-   Full-width, 500px height
-   Gradient + pattern background
-   Left-aligned content
-   Eyebrow badge + headline + subheadline + buttons

**Featured games section**:

-   Section header with "View All" link
-   3-column grid of game cards
-   Responsive to 2 columns (tablet) and 1 column (mobile)

**Trending section**:

-   Similar to featured
-   Icon in header for distinction
-   4-column grid

**Stats banner**:

-   Full-width card
-   Gradient background
-   3-column stats grid
-   Large numbers with labels

### 4.2 Game Detail Page

**What to do**: All game info in one comprehensive view.

**Layout**: Two columns

-   Left (flexible): Game preview and info
-   Right (400px fixed): Action panel

**Game preview**:

-   16:9 aspect ratio
-   Video thumbnail or screenshot
-   Play button overlay
-   Hover: darkens with enlarged play button

**Game info**:

-   Large title (32px)
-   Creator line with badge
-   Description paragraph
-   Stats row (plays, favorites, date)

**Action panel (right)**:

-   Entry fee (large display)
-   Prize pool (highlighted in green)
-   Game status (active rooms, players)
-   Action buttons (play, edit)

**Below**: Tabs for Details, Leaderboard, Activity

**Game lobbies section**:

-   List of active rooms
-   Each shows entry, prize, host, players
-   Join button

### 4.3 Browse/Explore Page

**What to do**: Filterable game directory.

**Layout**: Sidebar + content

**Filter sidebar (left, 240px)**:

-   Game type filters
-   Entry fee range slider
-   Player count range
-   Status filters
-   Reset button at bottom

**Main content**:

-   Top bar: sort dropdown + view toggle + results count
-   Grid or list view of games
-   Pagination or infinite scroll

### 4.4 Game Lobby Page

**What to do**: Pre-game waiting room.

**Layout**: Two columns

-   Left: Game preview + waiting status + players
-   Right: Game info + chat

**Waiting area**:

-   Centered spinner or status icon
-   "Waiting to Start" message
-   Player count display
-   Status indicator

**Player list**:

-   All joined players
-   Ready status for each

**Right panel**:

-   Room details
-   "Ready Up" button (green)
-   "Copy Link" button
-   "Cancel & Refund" button

**Chat section**:

-   Message list (scrollable)
-   Input at bottom
-   Empty state message

### 4.5 User Profile Page

**What to do**: Showcase user's content and activity.

**Header**:

-   Large avatar (96px)
-   User info: name, wallet, join date
-   Stats: projects, followers, following, views
-   Edit button

**Tabs**:

-   Created (shows user's games)
-   Activity (timeline of actions)

**Created games**:

-   3-4 column grid
-   Empty state if none

---

## Phase 5: Specialized Components

### 5.1 Game Card Design

**What to do**: Information-dense cards for game browsing.

**Structure**:

-   Card wrapper with hover effect
-   Thumbnail (16:9 aspect ratio)
-   Content section with padding

**Thumbnail**:

-   Game screenshot background
-   Gradient overlay from bottom
-   Badges: "Featured" (top-right), "Live" (top-right), Status (bottom-left)
-   Scale on hover

**Content**:

-   Game title (17px, 1 line)
-   Creator name (13px)
-   Stats grid (3 columns)

**Stats grid**:

-   Entry fee column
-   Prize pool column (green)
-   Players column
-   Each: label + value

**Hover state**:

-   Lift up
-   Border brightens
-   Title changes to blue

### 5.2 Price Display Component

**What to do**: Consistent price formatting.

**Large display** (heroes):

-   32px monospace amount
-   20px currency label
-   15px USD equivalent

**Medium display** (cards):

-   24px monospace amount
-   17px currency label

**Small display** (lists):

-   17px monospace amount
-   13px currency label

**Price changes**:

-   Green + up arrow for gains
-   Red + down arrow for losses
-   Show percentage change

### 5.3 Status Badges

**What to do**: Instant visual status recognition.

**Live badge**:

-   Green background
-   Black text
-   Pulsing dot animation
-   "LIVE" label

**Waiting badge**:

-   Yellow background
-   Black text
-   Clock icon
-   "WAITING" label

**Ended badge**:

-   Gray background
-   Gray text
-   Checkmark icon
-   "ENDED" label

**Full badge**:

-   Red background (subtle)
-   Red border
-   "FULL" label

### 5.4 Empty States

**What to do**: Guide users when content unavailable.

**Structure**:

-   Centered, max 400px width
-   Large icon (64px, gray)
-   Title (20px, semibold)
-   Description (15px, secondary text)
-   Action button

**Variations**:

-   No games created
-   No search results
-   Connection error

### 5.5 Loading States

**What to do**: Feedback during async operations.

**Full page loader**:

-   Centered spinner (32px)
-   Blue color
-   Slow rotation
-   Optional text below

**Card skeleton**:

-   Shimmer animation
-   Gradient moves across
-   Maintains card structure

**Button loading**:

-   Spinner replaces text
-   Same size
-   Disabled state

### 5.6 Modal System

**What to do**: Focus attention without losing context.

**Overlay**:

-   Black at 75% opacity
-   8px backdrop blur
-   Fade in animation

**Modal container**:

-   Tertiary background
-   Subtle border
-   20px radius
-   Max-width 600px
-   Centered
-   Scale + fade animation

**Structure**:

-   Header with close button
-   Scrollable content
-   Footer with actions

**Close methods**:

-   Click overlay
-   Escape key
-   X button

### 5.7 Toast Notifications

**What to do**: Non-intrusive action feedback.

**Position**: Bottom-right corner

**Structure**:

-   Quaternary background
-   Subtle border
-   12px radius
-   Icon + title + message
-   Close button

**Variants**:

-   Success: green left border
-   Error: red left border
-   Warning: yellow left border
-   Info: blue left border

**Behavior**:

-   Auto-dismiss after 5 seconds
-   Pause on hover
-   Manual close
-   Stack vertically (max 3)

---

## Phase 6: Polish & Optimization

### 6.1 Micro-interactions

**What to do**: Add subtle animations for feedback.

**Button press**:

-   Scale to 98% on press
-   150ms duration

**Card hover**:

-   Translate up 2px
-   Border brightens
-   200ms duration

**Input focus**:

-   Border color transition
-   Background transition
-   Ring appears

**Page transitions**:

-   Fade in content
-   Sections slide up
-   Stagger by 50ms

**Loading shimmer**:

-   Gradient moves across
-   1.5s loop
-   Infinite

### 6.2 Responsive Behavior

**What to do**: Adapt to all screen sizes.

**Breakpoints**:

-   Mobile: < 640px
-   Tablet: 640-1024px
-   Desktop: > 1024px

**Sidebar**:

-   Desktop: always visible
-   Tablet: collapsible
-   Mobile: overlay

**Navigation**:

-   Desktop: full nav in top bar
-   Mobile: bottom tab bar

**Grids**:

-   Desktop: 3-4 columns
-   Tablet: 2 columns
-   Mobile: 1 column

**Typography**:

-   Scale down 20% on mobile
-   Maintain readability

**Touch targets**:

-   Minimum 44x44px
-   Increase if needed on mobile

### 6.3 Performance

**What to do**: Ensure fast, smooth experience.

**Images**:

-   Use WebP format
-   Lazy load below fold
-   Proper sizing

**Animations**:

-   Use transform and opacity only
-   GPU acceleration
-   No layout thrashing

**Code splitting**:

-   Lazy load routes
-   Lazy load modals
-   Prefetch on hover

**Scroll performance**:

-   Passive listeners
-   Debounce handlers
-   Virtual scrolling for long lists

### 6.4 Accessibility

**What to do**: WCAG 2.1 AA compliance.

**Color contrast**:

-   4.5:1 for normal text
-   3:1 for large text and UI

**Keyboard navigation**:

-   All elements reachable
-   Logical tab order
-   Skip links
-   Escape closes modals

**Focus indicators**:

-   Visible on all elements
-   2px blue outline
-   2px offset
-   Never remove

**Screen readers**:

-   Semantic HTML
-   ARIA labels for icons
-   Alt text for images
-   Live regions for updates

**Motion preferences**:

-   Detect prefers-reduced-motion
-   Disable animations if preferred
-   Keep essential transitions

---

## Implementation Priority

### Week 1: Foundation

-   Color system
-   Typography
-   Spacing
-   Tailwind config

### Week 2: Core Components

-   Buttons
-   Cards
-   Inputs
-   Badges
-   Layout shell

### Week 3: Layouts & Game Components

-   Sidebar
-   Top nav
-   Game cards
-   Price displays
-   Status badges

### Week 4: Pages

-   Home page
-   Game detail
-   Browse
-   Lobby
-   Profile

### Week 5: Polish

-   Modals
-   Toasts
-   Loading states
-   Micro-interactions
-   Testing

---

## Success Metrics

**Visual Quality**:

-   Matches styleguide 100%
-   Consistent spacing
-   Smooth animations
-   Professional appearance

**User Experience**:

-   Intuitive navigation
-   Fast perceived performance
-   Clear hierarchy
-   Easy scanning

**Technical**:

-   Lighthouse > 90
-   WCAG AA compliant
-   Cross-browser compatible
-   Responsive

---

## Notes for AI Agents

1. Always reference the styleguide for exact specifications
2. Use semantic naming for components
3. Build small reusable components first
4. Test responsive behavior early
5. Accessibility is mandatory
6. Maintain consistency across all pages
7. Document complex logic
8. Mobile experience is critical
9. Communicate blockers immediately
10. Never include code in the plan - this is strategic guidance only

---

**End of Implementation Plan**
