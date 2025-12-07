# Videotrack

A physics video analysis application that allows users to upload videos or input
YouTube URLs to perform object tracking, collect position/time data, and
generate physics-based graphs and visualizations.

<div align="center">

**Built with [The Epic Stack 🚀](https://www.epicweb.dev/epic-stack)**

[![The Epic Stack](https://github-production-user-asset-6210df.s3.amazonaws.com/1500684/246885449-1b00286c-aa3d-44b2-9ef2-04f694eb3592.png)](https://www.epicweb.dev/epic-stack)

</div>

## About

Videotrack enables physics students and educators to:

- **Upload videos** or input YouTube URLs for analysis
- **Track objects** frame-by-frame with precise point placement
- **Set scale calibration** by drawing lines and specifying real-world distances
- **Visualize data** with trajectory paths overlaid on videos
- **Generate graphs** showing position, velocity, and acceleration over time
- **Export data** as CSV for further analysis

### Current Features (v1.0.0 - In Progress)

- ✅ Video upload and storage
- ✅ Video player with frame-by-frame navigation
- ✅ Tracking point placement on video frames
- ✅ Multi-point tracking across frames for objects
- ✅ Scale calibration with real-world distance input
- 🔄 Tracking data export (CSV)
- 🔄 Position, velocity, and acceleration graphs
- 🔄 Trajectory path visualization
- 🔄 Save and load tracking sessions
- 🔄 Multiple object tracking

See [`features.json`](./features.json) for the complete feature list and
progress.

## Tech Stack

- **Framework:** React Router v7 (Epic Stack / Remix-style full-stack framework)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (utility-first)
- **UI Components:** shadcn/ui (Radix UI components)
- **Database ORM:** Prisma
- **Database:** SQLite (local development)
- **Build Tool:** Vite
- **Testing:**
  - Unit/Integration: Vitest + React Testing Library
  - E2E/Browser: Playwright
- **Deployment:** Fly.io (configured)

## Getting Started

### Prerequisites

- Node.js 22
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd videotracker

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npx prisma migrate dev

# Seed the database (optional)
npx prisma db seed

# Start the development server
npm run dev
```

### Running Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Run all tests
npm run validate
```

## AI-Driven Development Workflow

This project uses a structured, version-aware, feature-by-feature development
workflow powered by AI assistance. All development follows strict rules defined
in [`.cursor/rules/ai-workflow.mdc`](.cursor/rules/ai-workflow.mdc).

### Overview

The workflow ensures:

- **Systematic development**: One feature at a time, fully tested before
  completion
- **Version boundaries**: Features are organized into versions with explicit
  states
- **Persistent tracking**: All state stored in JSON/Markdown files, not context
  memory
- **Resumable work**: Any developer or AI agent can pick up from any point

### Workflow Diagram

```mermaid
graph TB
    Start([Start]) --> PlanVersion[Plan Version<br/>@plan-version]
    PlanVersion --> |Create version entry| VersionPlanned[Version: planned]

    VersionPlanned --> ActivateVersion[Activate Version<br/>@activate-version]
    ActivateVersion --> |Check previous completion| CheckPrev{Previous<br/>Complete?}

    CheckPrev -->|Yes| CreateFeatures[Create Features<br/>in features.json]
    CheckPrev -->|No| StashDeferred[Stash incomplete<br/>as deferred]
    StashDeferred --> CreateFeatures

    CreateFeatures --> |Set status active| VersionActive[Version: active]
    VersionActive --> |Update package.json| NextFeature[Implement Next Feature<br/>@next-feature]

    NextFeature --> Implement[Implement Feature]
    Implement --> RunTests[Run Tests<br/>npm test<br/>npm run test:e2e]

    RunTests --> TestsPass{Tests<br/>Pass?}
    TestsPass -->|No| FixCode[Fix Implementation]
    FixCode --> RunTests

    TestsPass -->|Yes| MarkComplete[Mark Feature Complete<br/>Update progress.md<br/>Create Git Commit]

    MarkComplete --> CheckVersionComplete{All Features<br/>Complete?}
    CheckVersionComplete -->|No| NextFeature
    CheckVersionComplete -->|Yes| VersionComplete[Version Complete]

    VersionComplete --> Transition[Transition Version<br/>@activate-version]
    Transition --> |Set status implemented| VersionImplemented[Version: implemented]

    VersionImplemented --> |Bump version| BumpVersion[@bump-version]
    BumpVersion --> PlanVersion

    VersionActive --> WorkDeferred[Work on Deferred<br/>@work-deferred]
    WorkDeferred --> NextFeature

    style VersionPlanned fill:#e1f5ff
    style VersionActive fill:#fff4e1
    style VersionImplemented fill:#e8f5e9
    style MarkComplete fill:#f3e5f5
```

### Core Concepts

#### Version States

1. **Planned** → Version documented, not yet active for implementation
2. **Active** → Version currently being implemented
3. **Implemented** → All features complete and tested
4. **Released** → Version released to users

#### Feature Lifecycle

1. **Planning** → Feature designed and added to `features.json`
2. **Implementation** → Code written for single feature
3. **Testing** → All tests run and pass
4. **Completion** → Feature marked complete, progress logged, commit created
5. **Deferral** (optional) → Moved to `deferred_features` if version transitions

### Key Files

- **`features.json`** - Feature registry with implementation status
- **`versions.json`** - Version definitions and feature associations
- **`progress.md`** - Development history and implementation log
- **`Claude.md`** - Project context and overview
- **`.cursor/rules/ai-workflow.mdc`** - Strict workflow rules

### Commands

| Command             | Purpose                                               |
| ------------------- | ----------------------------------------------------- |
| `@plan-version`     | Plan a new version (PRD, architecture, versions.json) |
| `@activate-version` | Transition planned → active, create features          |
| `@next-feature`     | Implement next unimplemented feature                  |
| `@new-feature`      | Add a single new feature to features.json             |
| `@work-deferred`    | Implement deferred/backlog features                   |
| `@bump-version`     | Update package.json version                           |

For detailed workflow documentation, see
[`AI-Workflow-Overview.md`](./AI-Workflow-Overview.md).

### Workflow Rules

- ✅ One feature per iteration
- ✅ All tests must pass before completion
- ✅ Only active version features can be implemented
- ✅ Progress tracked explicitly in files
- ❌ No silent feature modifications
- ❌ No cross-version implementation
- ❌ No skipping tests

## Development

### Project Structure

```
videotracker/
├── app/                    # Application code (React Router v7)
│   ├── components/        # React components
│   ├── routes/            # Route handlers (loaders/actions)
│   └── utils/             # Utility functions
├── prisma/                # Database schema and migrations
├── tests/                 # Test files
│   ├── e2e/              # Playwright E2E tests
│   └── setup/            # Test configuration
├── .cursor/              # Cursor AI configuration
│   ├── commands/         # AI command definitions
│   └── rules/            # Workflow rules
├── features.json         # Feature registry
├── versions.json         # Version definitions
├── progress.md           # Development history
└── Claude.md            # Project context
```

### Adding New Features

Features are managed through the AI workflow:

1. **For versioned features**: Use `@plan-version` then `@activate-version`
2. **For ad-hoc features**: Use `@new-feature` to design, then `@next-feature`
   to implement

All features must:

- Have clear descriptions and test specifications
- Pass all unit and E2E tests
- Be documented in `progress.md` upon completion

### Code Style

- TypeScript strict mode
- ESLint + Prettier configured
- Follow Epic Stack conventions
- Test coverage required for new features

## Documentation

- **[AI-Workflow-Overview.md](./AI-Workflow-Overview.md)** - Complete workflow
  documentation
- **[Claude.md](./Claude.md)** - Project overview and context
- **[progress.md](./progress.md)** - Development history
- **[features.json](./features.json)** - Feature registry
- **[versions.json](./versions.json)** - Version definitions

## Contributing

This project uses a strict AI-driven workflow. Before contributing:

1. Read [`AI-Workflow-Overview.md`](./AI-Workflow-Overview.md)
2. Read [`.cursor/rules/ai-workflow.mdc`](.cursor/rules/ai-workflow.mdc)
3. Understand the version-aware feature lifecycle
4. Follow the command-based workflow

All contributions must:

- Follow the feature-by-feature workflow
- Include passing tests
- Update relevant documentation
- Follow conventional commit format

## License

[Your License Here]

## Acknowledgments

Built on [The Epic Stack](https://www.epicweb.dev/epic-stack) by
[Kent C. Dodds](https://kentcdodds.com).

---

**Status**: v1.0.0 in active development  
**Last Updated**: 2025-01-27
