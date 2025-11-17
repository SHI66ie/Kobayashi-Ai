'use client'

import { AlertCircle, ExternalLink, RefreshCw } from 'lucide-react'

export default function SetupGuide() {
  return (
    <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center space-x-3 mb-4">
        <AlertCircle className="w-6 h-6 text-red-400" />
        <h3 className="text-xl font-bold text-red-400">Local Data Setup Issue</h3>
      </div>
      
      <div className="space-y-4 text-gray-300">
        <p>
          Race data could not be loaded from the local <code>Data/</code> folder. This usually happens when
          the data files are missing, incomplete, or in the wrong location.
        </p>
        
        <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-orange-300">Common Issues:</h4>
          
          <ul className="space-y-2 text-sm list-disc list-inside">
            <li><strong>Missing Data Folder:</strong> The <code>Data/</code> directory is not present in the project root.</li>
            <li><strong>Wrong Track/Race:</strong> The selected track/race does not have a matching folder (e.g. <code>Data/barber/R1</code>).</li>
            <li><strong>Incomplete Files:</strong> Race results, lap time, weather, or telemetry JSON files are missing.</li>
            <li><strong>File Names:</strong> Files were renamed and no longer match the expected patterns.</li>
          </ul>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-blue-300">Quick Fixes:</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <span className="bg-orange-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
              <span>Verify the <code>Data/</code> folder exists in your project root and is checked into Git.</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="bg-orange-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
              <span>Confirm the selected track ID (e.g. <code>barber</code>, <code>cota</code>) has a matching folder under <code>Data/</code>.</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="bg-orange-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
              <span>Check the server console (and browser console) for detailed error messages and exact filenames.</span>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
          <p className="text-blue-300 text-sm">
            <strong>Technical Info:</strong> The dashboard now reads JSON directly from the local <code>Data/</code> folder
            (e.g. <code>Data/barber</code>, <code>Data/circuit-of-the-americas</code>). No Cloudflare Worker or Google Drive
            connection is required.
          </p>
        </div>
        
        <div className="text-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg text-white font-medium flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  )
}
