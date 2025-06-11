import React from 'react'
import { InterestScore } from '../types'
import { formatDate } from '../utils/formatters'

interface InterestScoresProps {
  scores: InterestScore[]
}

interface ScoreFactorProps {
  label: string
  weight: number
  className: string
}

const ScoreFactor: React.FC<ScoreFactorProps> = ({ label, weight, className }) => (
  <div className="factor">
    <span>{label}: </span>
    <div className="progress-bar">
      <div 
        className={`progress-fill ${className}`}
        style={{ width: `${weight * 100}%` }}
      />
    </div>
    <span>{Math.round(weight * 100)}%</span>
  </div>
)

interface ScoreItemProps {
  score: InterestScore
}

const ScoreItem: React.FC<ScoreItemProps> = ({ score }) => (
  <div className="score-item">
    <div className="score-header">
      <h3>{score.domain}</h3>
      <div className="score-badge">{score.score}点</div>
    </div>
    <div className="score-details">
      <ScoreFactor label="滞在時間" weight={score.factors.timeWeight} className="time" />
      <ScoreFactor label="スクロール" weight={score.factors.scrollWeight} className="scroll" />
      <ScoreFactor label="エンゲージメント" weight={score.factors.engagementWeight} className="engagement" />
    </div>
    <p className="last-updated">
      最終更新: {formatDate(score.lastUpdated)}
    </p>
  </div>
)

export const InterestScores: React.FC<InterestScoresProps> = ({ scores }) => {
  if (scores.length === 0) {
    return (
      <div className="interest-scores">
        <h2>興味関心度ランキング</h2>
        <p>データがありません。しばらくブラウジングしてから確認してください。</p>
      </div>
    )
  }

  return (
    <div className="interest-scores">
      <h2>興味関心度ランキング</h2>
      <div className="scores-list">
        {scores.map((score, index) => (
          <ScoreItem key={index} score={score} />
        ))}
      </div>
    </div>
  )
}