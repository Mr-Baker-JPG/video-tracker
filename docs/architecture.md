# Architecture Documentation

## Architecture Overview – Version 1.0.0

**Status: IMPLEMENTED (Active development)**

### Core Components

- **Video Upload System**: File upload handler with validation, storage
  management, and database persistence
- **Video Player**: HTML5 video element with custom controls for playback and
  frame navigation
- **Tracking System**: Canvas overlay system for placing and storing tracking
  points with frame associations
- **Scale Calibration System**: Line drawing interface with pixel-to-meter
  conversion calculations
- **Video Management**: List view with thumbnails, metadata display, and
  deletion capabilities
- **Database Models**: Prisma schema for Video, TrackingPoint, TrackingObject,
  and VideoScale models

### Data Model / Schema

**Video Model:**

- `id`: Unique identifier
- `userId`: Foreign key to User (owner)
- `filename`: Original filename
- `url`: Storage path/URL
- `duration`: Video duration in seconds
- `uploadedAt`: Timestamp

**TrackingPoint Model:**

- `id`: Unique identifier
- `trackingObjectId`: Foreign key to TrackingObject
- `frame`: Frame number
- `x`: X coordinate in pixels
- `y`: Y coordinate in pixels

**TrackingObject Model:**

- `id`: Unique identifier
- `videoId`: Foreign key to Video
- `name`: Optional object name
- `color`: Color for visualization

**VideoScale Model:**

- `id`: Unique identifier
- `videoId`: Foreign key to Video
- `pixelDistance`: Distance in pixels
- `realDistance`: Real-world distance in meters
- `startX`, `startY`, `endX`, `endY`: Scale line coordinates

### Technology Stack

- **Framework**: React Router v7 (Epic Stack / Remix-style)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (utility-first)
- **UI Components**: shadcn/ui (Radix UI)
- **Database ORM**: Prisma
- **Database**: SQLite (local development)
- **Build Tool**: Vite
- **Testing**: Vitest + React Testing Library (unit), Playwright (E2E)

### File Storage

- Videos stored server-side with file system or cloud storage integration
- Storage utilities handle file uploads, retrieval, and deletion
- File validation for video formats (mp4, webm, mov)

### User Interface Patterns

- Full-stack components with loaders and actions
- Server-side data fetching with React Router loaders
- Form actions for mutations (upload, delete, tracking point creation)
- Canvas-based overlay for video interaction
- Responsive design with Tailwind CSS

### Authentication & Authorization

- Built on Epic Stack authentication system
- User-based video ownership and access control
- Videos are private to the uploading user

### Current Limitations

- YouTube URLs accepted but not yet processed (placeholder)
- No graph generation or physics calculations yet
- No data export functionality
- Single object tracking only (multiple objects planned)
- No session persistence for tracking work in progress

---

## Planned Architecture Impact – Version 2.0.0

**Status: PLANNING ONLY (no implementation yet)**

### New Components or Services

- **Class/Classroom Model**: Database schema to represent classes, with
  relationships to teachers (users) and students (users)
- **Class Membership Model**: Join table or relationship model to track which
  students belong to which classes
- **Video Assignment Model**: Database schema to represent video assignments
  from teachers to students/classes
- **License Type System**: User model extension or separate model to track
  license type (individual vs site/classroom)
- **Teacher Dashboard/Interface**: New UI components for teachers to manage
  classes, rosters, and assignments
- **Student Classroom View**: Modified UI for students to see assigned videos
  and classroom context
- **Activity Monitoring System**: Data model and UI to track student activity on
  assigned videos (views, tracking progress, completion status)

### Changes to Existing Components

- **User Model**: Extend to support license types and role differentiation
  (teacher vs student vs individual)
- **Video Model**: May need to support assignment relationships and visibility
  scoping (individual vs classroom)
- **Video List Component**: Conditionally render classroom-assigned videos for
  students, or all videos for teachers
- **Navigation/Routing**: Add classroom routes and conditionally show/hide
  classroom navigation based on license type
- **Authentication/Authorization**: Add role-based access control to distinguish
  teachers, students, and individual users

### Data Model / Schema Considerations

- **Class Table**: `id`, `name`, `teacherId` (FK to User), `createdAt`,
  `updatedAt`
- **ClassMembership Table**: `id`, `classId` (FK to Class), `studentId` (FK to
  User), `joinedAt`
- **VideoAssignment Table**: `id`, `videoId` (FK to Video), `classId` (FK to
  Class, nullable), `studentId` (FK to User, nullable), `assignedAt`, `dueDate`
  (nullable), `status`
- **User Model Extension**: Add `licenseType` enum field (`individual` |
  `site`), potentially add `role` field or derive from license type and class
  membership
- **Activity Tracking**: Consider adding activity log table or extending
  existing models to track student interactions with assigned videos

### External Integration Ideas

- None specified at this time

### Performance/Reliability Concerns

- **Data Isolation**: Ensure individual users' data is completely isolated from
  classroom data
- **Scalability**: Consider performance implications of teachers viewing
  activity for many students across multiple classes
- **Privacy**: Ensure student data is only accessible to their assigned
  teachers, not other teachers or students
- **Query Optimization**: Classroom views may require complex joins across
  classes, memberships, assignments, and videos
