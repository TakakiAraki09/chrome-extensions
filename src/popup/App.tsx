import React, { useState, useEffect } from 'react'

interface HistoryItem extends chrome.history.HistoryItem {}

export const App: React.FC = () => {
  const [dateRange, setDateRange] = useState('7')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [showCustomDate, setShowCustomDate] = useState(false)

  useEffect(() => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    setEndDate(formatDateTimeLocal(now))
    setStartDate(formatDateTimeLocal(weekAgo))
    
    fetchHistory()
  }, [])

  useEffect(() => {
    setShowCustomDate(dateRange === 'custom')
  }, [dateRange])

  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const escapeHtml = (text: string): string => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  const fetchHistory = async () => {
    setIsLoading(true)
    
    let startTime: number
    let endTime: number = Date.now()
    
    if (dateRange === 'custom') {
      startTime = new Date(startDate).getTime()
      endTime = new Date(endDate).getTime()
    } else {
      const days = parseInt(dateRange)
      startTime = Date.now() - days * 24 * 60 * 60 * 1000
    }
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getHistory',
        startTime,
        endTime,
        maxResults: 200
      })
      
      setHistoryItems(response.history || [])
    } catch (error) {
      console.error('Error fetching history:', error)
      setHistoryItems([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div id="app">
      <h1>Browser History</h1>
      
      <div className="date-controls">
        <label>
          Date Range:
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        
        {showCustomDate && (
          <div id="customDateInputs">
            <label>
              From:
              <input 
                type="datetime-local" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label>
              To:
              <input 
                type="datetime-local" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
          </div>
        )}
        
        <button onClick={fetchHistory} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Fetch History'}
        </button>
      </div>
      
      <div id="historyList">
        {isLoading ? (
          <p>Loading history...</p>
        ) : historyItems.length === 0 ? (
          <p>No history items found for the selected period.</p>
        ) : (
          <>
            <p className="summary">Found {historyItems.length} history items</p>
            {historyItems.map((item, index) => {
              const date = new Date(item.lastVisitTime || 0)
              const dateStr = date.toLocaleString()
              const visitCount = item.visitCount || 0
              
              return (
                <div key={index} className="history-item">
                  <h3>{item.title || 'No title'}</h3>
                  <p className="url">{item.url || ''}</p>
                  <p className="metadata">
                    <span>Visited: {dateStr}</span>
                    <span>Visit count: {visitCount}</span>
                  </p>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}