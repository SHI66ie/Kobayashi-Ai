'use client'

import { AlertCircle, ExternalLink, RefreshCw } from 'lucide-react'

export default function SetupGuide() {
  return (
    <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center space-x-3 mb-4">
        <AlertCircle className="w-6 h-6 text-red-400" />
        <h3 className="text-xl font-bold text-red-400">Worker Connection Issue</h3>
      </div>
      
      <div className="space-y-4 text-gray-300">
        <p>
          Unable to connect to the Cloudflare Worker. This usually happens due to:
        </p>
        
        <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-orange-300">Common Issues:</h4>
          
          <ul className="space-y-2 text-sm list-disc list-inside">
            <li><strong>Timeout:</strong> The worker took too long to respond (Netlify 10s limit)</li>
            <li><strong>CORS:</strong> Cross-origin request blocked by browser</li>
            <li><strong>Worker Down:</strong> Cloudflare Worker is not deployed or crashed</li>
            <li><strong>Network:</strong> Slow connection between Netlify → Cloudflare → Google Drive</li>
          </ul>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-blue-300">Quick Fixes:</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <span className="bg-orange-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
              <span>Check worker status:</span>
              <a 
                href="https://drive-proxy.blockmusic.workers.dev/list?folderId=1oYgl8SFNEvqpEdqRXsR_cGeRqCjjvpfQ" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Test Worker</span>
              </a>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="bg-orange-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
              <span>Try a different track (some load faster than others)</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="bg-orange-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
              <span>Check browser console (F12) for detailed error messages</span>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
          <p className="text-blue-300 text-sm">
            <strong>Technical Info:</strong> Worker URL:{' '}
            <code className="bg-gray-800 px-2 py-1 rounded text-xs">
              https://drive-proxy.blockmusic.workers.dev
            </code>
          </p>
        </div>
        
        <div className="text-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg text-white font-medium flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    </div>
  )
}
