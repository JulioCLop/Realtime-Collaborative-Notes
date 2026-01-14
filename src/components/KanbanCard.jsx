import React, { useState } from 'react'
import { useRealtime } from '../context/RealtimeContext'
import './KanbanCard.css'

function KanbanCard({ card }) {
  const { updateCard, deleteCard, pendingOperations } = useRealtime()
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(card.content)
  const [isDragging, setIsDragging] = useState(false)

  // Check if this card has pending operations
  const hasPendingOps = Array.from(pendingOperations.values()).some(
    op => op.cardId === card.id && op.status === 'pending'
  )

  const handleEdit = () => {
    setIsEditing(true)
    setEditContent(card.content)
  }

  const handleSave = () => {
    if (editContent.trim() && editContent !== card.content) {
      updateCard(card.id, { content: editContent.trim() })
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditContent(card.content)
    setIsEditing(false)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteCard(card.id)
    }
  }

  const handleDragStart = (e) => {
    setIsDragging(true)
    if (e.dataTransfer) {
      e.dataTransfer.setData('cardId', card.id)
      e.dataTransfer.effectAllowed = 'move'
    }
    // Add a slight delay to make drag feel smoother
    setTimeout(() => {
      if (e.target) {
        e.target.style.opacity = '0.5'
      }
    }, 0)
  }

  const handleDragEnd = (e) => {
    setIsDragging(false)
    if (e.target) {
      e.target.style.opacity = '1'
    }
  }

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    // Allow scrolling on mobile, only drag on long press
    const touch = e.touches[0]
    const startY = touch.clientY
    const startX = touch.clientX
    
    const handleTouchMove = (moveEvent) => {
      const moveTouch = moveEvent.touches[0]
      const deltaY = Math.abs(moveTouch.clientY - startY)
      const deltaX = Math.abs(moveTouch.clientX - startX)
      
      // If horizontal movement is greater, initiate drag
      if (deltaX > 10 && deltaX > deltaY) {
        setIsDragging(true)
        moveEvent.preventDefault()
      }
    }
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
  }

  return (
    <div
      className={`kanban-card ${isDragging ? 'dragging' : ''} ${hasPendingOps ? 'pending' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTouchStart={handleTouchStart}
    >
      {hasPendingOps && (
        <div className="pending-indicator" title="Saving...">
          <span className="spinner"></span>
        </div>
      )}
      
      {isEditing ? (
        <div className="card-editor">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                handleSave()
              } else if (e.key === 'Escape') {
                handleCancel()
              }
            }}
            className="card-edit-input"
            placeholder="Edit your note... (Ctrl/Cmd + Enter to save, Esc to cancel)"
            autoFocus
          />
          <div className="card-actions">
            <button onClick={handleSave} className="btn-save" title="Ctrl+Enter">
              Save
            </button>
            <button onClick={handleCancel} className="btn-cancel" title="Esc">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="card-content" onClick={handleEdit}>
            {card.content}
          </div>
          <div className="card-footer">
            <span className="card-timestamp">
              {new Date(card.lastModified || Date.now()).toLocaleTimeString()}
            </span>
            <div className="card-buttons">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleEdit()
                }}
                className="btn-icon"
                title="Edit (Click card to edit)"
                aria-label="Edit note"
              >
                ✏️
              </button>
              <button
                onClick={handleDelete}
                className="btn-icon btn-icon-delete"
                title="Delete note"
                aria-label="Delete note"
              >
                🗑️
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default KanbanCard
