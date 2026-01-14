import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { realtimeService } from '../services/realtimeService'

const RealtimeContext = createContext()

export const useRealtime = () => {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider')
  }
  return context
}

export const RealtimeProvider = ({ children }) => {
  const [cards, setCards] = useState([])
  const [pendingOperations, setPendingOperations] = useState(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const userIdRef = useRef(uuidv4())
  const versionRef = useRef(0)
  const operationQueueRef = useRef([])
  const tempIdToRealIdRef = useRef(new Map()) // Track temp ID to real ID mapping

  // Initialize connection
  useEffect(() => {
    realtimeService.connect()
    realtimeService.onConnect(() => {
      setIsConnected(true)
      console.log('Connected to realtime service')
    })

    realtimeService.onDisconnect(() => {
      setIsConnected(false)
      console.log('Disconnected from realtime service')
    })

    realtimeService.onUpdate((update) => {
      handleRemoteUpdate(update)
    })

    // Load initial state
    const initialState = realtimeService.getInitialState()
    if (initialState && initialState.cards) {
      setCards(initialState.cards)
      versionRef.current = initialState.version || 0
    }

    return () => {
      realtimeService.disconnect()
    }
  }, [])

  // Handle remote updates with conflict resolution
  const handleRemoteUpdate = useCallback((update) => {
    setCards((prevCards) => {
      // Skip if this is our own operation (already handled optimistically)
      if (update.userId === userIdRef.current && pendingOperations.has(update.operationId)) {
        const pendingOp = pendingOperations.get(update.operationId)
        // Mark as confirmed
        setPendingOperations((prev) => {
          const newMap = new Map(prev)
          const op = newMap.get(update.operationId)
          if (op) {
            newMap.set(update.operationId, { ...op, status: 'confirmed' })
          }
          return newMap
        })
        
        // For create operations, update temp ID to real ID
        if (update.type === 'create' && pendingOp.type === 'create') {
          const tempId = pendingOp.cardId
          tempIdToRealIdRef.current.set(tempId, update.cardId)
          
          // Replace temp card with real card
          return prevCards.map(card => {
            if (card.id === tempId) {
              return { ...update.card, version: update.version, lastModified: update.timestamp }
            }
            // Also check if we already have the real ID (shouldn't happen, but safety check)
            if (card.id === update.cardId) {
              return card // Already have it, don't duplicate
            }
            return card
          })
        }
        
        // For other operations, the optimistic update already handled it
        return prevCards
      }

      // Check if this card already exists (by ID)
      const existingCardById = prevCards.find(c => c.id === update.cardId)
      if (existingCardById) {
        // If remote version is newer, accept it
        if (update.version > (existingCardById.version || 0)) {
          return prevCards.map(card =>
            card.id === update.cardId
              ? { ...update.card, version: update.version, lastModified: update.timestamp }
              : card
          )
        }
        // If versions are equal but timestamps differ, use timestamp
        else if (update.version === (existingCardById.version || 0)) {
          if (new Date(update.timestamp) > new Date(existingCardById.lastModified || 0)) {
            return prevCards.map(card =>
              card.id === update.cardId
                ? { ...update.card, version: update.version, lastModified: update.timestamp }
                : card
            )
          }
        }
        // Otherwise keep local version
        return prevCards
      }

      // New card - check if we already have a temp card that matches
      if (update.type === 'create') {
        // Check if we have a temp card with matching content and column
        const tempCard = prevCards.find(c => 
          c.id.startsWith('temp-') &&
          c.content === update.card.content && 
          c.columnId === update.card.columnId
        )
        
        if (tempCard) {
          // Replace temp card with real card
          tempIdToRealIdRef.current.set(tempCard.id, update.cardId)
          return prevCards.map(card =>
            card.id === tempCard.id
              ? { ...update.card, version: update.version, lastModified: update.timestamp }
              : card
          )
        }
        
        // Check if card with this ID already exists (shouldn't happen, but safety)
        const cardExists = prevCards.some(c => c.id === update.cardId)
        if (cardExists) {
          return prevCards // Already have it
        }
        
        return [...prevCards, { ...update.card, version: update.version, lastModified: update.timestamp }]
      }

      // Delete card
      if (update.type === 'delete') {
        return prevCards.filter(c => c.id !== update.cardId)
      }

      return prevCards
    })

    versionRef.current = Math.max(versionRef.current, update.version || 0)
  }, [pendingOperations])

  // Optimistic create
  const createCard = useCallback((columnId, content) => {
    const tempId = `temp-${uuidv4()}`
    const newCard = {
      id: tempId,
      content,
      columnId,
      version: versionRef.current + 1,
      lastModified: new Date().toISOString(),
      userId: userIdRef.current,
    }

    const operationId = uuidv4()
    
    // Optimistic update
    setCards(prev => [...prev, newCard])
    
    // Track pending operation
    setPendingOperations(prev => {
      const newMap = new Map(prev)
      newMap.set(operationId, {
        type: 'create',
        cardId: tempId,
        status: 'pending',
        timestamp: Date.now()
      })
      return newMap
    })

    // Send to server
    realtimeService.createCard(newCard, operationId, (confirmedCard) => {
      // The remote update handler will replace the temp card with the real one
      // Just clean up the pending operation
      setPendingOperations(prev => {
        const newMap = new Map(prev)
        newMap.delete(operationId)
        return newMap
      })
      
      versionRef.current = Math.max(versionRef.current, confirmedCard.version || 0)
    })

    return tempId
  }, [])

  // Optimistic update
  const updateCard = useCallback((cardId, updates) => {
    const operationId = uuidv4()
    
    // Optimistic update
    setCards(prev => prev.map(card => {
      if (card.id === cardId) {
        return {
          ...card,
          ...updates,
          version: (card.version || 0) + 1,
          lastModified: new Date().toISOString(),
        }
      }
      return card
    }))

    // Track pending operation
    setPendingOperations(prev => {
      const newMap = new Map(prev)
      newMap.set(operationId, {
        type: 'update',
        cardId,
        status: 'pending',
        timestamp: Date.now()
      })
      return newMap
    })

    // Send to server
    realtimeService.updateCard(cardId, updates, operationId, (confirmedCard) => {
      setCards(prev => prev.map(card =>
        card.id === cardId
          ? { ...confirmedCard, version: confirmedCard.version || card.version }
          : card
      ))
      
      setPendingOperations(prev => {
        const newMap = new Map(prev)
        newMap.delete(operationId)
        return newMap
      })
      
      if (confirmedCard.version) {
        versionRef.current = Math.max(versionRef.current, confirmedCard.version)
      }
    })
  }, [])

  // Optimistic delete
  const deleteCard = useCallback((cardId) => {
    const operationId = uuidv4()
    
    // Optimistic update
    setCards(prev => prev.filter(card => card.id !== cardId))

    // Track pending operation
    setPendingOperations(prev => {
      const newMap = new Map(prev)
      newMap.set(operationId, {
        type: 'delete',
        cardId,
        status: 'pending',
        timestamp: Date.now()
      })
      return newMap
    })

    // Send to server
    realtimeService.deleteCard(cardId, operationId, () => {
      setPendingOperations(prev => {
        const newMap = new Map(prev)
        newMap.delete(operationId)
        return newMap
      })
    })
  }, [])

  // Move card between columns
  const moveCard = useCallback((cardId, newColumnId) => {
    updateCard(cardId, { columnId: newColumnId })
  }, [updateCard])

  const value = {
    cards,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
    isConnected,
    pendingOperations,
  }

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}
