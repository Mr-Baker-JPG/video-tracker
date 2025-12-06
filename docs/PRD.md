# Product Requirements Document

## Version 1.0.0 – Initial Release

**Status: ACTIVE (Currently in development)**

### Summary

A physics video analysis program that allows users to upload videos or input
YouTube video URLs to perform video tracking for data collection. Users can set
scale parameters and track objects across frames to collect position/time data
for physics analysis.

### Goals

- Enable users to upload and manage video files for physics analysis
- Provide video playback with frame-by-frame navigation for precise tracking
- Allow users to place tracking points on videos to mark object positions
- Support multi-point tracking across frames for the same object
- Enable scale calibration to convert pixel coordinates to real-world
  measurements
- Provide YouTube URL input (validation and placeholder for future processing)
- Store video metadata and tracking data in the database
- Create a user-friendly interface for video management and tracking

### Non-Goals

- Classroom/teacher features (deferred to version 2.0.0)
- Graph generation and physics calculations (planned for later features)
- Data export functionality (planned for later features)
- Multiple object tracking (planned for later features)
- YouTube video processing (future consideration)

### Constraints

- Built on Epic Stack template with existing authentication and user management
- Must preserve existing code patterns and conventions
- SQLite database for local development
- React Router v7 full-stack framework
- TypeScript, Tailwind CSS, and shadcn/ui components

### High-Level Use Cases

1. **As a physics student**, I want to upload a video file from my device, so
   that I can analyze motion in the video.

2. **As a user**, I want to see a list of all my uploaded videos with
   thumbnails, so that I can easily find and manage my videos.

3. **As a user**, I want to play, pause, and navigate through a video
   frame-by-frame, so that I can precisely track objects at specific moments.

4. **As a user**, I want to click on the video to place tracking points at
   specific frames, so that I can mark object positions for data collection.

5. **As a user**, I want to track the same point across multiple frames, so that
   I can collect position data over time for a moving object.

6. **As a user**, I want to set a scale by drawing a line and entering a
   real-world distance, so that I can convert pixel coordinates to meters for
   physics calculations.

7. **As a user**, I want to input a YouTube URL, so that I can prepare for
   future YouTube video analysis capabilities.

8. **As a user**, I want my videos and tracking data to be stored securely, so
   that I can access them later.

### Implemented Features (F001-F008)

- **F001**: Video Upload UI with file validation and progress feedback
- **F002**: Video Storage and Database Model with Prisma schema
- **F003**: Video Player Component with play/pause and frame navigation
- **F004**: Video List/Management Page with thumbnails and delete functionality
- **F005**: YouTube URL Input with validation and video ID extraction
- **F006**: Tracking Point Marker with canvas overlay for point placement
- **F007**: Multi-Point Tracking Across Frames with frame navigation
- **F008**: Scale Calibration UI with line drawing and distance input

### Planned Features (F009-F020)

- **F009**: Tracking Data Export (CSV)
- **F010**: Position vs Time Graph
- **F011**: Velocity Calculation and Graph
- **F012**: Acceleration Calculation and Graph
- **F013**: Trajectory Path Visualization
- **F014**: Save and Load Tracking Sessions
- **F015**: Multiple Object Tracking
- **F016**: Frame-by-Frame Navigation Controls
- **F017**: Video Analysis Dashboard
- **F018**: Graph Export (PNG/PDF)
- **F019**: Basic Error Handling and Validation
- **F020**: Transition to Prisma 7.1.0

---

## Version 2.0.0 – Classroom & Site Licensing

**Status: PLANNED (not yet activated for implementation)**

### Summary

Enable classroom usage by teachers, allowing them to share videos with students
and monitor how students are using the software. Teachers will be able to assign
students videos to analyze and track student activity within the context of
their class.

### Goals

- Allow not just individual users but teachers to use this for the context of
  their class
- Enable teachers to monitor how students are using the software
- Enable teachers to assign students videos to analyze
- Support site licensing (classroom context) and individual licensing (no class
  features visible)
- Enable teachers to manage class rosters and track simple information like
  roster data

### Non-Goals

- None specified for this version

### Constraints

- None specified for this version

### High-Level Use Cases

1. **As a teacher**, I want to create a class and add students to my roster, so
   that I can manage my classroom within the application.

2. **As a teacher**, I want to upload videos and share them with my students, so
   that students can analyze assigned videos for physics projects.

3. **As a teacher**, I want to assign specific videos to specific students or
   the entire class, so that I can guide student learning activities.

4. **As a teacher**, I want to see which students have accessed assigned videos
   and what tracking work they've completed, so that I can monitor student
   progress and engagement.

5. **As a teacher**, I want to view student rosters and manage class membership,
   so that I can maintain accurate class lists.

6. **As a student**, I want to see videos that my teacher has assigned to me, so
   that I can complete my physics analysis assignments.

7. **As a student**, I want to work on assigned videos with the same tracking
   capabilities as individual users, so that I can perform video analysis for
   class assignments.

8. **As an individual user** (non-classroom), I want to use the application
   without seeing any classroom features, so that the interface remains clean
   and focused on my personal video analysis needs.
