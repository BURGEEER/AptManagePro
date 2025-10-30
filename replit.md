# PropertyPro - Apartment Management System

## Overview

PropertyPro is a modern B2B SaaS apartment and property management system designed for professional property managers and administrators. The application provides comprehensive tools for managing properties, tenants, maintenance requests, financial records, communications, and reporting. Built with a focus on clarity, efficiency, and trust, it handles complex property management workflows with an elegant, information-dense interface.

The system supports multi-property management with features including:
- Dashboard with announcements and analytics
- Master list of owners/tenants with unit and parking assignments
- Property and tenant management
- Maintenance request tracking with categorization (civil, plumbing, electrical, etc.)
- Utility consumption readings (water and electricity)
- Financial management including delinquent account tracking
- Communication hub for admin-owner-tenant interactions
- Transaction processing and payment tracking
- Automated report generation (engineering, billing, SOA)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript running on Vite for development and production builds.

**Routing**: Wouter for client-side routing, providing a lightweight alternative to React Router.

**UI Component Library**: Radix UI primitives with shadcn/ui styling pattern (New York variant). This provides:
- Accessible, unstyled components as a foundation
- Custom styling via Tailwind CSS with CSS variables
- Component variants using class-variance-authority
- Comprehensive component set including dialogs, dropdowns, forms, tables, charts, etc.

**Styling Approach**:
- Tailwind CSS for utility-first styling
- Custom CSS variables for theming (supports light/dark modes)
- Design system inspired by Xero, Linear, and Stripe for B2B SaaS aesthetic
- Typography: Inter font family for UI, JetBrains Mono for financial data
- Color palette based on HSL values with semantic naming (primary, secondary, destructive, etc.)

**State Management**:
- TanStack Query (React Query) for server state management
- React hooks for local component state
- No global state management library (relies on React Query cache)

**Data Visualization**: Recharts library for revenue charts, occupancy trends, and analytics dashboards.

**Form Handling**: React Hook Form with Zod schema validation via @hookform/resolvers.

### Backend Architecture

**Server Framework**: Express.js with TypeScript running in ESM mode.

**Development Setup**: Custom Vite integration for HMR (Hot Module Replacement) during development, with production builds serving static assets.

**API Design**: RESTful API pattern with routes prefixed with `/api`. Currently uses a storage abstraction layer (IStorage interface) with in-memory implementation (MemStorage class) as placeholder.

**Session Management**: Prepared for connect-pg-simple for PostgreSQL-backed sessions (package installed but not yet implemented).

**Project Structure**:
- Monorepo approach with shared types between client and server
- Path aliases: `@/` for client, `@shared/` for shared schema/types
- Separation of concerns: routes, storage layer, and server setup

### Data Storage

**Database**: PostgreSQL via Neon serverless driver with WebSocket support.

**ORM**: Drizzle ORM for type-safe database operations with:
- Schema definition in `shared/schema.ts`
- Drizzle Kit for migrations (stored in `/migrations`)
- Zod integration for runtime validation via drizzle-zod

**Current Schema**: Minimal user table with id (UUID), username, and password. The schema is designed to expand with tables for properties, units, tenants, maintenance requests, financial records, communications, etc.

**Connection Architecture**: Connection pooling using @neondatabase/serverless Pool with WebSocket constructor for Neon compatibility.

### Authentication & Authorization

**Status**: Authentication infrastructure is prepared but not fully implemented:
- User schema exists with username/password fields
- Storage interface includes user CRUD methods
- Session management package (connect-pg-simple) is installed
- No password hashing or session middleware currently active

**Intended Pattern**: Session-based authentication with PostgreSQL session store, likely implementing role-based access control (admin, owner, tenant roles based on requirements document).

### External Dependencies

**Database Provider**: Neon (serverless PostgreSQL) - required via DATABASE_URL environment variable.

**Font Delivery**: Google Fonts CDN for Inter and JetBrains Mono typefaces.

**Build Tools**:
- Vite for frontend bundling and development server
- esbuild for backend production builds
- TypeScript compiler for type checking

**Development Tools** (Replit-specific):
- @replit/vite-plugin-runtime-error-modal for error overlay
- @replit/vite-plugin-cartographer for navigation
- @replit/vite-plugin-dev-banner for environment indicators

**UI Dependencies**:
- Radix UI component primitives (20+ packages for different components)
- lucide-react for icons
- recharts for data visualization
- date-fns for date manipulation
- cmdk for command palette functionality
- vaul for drawer components

**Validation & Schemas**:
- Zod for runtime type validation
- drizzle-zod for database schema validation

### Design System

**Theme Strategy**: CSS variable-based theming supporting light and dark modes with semantic color tokens. Theme switching via ThemeProvider context and localStorage persistence.

**Color System**:
- Primary: Deep blue (214 100% 47%) for trust and professionalism
- Success: Green for payments and approvals
- Warning: Amber for pending items
- Error: Red for overdue and critical issues
- Neutral grays for text and borders

**Interactive States**: Hover and active elevation system using CSS variables (`--elevate-1`, `--elevate-2`) for subtle depth changes on interaction.

**Responsive Design**: Mobile-first approach with breakpoints, custom mobile detection hook, and sidebar component that adapts to screen size.