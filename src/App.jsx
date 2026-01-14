import React from 'react'
import KanbanBoard from './components/KanbanBoard'
import { RealtimeProvider } from './context/RealtimeContext'
import './App.css'

function App() {
  return (
    <RealtimeProvider>
      <div className="app">
        <header className="app-header">
          <h1>📋 Realtime Collaborative Notes</h1>
          <p>Real-time updates with optimistic UI and conflict-safe interactions</p>
        </header>
        <KanbanBoard />
      </div>
    </RealtimeProvider>
  )
}

export default App
