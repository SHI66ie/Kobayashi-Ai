'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import PersistentLiveFeed from './PersistentLiveFeed'

interface LiveFeedContextType {
  isVisible: boolean
  setIsVisible: (visible: boolean) => void
  position: 'right' | 'bottom'
  setPosition: (position: 'right' | 'bottom') => void
  isMinimized: boolean
  setIsMinimized: (minimized: boolean) => void
  toggleLiveFeed: () => void
}

const LiveFeedContext = createContext<LiveFeedContextType | null>(null)

export const useLiveFeed = () => {
  const context = useContext(LiveFeedContext)
  if (!context) throw new Error('useLiveFeed must be used within LiveFeedProvider')
  return context
}

interface LiveFeedProviderProps {
  children: ReactNode
  activeTab: string
  drivers: string[]
  trackId: string
}

export const LiveFeedProvider: React.FC<LiveFeedProviderProps> = ({
  children,
  activeTab,
  drivers,
  trackId
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [position, setPosition] = useState<'right' | 'bottom'>('right')
  const [isMinimized, setIsMinimized] = useState(false)

  const toggleLiveFeed = () => {
    setIsVisible(!isVisible)
  }

  const contextValue: LiveFeedContextType = {
    isVisible,
    setIsVisible,
    position,
    setPosition,
    isMinimized,
    setIsMinimized,
    toggleLiveFeed
  }

  return (
    <LiveFeedContext.Provider value={contextValue}>
      {children}
      {isVisible && (
        <PersistentLiveFeed
          activeTab={activeTab}
          drivers={drivers}
          trackId={trackId}
        />
      )}
    </LiveFeedContext.Provider>
  )
}
