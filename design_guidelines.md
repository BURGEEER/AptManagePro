# Apartment Management System - Design Guidelines

## Design Approach: Modern B2B SaaS Design System

**Selected Approach:** Design System inspired by Xero, Linear, and Stripe  
**Justification:** Property management software requires clarity, efficiency, and trust. The utility-focused nature demands information density handled elegantly, with standard but polished UI patterns.

**Core Principles:**
- **Clarity First:** Every element serves a functional purpose
- **Confident Simplicity:** Clean interfaces that don't overwhelm
- **Data Transparency:** Make complex information digestible
- **Trust & Professionalism:** Inspire confidence in financial/legal operations

---

## Color Palette

### Light Mode
- **Primary Brand:** 214 100% 47% (Deep Blue - trust, professionalism)
- **Secondary:** 214 32% 91% (Light Blue - backgrounds, hover states)
- **Success:** 142 71% 45% (Green - payments, approvals)
- **Warning:** 38 92% 50% (Amber - pending items, alerts)
- **Error:** 0 84% 60% (Red - overdue, critical issues)
- **Neutral Gray Scale:** 220 9% 46% (text), 220 13% 91% (borders), 0 0% 98% (backgrounds)

### Dark Mode
- **Primary Brand:** 214 100% 60%
- **Secondary:** 214 20% 25%
- **Success:** 142 71% 55%
- **Warning:** 38 92% 60%
- **Error:** 0 84% 70%
- **Neutral Gray Scale:** 220 9% 85% (text), 220 13% 25% (borders), 220 13% 15% (backgrounds)

---

## Typography

**Font Families:**
- **Primary:** Inter (via Google Fonts) - clean, professional, excellent readability
- **Monospace:** JetBrains Mono (for financial data, IDs, codes)

**Scale:**
- **Headings:** text-3xl/font-semibold (Dashboard titles), text-2xl/font-semibold (Section headers), text-xl/font-medium (Card titles)
- **Body:** text-base (standard content), text-sm (secondary info, labels), text-xs (metadata, captions)
- **Financial Data:** text-lg/font-mono (amounts, balances)

---

## Layout System

**Spacing Primitives:** Tailwind units 2, 4, 6, 8, 12, 16, 24  
**Common patterns:** p-6 (cards), gap-4 (grids), mb-8 (section spacing)

**Grid Structure:**
- **Dashboard:** Sidebar navigation (w-64) + main content area
- **Content Width:** max-w-7xl for main containers
- **Card Layouts:** grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- **Data Tables:** Full-width with horizontal scroll on mobile

---

## Component Library

### Navigation
- **Sidebar:** Fixed left navigation with icon + text, active state with primary color background and white text
- **Top Bar:** Breadcrumbs, user profile dropdown, notification bell, global search
- **Mobile:** Collapsible hamburger menu

### Dashboard Cards
- **Stat Cards:** Large numbers with trend indicators (↑/↓), subtle colored backgrounds matching metric type
- **Chart Cards:** White/dark cards with embedded charts, dropdown for time period selection
- **Quick Action Cards:** Icon + title + description with hover lift effect

### Data Display
- **Tables:** Zebra striping, sortable headers, row hover states, sticky headers for long lists
- **Status Badges:** Rounded-full pills with appropriate colors (Occupied: green, Vacant: gray, Maintenance: amber, Overdue: red)
- **Property Cards:** Image thumbnail + key details in clean grid layout

### Forms & Inputs
- **Input Fields:** Border outline with focus ring, floating labels
- **Dropdowns:** Native select enhanced with custom styling
- **File Uploads:** Drag-and-drop zones with upload progress indicators
- **Date Pickers:** Calendar overlay with month/year navigation

### Actions
- **Primary Buttons:** Solid primary color, medium rounded corners (rounded-md)
- **Secondary Buttons:** Outlined with hover fill
- **Icon Buttons:** Minimal style for table actions, tooltips on hover
- **Bulk Actions:** Checkbox selection with floating action bar

### Overlays
- **Modals:** Centered with backdrop blur, max-w-2xl for forms
- **Slide-overs:** Right-side panels for quick edits, property details
- **Toasts:** Top-right corner for success/error notifications, auto-dismiss

---

## Page-Specific Layouts

### Multi-Role Dashboard
- **Admin View:** Revenue overview, occupancy analytics, system alerts in 3-column stat row + charts below
- **Property Manager View:** Property list cards, maintenance queue, recent activity feed
- **Tenant Portal:** Clean, welcoming layout with payment status, lease summary, quick request button

### Property Management
- **Portfolio Grid:** Property cards with images, occupancy rates, revenue metrics
- **Property Detail:** Tabbed interface (Units, Tenants, Maintenance, Financials, Documents)
- **Unit Management:** Floor plan visualization option, table/grid toggle view

### Financial Dashboards
- **Revenue Tracking:** Time-series charts with filters, breakdown by property/unit type
- **Payment Status:** Table with search/filter, color-coded status, bulk actions
- **Expense Management:** Categorized bar charts, vendor breakdown

### Maintenance System
- **Request Queue:** Kanban board view (Submitted → In Progress → Resolved) with filtering
- **Request Details:** Photo gallery, timeline of updates, vendor assignment, cost tracking

### Reports
- **Report Builder:** Step-by-step interface with preview pane
- **Export Options:** PDF/Excel buttons with format selection dropdown
- **Saved Reports:** Template library with one-click generation

---

## Data Visualization
- **Chart Library:** Use Chart.js via CDN
- **Chart Types:** Line (trends), Bar (comparisons), Donut (composition), Area (cumulative)
- **Color Usage:** Primary blue palette with semantic colors for categories
- **Interactivity:** Hover tooltips, legend toggle, responsive scaling

---

## Icons
**Library:** Heroicons via CDN (outline for navigation, solid for status indicators)

---

## Images
- **Property Photos:** High-quality building exteriors for property cards and detail headers
- **Placeholder States:** Illustrated empty states (no maintenance requests, no documents uploaded)
- **User Avatars:** Circular with initials fallback for tenants/managers

---

## Animations
**Minimal approach:**
- Page transitions: Fade-in on load
- Hover states: Subtle shadow lift on cards
- Loading: Spinner for data fetching
- NO complex scroll animations or page transitions