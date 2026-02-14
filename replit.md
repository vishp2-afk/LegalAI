# LegalAI - AI-Powered Legal Document Review Application

## Overview

LegalAI is a modern web application that provides AI-powered legal document analysis and review services. The platform allows users to upload legal documents (PDF, DOC, DOCX, TXT) and receive intelligent risk assessments, clause analysis, and actionable recommendations. The application features a professional interface designed for legal professionals and individuals who need reliable document review capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built using React with TypeScript, utilizing modern development patterns and component-based architecture. The UI is constructed with shadcn/ui components for consistent design and accessibility. Key architectural decisions include:

- **Component Library**: Radix UI primitives with shadcn/ui styling for professional appearance
- **Styling**: Tailwind CSS with custom design system supporting both light and dark themes
- **State Management**: TanStack Query for server state management and React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Theme System**: Custom theme provider supporting system, light, and dark modes

### Backend Architecture
The server-side follows a Node.js/Express architecture with TypeScript for type safety. Core architectural decisions include:

- **Runtime**: Express.js server with TypeScript compilation
- **File Processing**: Multer for secure file uploads with type validation and size limits
- **AI Integration**: OpenAI API integration for legal document analysis using GPT models
- **Security**: Comprehensive file validation, secure storage patterns, and privacy-focused design

### Data Storage Solutions
The application uses a PostgreSQL database managed through Drizzle ORM for type-safe database operations. Key schema decisions include:

- **User Management**: Supports Replit authentication with user profiles and usage tracking
- **Document Storage**: Secure document storage with encryption considerations
- **Analysis Results**: Structured storage of AI analysis results including risk assessments and recommendations
- **Session Management**: PostgreSQL-based session storage for authentication
- **Usage Tracking**: Billing and usage analytics support

### Authentication and Authorization
The application implements Replit Auth using OpenID Connect for seamless user authentication:

- **SSO Integration**: Replit authentication for development environment integration
- **Session Management**: Express sessions with PostgreSQL storage
- **User Profiles**: Automatic user profile creation and management
- **Security**: HTTP-only cookies with secure session handling

### External Dependencies

#### AI and Machine Learning
- **OpenAI API**: Primary AI service for legal document analysis and natural language processing
- **Document Processing**: Text extraction from various document formats (PDF, DOC, DOCX)

#### Database and Storage
- **NeonDB**: PostgreSQL hosting service for production database
- **Drizzle ORM**: Type-safe database toolkit for schema management and queries

#### Authentication Services
- **Replit Auth**: OpenID Connect authentication provider
- **Passport.js**: Authentication middleware for Express

#### Payment Processing
- **Stripe**: Payment processing integration for subscription billing
- **Stripe React Components**: Client-side payment form components

#### Development and Build Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type safety across the entire application stack
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production builds

#### UI and Design System
- **Radix UI**: Accessible component primitives
- **shadcn/ui**: Pre-built component library
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form**: Form state management and validation

#### File Processing
- **Multer**: Multipart form data handling for file uploads
- **PDF-parse**: PDF text extraction (implementation pending)
- **Mammoth**: Word document text extraction (implementation pending)