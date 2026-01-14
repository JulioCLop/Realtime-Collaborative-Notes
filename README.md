# Realtime Collaborative Notes / Kanban

A modern React application featuring real-time collaborative notes with a Kanban board interface. Built with optimistic UI updates and conflict-safe interaction patterns.

## Features

- **Real-time Collaboration**: Multiple users can work on the same board simultaneously
- **Optimistic UI**: Instant feedback with updates applied immediately before server confirmation
- **Conflict Resolution**: Version-based conflict resolution with timestamp fallback
- **Drag & Drop**: Move notes between columns (To Do, In Progress, Done)
- **Modern UI**: Beautiful gradient design with smooth animations
- **Connection Status**: Visual indicator of real-time connection state

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Build

```bash
npm run build
```

## Architecture

### Components

- **KanbanBoard**: Main board container with columns
- **KanbanColumn**: Individual column (To Do, In Progress, Done)
- **KanbanCard**: Individual note/card component

### Context & Services

- **RealtimeContext**: Manages state and real-time operations
- **realtimeService**: Simulated WebSocket service (replace with real WebSocket in production)

### Key Features

1. **Optimistic Updates**: All operations (create, update, delete) are applied immediately to the UI
2. **Conflict Resolution**: Uses version numbers and timestamps to resolve conflicts
3. **Pending Operations**: Visual indicators show when operations are pending confirmation
4. **Real-time Sync**: Changes from other users are automatically synchronized

## Usage

- **Add Note**: Click "+ Add Note" in any column
- **Edit Note**: Click on a note's content or the edit button
- **Move Note**: Drag and drop notes between columns
- **Delete Note**: Click the delete button on a note
- **Keyboard Shortcuts**:
  - `Ctrl+Enter`: Save when editing
  - `Esc`: Cancel editing

## Production Deployment

To use this in production, replace the `realtimeService` with a real WebSocket connection to your backend server. The service interface is designed to be easily replaceable.
# Realtime-Collaborative-Notes
# Realtime-Collaborative-Notes
