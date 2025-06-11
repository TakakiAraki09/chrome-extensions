export interface BrowsingActivity {
  url: string
  title: string
  domain: string
  startTime: number
  endTime?: number
  scrollDepth: number
  maxScrollDepth: number
  totalScrollDistance: number
  focusTime: number
  idleTime: number
}

export interface InterestScore {
  domain: string
  url?: string
  score: number
  factors: {
    timeWeight: number
    scrollWeight: number
    engagementWeight: number
  }
  lastUpdated: number
}