import React from 'react'
import { BrowsingActivity } from '../types'
import { formatDuration, formatDate } from '../utils/formatters'

interface BrowsingActivitiesProps {
  activities: BrowsingActivity[]
}

interface ActivityStatProps {
  label: string
  value: string | number
  unit?: string
}

const ActivityStat: React.FC<ActivityStatProps> = ({ label, value, unit = '' }) => (
  <div className="stat">
    <span className="label">{label}:</span>
    <span className="value">{value}{unit}</span>
  </div>
)

interface ActivityItemProps {
  activity: BrowsingActivity
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const totalTime = activity.focusTime + activity.idleTime
  const engagementRate = totalTime > 0 ? (activity.focusTime / totalTime) * 100 : 0

  return (
    <div className="activity-item">
      <h3>{activity.title}</h3>
      <p className="url">{activity.url}</p>
      <div className="activity-stats">
        <ActivityStat label="滞在時間" value={formatDuration(activity.focusTime)} />
        <ActivityStat label="最大スクロール" value={activity.maxScrollDepth} unit="%" />
        <ActivityStat label="スクロール距離" value={Math.round(activity.totalScrollDistance)} unit="px" />
        <ActivityStat label="エンゲージメント率" value={Math.round(engagementRate)} unit="%" />
      </div>
      <p className="timestamp">
        {formatDate(activity.startTime)}
        {activity.endTime && ` - ${formatDate(activity.endTime)}`}
      </p>
    </div>
  )
}

export const BrowsingActivities: React.FC<BrowsingActivitiesProps> = ({ activities }) => {
  if (activities.length === 0) {
    return (
      <div className="browsing-activities">
        <h2>ブラウジング活動</h2>
        <p>期間内のデータがありません。</p>
      </div>
    )
  }

  return (
    <div className="browsing-activities">
      <h2>ブラウジング活動</h2>
      <div className="activities-list">
        {activities.map((activity, index) => (
          <ActivityItem key={index} activity={activity} />
        ))}
      </div>
    </div>
  )
}