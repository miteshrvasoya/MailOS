'use client'

import { useState, useEffect, useRef } from 'react'
import { TrendingUp, Users, Mail, Clock } from 'lucide-react'

interface StatItem {
  label: string
  value: number
  suffix?: string
  prefix?: string
  icon: React.ElementType
  color: string
  bgColor: string
  description: string
}

interface StatsCounterProps {
  stats: StatItem[]
  className?: string
}

export function StatsCounter({ stats, className = '' }: StatsCounterProps) {
  const [visibleStats, setVisibleStats] = useState<boolean[]>(new Array(stats.length).fill(false))
  const [currentValues, setCurrentValues] = useState<number[]>(new Array(stats.length).fill(0))
  const observerRef = useRef<IntersectionObserver | null>(null)
  const statRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-index') || '0')
          if (entry.isIntersecting && !visibleStats[index]) {
            setVisibleStats(prev => {
              const newVisible = [...prev]
              newVisible[index] = true
              return newVisible
            })
          }
        })
      },
      { threshold: 0.3 }
    )

    statRefs.current.forEach((ref) => {
      if (ref) observerRef.current?.observe(ref)
    })

    return () => {
      observerRef.current?.disconnect()
    }
  }, [visibleStats])

  useEffect(() => {
    stats.forEach((stat, index) => {
      if (visibleStats[index]) {
        const duration = 2000 // 2 seconds
        const steps = 60
        const stepValue = stat.value / steps
        let currentStep = 0

        const interval = setInterval(() => {
          currentStep++
          const newValue = Math.min(Math.round(stepValue * currentStep), stat.value)
          
          setCurrentValues(prev => {
            const newValues = [...prev]
            newValues[index] = newValue
            return newValues
          })

          if (currentStep >= steps) {
            clearInterval(interval)
          }
        }, duration / steps)

        return () => clearInterval(interval)
      }
    })
  }, [visibleStats, stats])

  const formatNumber = (num: number, suffix?: string, prefix?: string) => {
    let formatted = num.toString()
    
    if (num >= 1000000) {
      formatted = (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      formatted = (num / 1000).toFixed(1) + 'K'
    }

    return `${prefix || ''}${formatted}${suffix || ''}`
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          ref={(el) => (statRefs.current[index] = el)}
          data-index={index}
          className={`relative p-6 rounded-2xl border border-border bg-card card-hover-modern overflow-hidden ${
            visibleStats[index] ? 'animate-scale-in-bounce' : 'opacity-0'
          }`}
        >
          {/* Background decoration */}
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full ${stat.bgColor} opacity-10 blur-2xl`} />
          
          {/* Icon */}
          <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center mb-4`}>
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>

          {/* Value */}
          <div className="mb-2">
            <div className={`text-3xl md:text-4xl font-bold stats-counter ${stat.color} stat-value-enter`}>
              {formatNumber(currentValues[index], stat.suffix, stat.prefix)}
            </div>
          </div>

          {/* Label */}
          <h3 className="text-lg font-semibold text-foreground mb-1">{stat.label}</h3>
          
          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">{stat.description}</p>

          {/* Trend indicator */}
          <div className="flex items-center gap-1 mt-3 text-xs text-important font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>Live</span>
          </div>

          {/* Animated border */}
          {visibleStats[index] && (
            <div className="absolute inset-0 rounded-2xl border-2 border-primary/20 animate-glow-pulse pointer-events-none" />
          )}
        </div>
      ))}
    </div>
  )
}

// Preset stat configurations for MailOS
export const mailOSStats: StatItem[] = [
  {
    label: 'Emails Processed',
    value: 2456789,
    suffix: '+',
    icon: Mail,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    description: 'Total emails analyzed by our AI'
  },
  {
    label: 'Active Users',
    value: 12847,
    suffix: '+',
    icon: Users,
    color: 'text-important',
    bgColor: 'bg-important/10',
    description: 'Professionals saving time daily'
  },
  {
    label: 'Hours Saved',
    value: 45234,
    suffix: '+',
    icon: Clock,
    color: 'text-accent-amber',
    bgColor: 'bg-accent-amber/10',
    description: 'Collective time reclaimed'
  },
  {
    label: 'Accuracy Rate',
    value: 98.7,
    suffix: '%',
    icon: TrendingUp,
    color: 'text-accent-emerald',
    bgColor: 'bg-accent-emerald/10',
    description: 'AI classification accuracy'
  }
]
