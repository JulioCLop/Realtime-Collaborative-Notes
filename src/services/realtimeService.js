// Simulated realtime service - in production, this would connect to a WebSocket server
class RealtimeService {
  constructor() {
    this.listeners = {
      connect: [],
      disconnect: [],
      update: [],
    }
    this.connected = false
    this.state = {
      cards: [],
      version: 0,
    }
    this.simulatedUsers = []
    this.simulateOtherUsers()
  }

  connect() {
    // Simulate connection delay
    setTimeout(() => {
      this.connected = true
      this.listeners.connect.forEach(cb => cb())
    }, 100)
  }

  disconnect() {
    this.connected = false
    this.listeners.disconnect.forEach(cb => cb())
  }

  onConnect(callback) {
    this.listeners.connect.push(callback)
  }

  onDisconnect(callback) {
    this.listeners.disconnect.push(callback)
  }

  onUpdate(callback) {
    this.listeners.update.push(callback)
  }

  emitUpdate(update) {
    this.listeners.update.forEach(cb => cb(update))
  }

  getInitialState() {
    return {
      ...this.state,
      cards: [...this.state.cards],
    }
  }

  createCard(card, operationId, callback) {
    // Simulate network delay
    setTimeout(() => {
      const confirmedCard = {
        ...card,
        id: card.id.startsWith('temp-') ? `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : card.id,
        version: this.state.version + 1,
      }
      
      this.state.version++
      this.state.cards.push(confirmedCard)
      
      // Broadcast to other clients
      this.emitUpdate({
        type: 'create',
        cardId: confirmedCard.id,
        card: confirmedCard,
        userId: card.userId,
        operationId,
        version: confirmedCard.version,
        timestamp: new Date().toISOString(),
      })

      if (callback) callback(confirmedCard)
    }, 150 + Math.random() * 200) // 150-350ms delay
  }

  updateCard(cardId, updates, operationId, callback) {
    setTimeout(() => {
      const card = this.state.cards.find(c => c.id === cardId)
      if (!card) {
        if (callback) callback(null)
        return
      }

      const updatedCard = {
        ...card,
        ...updates,
        version: (card.version || 0) + 1,
      }

      this.state.cards = this.state.cards.map(c =>
        c.id === cardId ? updatedCard : c
      )
      this.state.version++

      // Broadcast to other clients
      this.emitUpdate({
        type: 'update',
        cardId,
        card: updatedCard,
        userId: card.userId,
        operationId,
        version: updatedCard.version,
        timestamp: new Date().toISOString(),
      })

      if (callback) callback(updatedCard)
    }, 150 + Math.random() * 200)
  }

  deleteCard(cardId, operationId, callback) {
    setTimeout(() => {
      this.state.cards = this.state.cards.filter(c => c.id !== cardId)
      this.state.version++

      // Broadcast to other clients
      this.emitUpdate({
        type: 'delete',
        cardId,
        userId: null,
        operationId,
        version: this.state.version,
        timestamp: new Date().toISOString(),
      })

      if (callback) callback()
    }, 150 + Math.random() * 200)
  }

  // Simulate other users making changes
  simulateOtherUsers() {
    setInterval(() => {
      if (!this.connected || this.state.cards.length === 0) return
      
      // Randomly simulate updates from other users
      if (Math.random() > 0.95) { // 5% chance every interval
        const randomCard = this.state.cards[Math.floor(Math.random() * this.state.cards.length)]
        if (randomCard) {
          const simulatedUserId = `user-${Math.floor(Math.random() * 5)}`
          
          // Simulate content update
          if (Math.random() > 0.5) {
            const newContent = randomCard.content + ' ✨'
            this.updateCard(
              randomCard.id,
              { content: newContent },
              `sim-${Date.now()}`,
              null
            )
          }
        }
      }
    }, 5000) // Check every 5 seconds
  }
}

export const realtimeService = new RealtimeService()
