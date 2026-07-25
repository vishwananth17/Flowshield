import React from 'react'
import { Card } from './Card'

interface StatCardProps {
  label: string
  value: string | number
  subtext?: string
  trend?: {
    value: number   // percentage change
    label?: string
  }
  icon?: React.ReactNode
  variant?: 'default' | 'gold' | 'danger' | 'success'
  loading?: boolean
}

export function StatCard({
  label, value, subtext, trend, icon,
  variant = 'default', loading = false
}: StatCardProps) {

  const isPositive = trend && trend.value > 0
  const isNegative = trend && trend.value < 0

  const variantStyles = {
    default: '',
    gold:    'border-[var(--border-gold)] shadow-[var(--shadow-gold)]',
    danger:  'border-[var(--color-danger-border)]',
    success: 'border-[var(--color-success-border)]',
  }

  const valueColor = {
    default: 'text-[var(--text-primary)]',
    gold:    'text-[var(--text-gold)]',
    danger:  'text-[var(--color-danger)]',
    success: 'text-[var(--color-success)]',
  }

  if (loading) {
    return (
      <div className="
        rounded-[var(--radius-lg)] p-6
        bg-[var(--bg-surface)] border border-[var(--border-default)]
        animate-pulse
      ">
        <div className="h-4 w-24 bg-[var(--bg-elevated)] rounded mb-4" />
        <div className="h-8 w-32 bg-[var(--bg-elevated)] rounded mb-2" />
        <div className="h-3 w-20 bg-[var(--bg-elevated)] rounded" />
      </div>
    )
  }

  return (
    <Card
      variant="default"
      className={`
        relative overflow-hidden group
        hover:border-[var(--border-gold)]
        hover:shadow-[var(--shadow-gold)]
        transition-all duration-300
        ${variantStyles[variant]}
      `}
    >
      {/* Background glow on hover */}
      <div className="
        absolute inset-0 opacity-0 group-hover:opacity-100
        transition-opacity duration-300
        bg-[var(--gradient-card)]
        pointer-events-none
      " />

      <div className="relative z-10">
        {/* Label + Icon row */}
        <div className="flex items-center justify-between mb-4">
          <span className="
            text-xs font-semibold uppercase tracking-widest
            text-[var(--text-muted)]
          ">
            {label}
          </span>
          {icon && (
            <div className="
              w-9 h-9 rounded-[var(--radius-md)]
              bg-[var(--color-primary-muted)]
              border border-[var(--color-primary-border)]
              flex items-center justify-center
              text-[var(--text-gold)]
            ">
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <div className={`
          text-3xl font-bold leading-none mb-2
          font-[var(--font-display)]
          tracking-[var(--tracking-tight)]
          ${valueColor[variant]}
        `}>
          {value}
        </div>

        {/* Subtext + Trend */}
        <div className="flex items-center gap-2 flex-wrap">
          {subtext && (
            <span className="text-xs text-[var(--text-muted)]">
              {subtext}
            </span>
          )}
          {trend && (
            <span className={`
              text-xs font-semibold flex items-center gap-0.5
              ${isPositive ? 'text-[var(--color-success)]' : ''}
              ${isNegative ? 'text-[var(--color-danger)]' : ''}
              ${!isPositive && !isNegative ? 'text-[var(--text-muted)]' : ''}
            `}>
              {isPositive ? '↑' : isNegative ? '↓' : '→'}
              {Math.abs(trend.value)}%
              {trend.label && (
                <span className="text-[var(--text-muted)] font-normal ml-1">
                  {trend.label}
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}

export default StatCard
