import React, { useState, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/ja'
import { ViewMode } from './types'
import { formatDateTimeLocal } from './utils/formatters'
import { useBrowsingData } from './hooks/useBrowsingData'
import { TabBar } from './components/TabBar'
import { DateRangeSelector } from './components/DateRangeSelector'
import { InterestScores } from './components/InterestScores'
import { BrowsingActivities } from './components/BrowsingActivities'
import { History } from './components/History'
import { Loading } from './components/Loading'

dayjs.locale('ja')

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('interests')
  const [dateRange, setDateRange] = useState('7')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    setEndDate(formatDateTimeLocal(now))
    setStartDate(formatDateTimeLocal(weekAgo))
  }, [])

  const timeRange = useMemo(() => {
    if (dateRange === 'custom') {
      return {
        startTime: new Date(startDate).getTime(),
        endTime: new Date(endDate).getTime()
      }
    }
    
    const days = parseInt(dateRange)
    return {
      startTime: Date.now() - days * 24 * 60 * 60 * 1000,
      endTime: Date.now()
    }
  }, [dateRange, startDate, endDate])

  const {
    isLoading,
    interestScores,
    browsingActivities,
    historyItems,
    refresh
  } = useBrowsingData(viewMode, timeRange)

  const showDateControls = viewMode === 'activities' || viewMode === 'history'

  return (
    <div id="app">
      <header>
        <h1>ブラウジング分析</h1>
        <TabBar activeTab={viewMode} onTabChange={setViewMode} />
      </header>

      {showDateControls && (
        <DateRangeSelector
          dateRange={dateRange}
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={setDateRange}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onRefresh={refresh}
          isLoading={isLoading}
        />
      )}

      <main>
        {isLoading ? (
          <Loading />
        ) : (
          <>
            {viewMode === 'interests' && <InterestScores scores={interestScores} />}
            {viewMode === 'activities' && <BrowsingActivities activities={browsingActivities} />}
            {viewMode === 'history' && <History items={historyItems} />}
          </>
        )}
      </main>
    </div>
  )
}
