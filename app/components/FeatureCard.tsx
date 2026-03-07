'use client'

import React from 'react'

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-gray-800/50 p-4 sm:p-6 rounded-lg border border-gray-700 transform transition-all duration-300 hover:scale-105 hover:border-racing-red">
      <div className="mb-3 sm:mb-4">{icon}</div>
      <h4 className="text-base sm:text-lg font-semibold mb-2">{title}</h4>
      <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{description}</p>
    </div>
  )
}
