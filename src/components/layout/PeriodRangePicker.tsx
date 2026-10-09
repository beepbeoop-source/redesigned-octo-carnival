import React from 'react'
import { DateRangePicker } from '@/components/ui/date-picker'

interface PeriodRangePickerProps {
  fromDate: string
  toDate: string
  onSetPeriod: (from: string, to: string) => void
  className?: string
}

export const PeriodRangePicker: React.FC<PeriodRangePickerProps> = ({
  fromDate,
  toDate,
  onSetPeriod,
  className
}) => {
  return (
    <DateRangePicker
      fromDate={fromDate}
      toDate={toDate}
      onSetPeriod={onSetPeriod}
      className={className}
    />
  )
}

