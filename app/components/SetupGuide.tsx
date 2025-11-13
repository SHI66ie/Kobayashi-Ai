'use client'

import { AlertCircle, ExternalLink, Copy } from 'lucide-react'
import { useState } from 'react'

export default function SetupGuide() {
  const [copied, setCopied] = useState(false)

  const copyApiKey = () => {
    navigator.clipboard.writeText('GOOGLE_DRIVE_API_KEY=your_api_key_here')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center space-x-3 mb-4">
        <AlertCircle className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-bold text-blue-400">Setup Required</h3>
      </div>
      
      <div className="space-y-4 text-gray-300">
        <p>
          To access the full Toyota GR Cup dataset (18+ GB), configure Google Drive API:
        </p>
        
        <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-blue-300">Quick Setup (5 minutes):</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
              <span>Get Google Drive API key</span>
              <a 
                href="https://console.developers.google.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Open Console</span>
              </a>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
              <span>Enable Google Drive API v3</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
              <span>Create API Key in Credentials</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">4</span>
              <span>Add to .env.local:</span>
              <button
                onClick={copyApiKey}
                className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs flex items-center space-x-1"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
          <p className="text-yellow-300 text-sm">
            <strong>Alternative:</strong> Download data manually from{' '}
            <a 
              href="https://drive.google.com/drive/folders/1AvpoKZzY7CVtcSBX8wA7Oq8JfAWo-oou" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-yellow-400 hover:underline"
            >
              Google Drive
            </a>{' '}
            and place in Data/ folder.
          </p>
        </div>
        
        <div className="text-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium"
          >
            Refresh After Setup
          </button>
        </div>
      </div>
    </div>
  )
}
