# Mock OPIC LMS

## Overview

Mock OPIC LMS is a web-based learning management system designed for administering and taking OPIC (Oral Proficiency Interview by Computer) mock tests. The application serves two primary user roles:

1. **Administrators** - Create and manage test sets by uploading 1-50 MP3 audio files containing questions, and download student submissions as ZIP files
2. **Students** - Take tests by listening to audio questions and recording spoken responses, after providing their name and language selection

The system enables asynchronous language assessment by capturing student recordings and storing them for instructor download. The application prioritizes simplicity and focus during test-taking, following Material Design principles adapted for educational contexts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**Routing**: Wouter for client-side routing with three main routes:
- `/` - Home page with role selection
- `/admin` - Administrator interface for test management
- `/student` - Student interface for taking tests

**State Management**: TanStack Query (React Query) for server state management with custom query client configuration. No global state management library needed due to simple component hierarchy.

**UI Component System**: Radix UI primitives with shadcn/ui design system using the "new-york" style preset. Components follow a consistent design language with:
- Tailwind CSS for styling with custom theme variables
- CSS variables for theme customization (light mode only based on repository)
- Utility-first approach with component variants using class-variance-authority

**Design System Principles**:
- Typography: Noto Sans KR for Korean text, Inter for UI elements
- Spacing: Tailwind standard scale (4, 6, 8, 12, 16)
- Container widths: max-w-4xl for student interface, max-w-6xl for admin
- Layout: Single column for test-taking, 2-column for admin interfaces

### Backend Architecture

**Runtime**: Node.js with Express.js framework using ES modules.

**API Structure**: RESTful API with the following endpoints:
- `GET /api/test-sets` - Retrieve all test sets
- `GET /api/test-sets/:id` - Retrieve a specific test set
- `POST /api/test-sets` - Create new test set with MP3 uploads (1-50 files)
- `GET /api/submissions` - Retrieve all student submissions
- `GET /api/submissions/:id` - Retrieve a specific submission
- `GET /api/submissions/:id/download` - Download submission recordings as ZIP
- `POST /api/submit-test` - Submit student recordings with name and language

**File Upload Handling**: Multer middleware configured for:
- Memory storage (files stored in memory as buffers)
- Audio file filtering (accepts only audio/mpeg and audio/mp3)
- Multi-file upload support (1-50 files per test set)

**Storage Layer**: File-based JSON storage implementation with base64-encoded audio for persistence. The `IStorage` interface defines the contract for:
- Test set CRUD operations
- Question audio storage and retrieval
- Student submission management with metadata (name, language, timestamp)
- ZIP file generation for downloading student recordings

**Development Server**: Custom Vite integration in development mode with:
- Middleware mode for HMR (Hot Module Replacement)
- Custom logging for API requests
- Request/response capture for debugging

### Data Schema

**Type System**: Zod for runtime validation with TypeScript type inference.

**Core Entities**:
- `TestSet`: Contains id, name, createdAt date, instructorEmail, and array of questions
- `Question`: Contains id, filename, duration, url, and order
- `Submission`: Contains id, testSetId, testSetName, studentName, language, submittedAt timestamp, and recordingCount
- `Recording`: Links questionId with recorded blob data

**Validation**: Input validation using Zod schemas for test creation and submission endpoints.

### External Dependencies

**UI Component Libraries**:
- @radix-ui/* - Comprehensive set of accessible, unstyled component primitives
- cmdk - Command menu component
- react-day-picker - Date picker for calendar functionality
- embla-carousel-react - Carousel/slider component
- recharts - Charting library (included but potentially unused)

**Database**: 
- Drizzle ORM configured for PostgreSQL with Neon serverless driver
- Schema defined in `shared/schema.ts` with migration support via drizzle-kit
- DATABASE_URL environment variable required for database connection
- Note: Current implementation uses in-memory storage; database integration is configured but not actively used

**File Export**:
- Archiver library for creating ZIP files of student recordings
- ZIP files include all student recordings named question_1.webm, question_2.webm, etc.

**Form Management**:
- React Hook Form with @hookform/resolvers for form state and validation
- Integration with Zod schemas for type-safe form validation

**Media Recording**:
- Browser MediaRecorder API for capturing student audio responses
- WebM format for recorded audio (browser-dependent codec support)
- getUserMedia for microphone access

**Development Tools**:
- TypeScript for type safety
- ESBuild for production builds
- TSX for TypeScript execution in development
- PostCSS with Tailwind CSS and Autoprefixer

**Replit Integration** (when deployed on Replit):
- @replit/vite-plugin-runtime-error-modal - Error overlay
- @replit/vite-plugin-cartographer - Development tooling
- @replit/vite-plugin-dev-banner - Development banner
- connect-pg-simple - PostgreSQL session store (configured but potentially unused)