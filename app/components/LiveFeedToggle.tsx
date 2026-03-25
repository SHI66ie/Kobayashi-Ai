'use client'

import React from 'react'
import { useLiveFeed } from './LiveFeedProvider'
import { Satellite, Activity, Eye, EyeOff } from 'lucide-react'

const LiveFeedToggle: React.FC = () => {
  const { isVisible, toggleLiveFeed, isMinimized } = useLiveFeed()

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onClick={toggleLiveFeed}
        className={`group relative p-3 rounded-full transition-all duration-300 shadow-lg ${
          isVisible 
            ? 'bg-racing-red hover:bg-red-600 text-white' 
            : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
        }`}
        title={isVisible ? 'Hide Live Feed' : 'Show Live Feed'}
      >
        {isVisible ? (
          <EyeOff className="w-5 h-5" />
        ) : (
          <Eye className="w-5 h-5" />
        )}
        
        {/* Notification dot when minimized */}
        {isVisible && isMinimized && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        )}
      </button>
      
      {/* Tooltip */}
      <div className={`absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap ${
        isVisible ? 'block' : 'hidden'
      }`}>
        <div className="flex items-center space-x-2">
          <Satellite className="w-4 h-4 text-racing-red" />
          <span>Live Feed {isVisible ? 'Active' : 'Inactive'}</span>
        </div>
        <div className="absolute bottom-full right-2 w-0 h-0 border-l-8 border-l-transparent border-t-gray-900 transform translate-y-1"></div>
      </div>
    </div>
  )
}

export default LiveFeedToggle
