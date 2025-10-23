# Storia Video Creator - Design Guidelines

## Design Approach
**Framework**: Design System Approach (Linear + Figma inspired)
**Rationale**: As a complex SaaS productivity tool with multi-step workflows, Storia requires consistent UI patterns, clear information hierarchy, and efficient navigation. The design balances professional functionality with creative industry aesthetics.

---

## Core Design Principles

1. **Workflow Clarity**: Every step in the video creation process should be immediately understandable
2. **Spatial Efficiency**: Maximize canvas/workspace area while keeping tools accessible
3. **Progressive Disclosure**: Show complexity only when needed
4. **Creative Confidence**: Design should inspire creativity, not intimidate users

---

## Color Palette

### Dark Mode (Primary)
- **Background Base**: Deep charcoal (220 8% 12%)
- **Surface Elevated**: (220 10% 16%) for cards, panels, modals
- **Surface Hover**: (220 12% 20%)
- **Border Subtle**: (220 15% 25%)

### Brand Colors
- **Primary Green**: (158 65% 35%) - Headers, primary actions, active states
- **Primary Hover**: (158 65% 42%)
- **Gradient Accent**: Linear gradient from (158 80% 45%) to (280 75% 55%) - Used sparingly for hero moments, premium features, CTAs

### Functional Colors
- **Success**: (142 71% 45%)
- **Warning**: (38 92% 50%)
- **Error**: (0 72% 51%)
- **Info**: (217 91% 60%)

### Text Hierarchy
- **Primary Text**: (0 0% 98%) - Headlines, primary content
- **Secondary Text**: (220 9% 65%) - Descriptions, metadata
- **Tertiary Text**: (220 9% 50%) - Subtle labels, disabled states

---

## Typography

### Font Families
- **Primary**: 'Inter' (Google Fonts) - UI elements, body text
- **Display**: 'Outfit' (Google Fonts) - Marketing pages, hero headlines
- **Monospace**: 'JetBrains Mono' - Code, technical data

### Type Scale
- **Display**: text-5xl (48px) font-bold - Marketing heroes
- **H1**: text-3xl (30px) font-semibold - Page titles
- **H2**: text-2xl (24px) font-semibold - Section headers
- **H3**: text-xl (20px) font-medium - Card headers
- **Body Large**: text-base (16px) font-normal - Primary content
- **Body**: text-sm (14px) font-normal - Standard UI text
- **Caption**: text-xs (12px) font-medium - Labels, metadata

---

## Layout System

### Spacing Units
Primary scale: **2, 3, 4, 6, 8, 12, 16, 20** (Tailwind units)
- Tight elements: p-2, gap-3
- Standard spacing: p-4, gap-4, mb-6
- Section padding: py-8, py-12, py-16
- Large separations: mt-20

### Grid & Containers
- **App Container**: Full viewport with sidebar
- **Workspace Container**: Remaining width after sidebar (dynamic)
- **Content Max Width**: max-w-7xl for centered content sections
- **Modal Max Width**: max-w-2xl for dialogs

### Sidebar Navigation
- **Width**: 280px fixed
- **Background**: Deep charcoal with subtle border-r
- **Logo Area**: h-16 with brand logo and wordmark
- **Navigation Items**: py-2 px-4, rounded-lg, with icon + label
- **Active State**: Primary green background, white text
- **Hover State**: Surface hover background

---

## Component Library

### Navigation & Structure
- **App Sidebar**: Fixed left, 280px, logo at top, mode switcher, asset library access, settings at bottom
- **Top Bar**: Breadcrumb navigation, workspace selector, user profile/credits
- **Tabs**: Underline style with primary green indicator for active workflow steps
- **Breadcrumbs**: Subtle with chevron separators, last item highlighted

### Buttons & Actions
- **Primary**: bg-primary-green, white text, rounded-lg, px-4 py-2
- **Secondary**: border-2 border-primary-green, text-primary-green
- **Ghost**: Transparent with hover state, used in toolbars
- **Icon Buttons**: 40x40px, rounded-lg, centered icon
- **Gradient CTA**: Use gradient accent for key conversion actions (Export, Upgrade)

### Cards & Panels
- **Standard Card**: bg-surface-elevated, rounded-xl, border border-subtle, p-6
- **Hover Card**: Add shadow-lg on hover for interactive cards
- **Storyboard Frame Card**: Aspect ratio 16:9, thumbnail + metadata below
- **Character Card**: Portrait thumbnail, name, description snippet

### Forms & Inputs
- **Text Input**: bg-surface-elevated, border border-subtle, rounded-lg, px-3 py-2, focus:ring-2 ring-primary-green
- **Textarea**: Same as text input, min-h-32
- **Select Dropdown**: Match input style, chevron-down indicator
- **Checkbox/Radio**: Primary green when checked, rounded
- **Toggle Switch**: Primary green background when active

### Data Display
- **Timeline/Storyboard**: Horizontal scrollable container, cards with fixed width (240px)
- **Scene List**: Vertical stack, collapsible items, drag handles
- **Asset Grid**: 3-4 columns (responsive), uniform aspect ratios
- **Stat Cards**: Large number display, label below, icon accent

### Overlays
- **Modal Dialog**: max-w-2xl, centered, backdrop-blur-sm, bg-surface-elevated with prominent border
- **Slide-over Panel**: From right, w-1/3 viewport min, for asset library/settings
- **Tooltip**: bg-gray-900, text-xs, rounded-md, arrow indicator
- **Dropdown Menu**: bg-surface-elevated, rounded-lg, py-1, items with hover states

### Progress & Feedback
- **Progress Bar**: h-2, rounded-full, primary green fill, subtle gray background
- **Loading Spinner**: Primary green, 24px standard size
- **Toast Notifications**: Bottom-right, auto-dismiss, icon + message + action
- **Empty States**: Centered icon (48px), heading, description, CTA button

---

## Workflow-Specific Layouts

### Narrative Mode Canvas
- **Left Sidebar**: Scene/shot list (300px), collapsible
- **Center Canvas**: Main workspace (script editor, storyboard view, animatic player)
- **Right Panel**: Properties inspector (360px), context-sensitive controls

### Asset Library
- **Grid View**: 4 columns, cards with thumbnail, name, metadata
- **Filter Bar**: Top, horizontal chips for categories
- **Search**: Prominent, top-right, with instant results

### Content Calendar
- **Month View**: Grid layout, date cells with scheduled content indicators
- **List View**: Table with sortable columns (title, date, platform, status)

---

## Icons
**Library**: Lucide Icons (via CDN)
**Usage**: 
- Navigation: 20px icons with labels
- Buttons: 16px icons
- Large empty states: 48px icons
- Consistent stroke-width: 2

---

## Animations
**Principle**: Minimal and purposeful
- **Page Transitions**: None (instant)
- **Hover States**: 150ms ease-out for background/border changes
- **Modal Entry**: 200ms fade + subtle scale (0.95 → 1.0)
- **Toast Notifications**: Slide-in from bottom-right
- **Loading States**: Spinner or skeleton screens, no elaborate animations

---

## Images

### Marketing/Landing Page
- **Hero Section**: Full-width background video or high-quality screenshot showing the storyboard interface in action (platform demo), with subtle gradient overlay
- **Feature Showcase**: 3 images showing (1) Script editor interface, (2) Storyboard grid view, (3) Export/publishing dashboard
- **Brand Trust**: Minimal, focus on product capabilities

### Application Interface
- **Empty States**: Illustrative icons or minimal SVG graphics
- **Storyboard Thumbnails**: AI-generated frame previews (16:9 aspect ratio)
- **Character Assets**: Portrait style thumbnails with consistent styling
- **Tutorial/Onboarding**: Annotated screenshots with highlights

---

## Accessibility & Polish
- All interactive elements minimum 44x44px touch target
- Keyboard navigation fully supported with visible focus states (ring-2 ring-primary-green)
- ARIA labels for icon-only buttons
- Consistent dark mode across all inputs and form elements
- Proper contrast ratios (WCAG AA minimum) for all text