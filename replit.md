# Overview

This is a modern e-commerce application for an educational psychologist (Licenciada en Psicopedagogía) specializing in educational games for children and adolescents. The application features a comprehensive product catalog with both physical and digital educational products, a shopping cart system, authentication, and an admin dashboard. The design emphasizes a warm, educational aesthetic with age-appropriate color coding and child-friendly visual elements.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes (August 17, 2025)

- **✅ PostgreSQL Migration ACTUALLY Completed**: Successfully migrated application to YOUR specific Neon database (ep-wispy-mode-acik8cvu-pooler.sa-east-1.aws.neon.tech) with full verification
- **✅ Database Schema**: Created and verified comprehensive database schema with users, products, orders, order_items, and admin_config tables
- **✅ User Registration**: Added complete user registration functionality with form validation and database integration
- **✅ Admin Configuration**: Added database-backed "Configuración" tab to admin panel with MercadoPago and Email SMTP settings - tested and working
- **✅ API Enhancement**: Extended authentication and admin APIs with proper database operations - all endpoints verified
- **✅ Data Seeding**: Populated database with initial products and admin user (admin@edujuegos.com / admin123) - tested and working
- **✅ Footer Credit**: Added development credit to SoftwarePar (www.softwarepar.com) as requested
- **✅ Migration Verification**: Tested authentication, product loading, and admin configuration with PostgreSQL - all systems operational

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development patterns
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Context API for global application state (authentication, cart, filters)
- **Styling**: Tailwind CSS with custom educational color palette and design system
- **UI Components**: Radix UI primitives wrapped in shadcn/ui components for accessibility and consistency
- **Forms**: React Hook Form with Zod validation schemas for type-safe form handling
- **Data Fetching**: TanStack Query for server state management and caching

## Backend Architecture
- **Runtime**: Node.js with Express.js as the web framework
- **Development**: TypeScript with ESBuild for bundling and production builds
- **Database**: PostgreSQL hosted on Neon with Drizzle ORM for type-safe database operations
- **Authentication**: Mock JWT token system for development (production-ready interface)
- **API Design**: RESTful endpoints for products, orders, authentication, and admin configuration
- **Data Migration**: Successfully migrated from in-memory storage to persistent PostgreSQL database

## Component Structure
- **Layout Components**: Header with navigation and cart, Footer with professional information
- **UI Components**: Reusable components following atomic design principles
- **Pages**: Home landing page, Products catalog, About professional page, Checkout, Admin dashboard
- **Modals**: Cart management and authentication overlays
- **Context Providers**: Hierarchical context structure for state management

## Design System
- **Color Palette**: Educational themed colors (mint green, sky blue, coral pink, soft yellow, violet)
- **Typography**: Inter and Poppins fonts for modern, friendly appearance
- **Age-Based Color Coding**: Different colors for age ranges (3-5, 6-8, 9-12, 13+ years)
- **Interactive Elements**: Hover effects, subtle animations, and smooth transitions
- **Responsive Design**: Mobile-first approach with breakpoint-based layouts

## Data Models
- **Users**: Authentication and role-based access (admin/user)
- **Products**: Physical and digital educational products with stock management
- **Orders**: Complete order management with customer information and order items
- **Cart**: Session-based shopping cart with persistence

# External Dependencies

## UI and Styling
- **@radix-ui/react-***: Accessible, unstyled UI primitives for consistent component behavior
- **tailwindcss**: Utility-first CSS framework for rapid styling and design consistency
- **class-variance-authority**: Type-safe utility for managing component variants
- **lucide-react**: Consistent icon library with educational and interface icons

## Data Management
- **@tanstack/react-query**: Server state management, caching, and synchronization
- **react-hook-form**: Performant form library with minimal re-renders
- **@hookform/resolvers**: Integration between React Hook Form and validation libraries
- **zod**: Type-safe schema validation for forms and API responses

## Database and ORM
- **drizzle-orm**: Type-safe SQL ORM for PostgreSQL integration
- **drizzle-kit**: Database migrations and schema management
- **@neondatabase/serverless**: Serverless PostgreSQL driver for cloud deployment
- **drizzle-zod**: Integration between Drizzle ORM and Zod validation

## Development and Build Tools
- **vite**: Fast build tool and development server with HMR
- **@vitejs/plugin-react**: React integration for Vite
- **typescript**: Static type checking and enhanced developer experience
- **esbuild**: Fast JavaScript bundler for production builds

## Routing and Navigation
- **wouter**: Lightweight client-side routing library optimized for React

## Date and Utility Libraries
- **date-fns**: Modern date utility library for formatting and manipulation
- **clsx**: Conditional className utility for dynamic styling
- **cmdk**: Command palette component for enhanced UX

Note: The application has been successfully migrated to PostgreSQL with Neon hosting. All data is now persisted in the database with proper schema design and full CRUD operations verified.