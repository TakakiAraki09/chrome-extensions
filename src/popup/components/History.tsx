import React from 'react'
import { HistoryItem } from '../types'
import { formatFullDate } from '../utils/formatters'

interface HistoryProps {
  items: HistoryItem[]
}

interface HistoryItemComponentProps {
  item: HistoryItem
}

const HistoryItemComponent: React.FC<HistoryItemComponentProps> = ({ item }) => {
  const visitCount = item.visitCount || 0
  
  return (
    <div className="history-item">
      <h3>{item.title || 'No title'}</h3>
      <p className="url">{item.url || ''}</p>
      <p className="metadata">
        <span>訪問日時: {formatFullDate(item.lastVisitTime)}</span>
        <span>訪問回数: {visitCount}回</span>
      </p>
    </div>
  )
}

export const History: React.FC<HistoryProps> = ({ items }) => {
  if (items.length === 0) {
    return (
      <div className="history">
        <h2>履歴</h2>
        <p>No history items found for the selected period.</p>
      </div>
    )
  }

  return (
    <div className="history">
      <h2>履歴</h2>
      <p className="summary">Found {items.length} history items</p>
      {items.map((item, index) => (
        <HistoryItemComponent key={index} item={item} />
      ))}
    </div>
  )
}