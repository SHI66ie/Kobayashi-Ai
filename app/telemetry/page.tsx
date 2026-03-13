import React from 'react';
import { Activity, Radio, Cpu, Wifi } from 'lucide-react';

export default function TelemetryPage() {
  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Live Telemetry</h1>
          <p className="text-gray-500 dark:text-gray-400">Real-time car data and sensor information</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700/80 rounded-full flex items-center justify-center relative z-10 border border-gray-200 dark:border-gray-600">
            <Radio className="w-10 h-10 text-blue-500 animate-pulse" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">Waiting for Session</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-lg mb-8">
          The telemetry feed is currently inactive. Live car tracking, throttle/brake traces, and g-force data will populate automatically when a session begins.
        </p>
        
        <div className="flex space-x-6 text-sm">
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <Wifi className="w-4 h-4" />
            <span>Connection: Idle</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <Cpu className="w-4 h-4" />
            <span>Data Rate: 0 kb/s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
