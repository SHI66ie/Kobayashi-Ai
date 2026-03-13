import React from 'react';
import { TrendingUp, Activity, BarChart3, Clock } from 'lucide-react';

export default function PerformancePage() {
  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Performance Metrics</h1>
          <p className="text-gray-500 dark:text-gray-400">Advanced driver and car performance telemetry</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Average Speed</p>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">234.5</h3>
            <span className="text-sm font-semibold text-gray-500">km/h</span>
          </div>
          <div className="mt-4 flex items-center text-xs text-green-500 font-medium">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>+2.4% vs last session</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Best Lap Time</p>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">1:18.294</h3>
          </div>
          <div className="mt-4 flex items-center text-xs text-green-500 font-medium">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>-0.5s vs target</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Tire Degradation</p>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">Medium</h3>
          </div>
          <div className="mt-4 flex items-center text-xs text-yellow-500 font-medium">
            <Activity className="w-3 h-3 mr-1" />
            <span>Optimal temperature</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 shadow-sm text-center">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Live Data Coming Soon</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          We are currently integrating the OpenF1 live telemetry feed for this page. Check back during the next race weekend for live performance metrics.
        </p>
      </div>
    </div>
  );
}
