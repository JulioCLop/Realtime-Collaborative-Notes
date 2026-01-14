import React from 'react'
import { useRealtime } from '../context/RealtimeContext'
import KanbanColumn from './KanbanColumn'
import './KanbanBoard.css'

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: '#8b5cf6' },
  { id: 'in-progress', title: 'In Progress', color: '#f97316' },
  { id: 'done', title: 'Done', color: '#22c55e' },
]

function KanbanBoard() {
  const { cards, isConnected } = useRealtime()

  return (
    <div className="kanban-board">
      <div className="connection-status">
        <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
      </div>
      <div className="kanban-columns">
        {COLUMNS.map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
            cards={cards.filter(card => card.columnId === column.id)}
          />
        ))}
      </div>
    </div>
  )
}

export default KanbanBoard
