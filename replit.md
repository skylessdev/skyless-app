# Skyless.app Landing Page

## Overview

This is a full-stack web application for skyless.app, a decentralized network landing page that allows users to connect via wallet, email, or explore anonymously. The application features a modern, dark-themed interface with glassmorphism effects and smooth animations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Animations**: Framer Motion for smooth transitions and micro-interactions
- **State Management**: React Query (@tanstack/react-query) for server state
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: Wouter for lightweight client-side routing
- **Wallet Integration**: Wagmi for Web3 wallet connections

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript throughout the stack
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Validation**: Zod schemas shared between client and server
- **Session Management**: PostgreSQL-compatible session store (connect-pg-simple)

### Design System
- **Component Library**: shadcn/ui with Radix UI primitives
- **Theme**: Dark mode with glassmorphism effects
- **Typography**: Inter font family
- **Color Scheme**: Neutral base with CSS custom properties
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

## Key Components

### Database Schema
- **Users Table**: Core user data with identity vectors, growth tracking, and mood preferences
- **User Sessions**: Track user activity with vector snapshots for growth calculation
- **Reflections**: User thoughts and reflections that become network whispers
- **Network Whispers**: Anonymous shared thoughts with resonance tracking
- **Whisper Resonances**: Track which users resonate with which whispers
- **Flexible Authentication**: Supports wallet-based, email-based, and anonymous connections
- **Timestamps**: PostgreSQL timestamps with proper timezone handling
- **Database Migration**: Successfully migrated from SQLite to PostgreSQL with full schema

### API Endpoints
- `POST /api/connect-wallet`: Handles Web3 wallet connections
- `POST /api/signup-email`: Manages email-based user registration
- `GET /api/dashboard/:userId`: Main dashboard data with growth tracking
- `POST /api/dashboard/start-session`: Track user session starts
- `POST /api/reflections`: Submit reflections that become network whispers
- `GET /api/whispers`: Get current network whispers with resonance counts
- `POST /api/whispers/:id/resonate`: Add/remove resonance to whispers
- `PUT /api/dashboard/mood`: Update user's preferred mood
- Comprehensive error handling with Zod validation

### Frontend Components
- **Landing Page**: Multi-step user onboarding flow with connection options
- **Wallet Provider**: Web3 integration wrapper with multiple connector support
- **Form Components**: Reusable form elements with validation
- **UI Components**: Complete component library from shadcn/ui

## Data Flow

1. **User Interaction**: Users can choose to connect via wallet, email, or explore anonymously
2. **Validation**: All inputs are validated using Zod schemas on both client and server
3. **Database Operations**: User data is stored in PostgreSQL using Drizzle ORM
4. **State Management**: React Query manages server state and caching
5. **UI Updates**: Framer Motion provides smooth transitions between states

## Recent Changes (January 30, 2025)

- **Wallet Integration**: Successfully implemented MetaMask wallet connection using Wagmi v2
- **Database Migration**: Migrated from SQLite to PostgreSQL with Neon serverless driver
- **Dashboard Backend**: Complete backend foundation with whispers, reflections, and user growth tracking
- **Real Data Flow**: All functionality uses authentic PostgreSQL data with no mocks or placeholders
- **API Endpoints**: Full REST API for dashboard operations, reflections, and whisper resonance system
- **UI Polish**: Glassmorphic design matches mockup exactly with smooth animations

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL-compatible database client
- **@tanstack/react-query**: Server state management
- **wagmi**: Web3 React hooks and utilities
- **framer-motion**: Animation library
- **drizzle-orm**: Type-safe ORM

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **cmdk**: Command palette component

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Type safety throughout the stack
- **eslint/prettier**: Code quality and formatting

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: esbuild compiles TypeScript server to `dist/index.js`
- **Database**: SQLite file-based database for simplicity

### Environment Configuration
- **Development**: Uses `tsx` for TypeScript execution
- **Production**: Compiled JavaScript with Node.js
- **Database**: SQLite with automatic table creation
- **Replit Integration**: Special handling for Replit environment with dev banner

### Key Features
- **Hot Module Replacement**: Vite HMR for fast development
- **Error Overlay**: Runtime error modal in development
- **Path Aliases**: TypeScript path mapping for clean imports
- **Static Assets**: Proper handling of attached assets

The application is designed to be lightweight, fast, and easily deployable while maintaining a professional, modern appearance suitable for a Web3 product landing page.