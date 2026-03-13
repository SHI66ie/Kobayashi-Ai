import React from 'react';
import { Target, Flag, GitPullRequest, Settings } from 'lucide-react';

export default function StrategyPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Race Strategy</h1>
            <p className="text-gray-500 dark:text-gray-400">Predictive pit stop analysis and tire strategy</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center shadow-sm">
          <Settings className="w-4 h-4 mr-2" />
          Configure Simulator
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 shadow-sm">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <GitPullRequest className="w-8 h-8 text-purple-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Strategy Editor Offline</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
            The strategy simulator requires active practice session data or historic race data to generate pit window predictions. Please select a session from the F1 Analytics dashboard first.
          </p>
          <button className="px-6 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
            Go to F1 Analytics
          </button>
        </div>
      </div>
    </div>
  );
}
