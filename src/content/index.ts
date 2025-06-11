import { BrowsingActivity } from './types'
import { ScrollTracker } from './trackers/ScrollTracker'
import { VisibilityTracker } from './trackers/VisibilityTracker'
import { IdleTracker } from './trackers/IdleTracker'
import { TimeTracker } from './trackers/TimeTracker'

class BrowsingTracker {
  private activity: BrowsingActivity
  private scrollTracker: ScrollTracker
  private visibilityTracker: VisibilityTracker
  private idleTracker: IdleTracker
  private timeTracker: TimeTracker
  private saveTimer?: number
  
  private readonly IDLE_THRESHOLD = 30000 // 30 seconds
  private readonly SAVE_INTERVAL = 10000 // 10 seconds

  constructor() {
    this.activity = this.createInitialActivity()
    this.timeTracker = new TimeTracker()
    
    this.scrollTracker = new ScrollTracker(() => this.onUserActivity())
    this.visibilityTracker = new VisibilityTracker(
      () => this.onVisible(),
      () => this.onHidden()
    )
    this.idleTracker = new IdleTracker(
      this.IDLE_THRESHOLD,
      () => this.onIdle(),
      () => this.onActive()
    )
    
    this.startPeriodicSave()
  }

  private createInitialActivity(): BrowsingActivity {
    return {
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname,
      startTime: Date.now(),
      scrollDepth: 0,
      maxScrollDepth: 0,
      totalScrollDistance: 0,
      focusTime: 0,
      idleTime: 0
    }
  }

  private onUserActivity() {
    this.timeTracker.updateActivity()
  }

  private onVisible() {
    this.timeTracker.updateVisibility(true)
  }

  private onHidden() {
    this.timeTracker.updateVisibility(false)
  }

  private onIdle() {
    this.timeTracker.markIdle()
  }

  private onActive() {
    this.timeTracker.markActive()
  }

  private startPeriodicSave() {
    this.saveTimer = window.setInterval(() => {
      this.saveCurrentActivity()
    }, this.SAVE_INTERVAL)
  }

  private saveCurrentActivity() {
    this.timeTracker.finalize()
    const scrollMetrics = this.scrollTracker.getMetrics()
    const timeMetrics = this.timeTracker.getMetrics()

    this.activity = {
      ...this.activity,
      scrollDepth: scrollMetrics.depth,
      maxScrollDepth: scrollMetrics.maxDepth,
      totalScrollDistance: scrollMetrics.totalDistance,
      focusTime: timeMetrics.focusTime,
      idleTime: timeMetrics.idleTime
    }

    chrome.runtime.sendMessage({
      action: 'saveBrowsingActivity',
      data: this.activity
    })
  }

  public destroy() {
    if (this.saveTimer) {
      clearInterval(this.saveTimer)
    }
    
    this.scrollTracker.destroy()
    this.visibilityTracker.destroy()
    this.idleTracker.destroy()
    
    this.activity.endTime = Date.now()
    this.saveCurrentActivity()
  }
}

import { NavigationHandler } from './utils/NavigationHandler'

class TrackerManager {
  private tracker: BrowsingTracker | null = null
  private navigationHandler: NavigationHandler

  constructor() {
    this.navigationHandler = new NavigationHandler(() => this.initTracker())
    this.init()
  }

  private init() {
    this.setupEventListeners()
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initTracker())
    } else {
      this.initTracker()
    }
  }

  private setupEventListeners() {
    window.addEventListener('beforeunload', () => this.cleanup())
    chrome.runtime.onMessage.addListener(this.handleMessage)
  }

  private initTracker() {
    if (this.tracker) {
      this.tracker.destroy()
    }
    this.tracker = new BrowsingTracker()
  }

  private cleanup() {
    if (this.tracker) {
      this.tracker.destroy()
    }
  }

  private handleMessage = (request: any, sender: chrome.runtime.MessageSender, sendResponse: Function) => {
    if (request.action === 'buttonClicked') {
      console.log('Button was clicked in popup')
      this.flashBackground()
    }
  }

  private flashBackground() {
    const originalColor = document.body.style.backgroundColor
    document.body.style.backgroundColor = '#f0f0f0'
    setTimeout(() => {
      document.body.style.backgroundColor = originalColor
    }, 1000)
  }

  destroy() {
    this.cleanup()
    this.navigationHandler.destroy()
  }
}

const trackerManager = new TrackerManager()