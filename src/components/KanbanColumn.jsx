import React, { useState } from 'react'
import { useRealtime } from '../context/RealtimeContext'
import KanbanCard from './KanbanCard'
import './KanbanColumn.css'

function KanbanColumn({ column, cards }) {
  const { createCard, moveCard } = useRealtime()
  const [isAdding, setIsAdding] = useState(false)
  const [newCardContent, setNewCardContent] = useState('')

  const handleAddCard = () => {
    if (newCardContent.trim()) {
      createCard(column.id, newCardContent.trim())
      setNewCardContent('')
      setIsAdding(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-over')
    const cardId = e.dataTransfer.getData('cardId')
    if (cardId) {
      moveCard(cardId, column.id)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    e.currentTarget.classList.add('drag-over')
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-over')
  }

  return (
    <div
      className="kanban-column"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{ borderTopColor: column.color }}
    >
      <div className="column-header">
        <h2>{column.title}</h2>
        <span className="card-count">{cards.length}</span>
      </div>

      <div className="column-cards">
        {cards.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p className="empty-text">No notes yet</p>
            <p className="empty-hint">Click "+ Add Note" to get started</p>
          </div>
        ) : (
          cards.map(card => (
            <KanbanCard key={card.id} card={card} />
          ))
        )}
      </div>

      {isAdding ? (
        <div className="add-card-form">
          <textarea
            value={newCardContent}
            onChange={(e) => setNewCardContent(e.target.value)}
            placeholder="Type your note here... (Ctrl/Cmd + Enter to save, Esc to cancel)"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                handleAddCard()
              } else if (e.key === 'Escape') {
                setIsAdding(false)
                setNewCardContent('')
              }
            }}
            className="card-input"
          />
          <div className="form-actions">
            <button onClick={handleAddCard} className="btn-primary">
              Add
            </button>
            <button onClick={() => {
              setIsAdding(false)
              setNewCardContent('')
            }} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="add-card-button"
        >
          + Add Note
        </button>
      )}
    </div>
  )
}

export default KanbanColumn
