import { TimeMetrics } from '../types'

export class TimeTracker {
  private metrics: TimeMetrics
  private isActive = true
  private isVisible = true

  constructor() {
    const now = Date.now()
    this.metrics = {
      startTime: now,
      focusTime: 0,
      idleTime: 0,
      lastActivity: now
    }
  }

  updateVisibility(visible: boolean) {
    const now = Date.now()
    
    if (!visible && this.isVisible && this.isActive) {
      this.metrics.focusTime += now - this.metrics.lastActivity
    } else if (visible && !this.isVisible) {
      this.metrics.lastActivity = now
    }
    
    this.isVisible = visible
  }

  markActive() {
    if (!this.isActive && this.isVisible) {
      const now = Date.now()
      this.metrics.idleTime += now - this.metrics.lastActivity
      this.metrics.lastActivity = now
    }
    this.isActive = true
  }

  markIdle() {
    if (this.isActive && this.isVisible) {
      const now = Date.now()
      this.metrics.focusTime += now - this.metrics.lastActivity
      this.metrics.lastActivity = now
    }
    this.isActive = false
  }

  updateActivity() {
    if (this.isVisible && this.isActive) {
      this.metrics.lastActivity = Date.now()
    }
  }

  finalize() {
    const now = Date.now()
    if (this.isVisible && this.isActive) {
      this.metrics.focusTime += now - this.metrics.lastActivity
    }
  }

  getMetrics(): TimeMetrics {
    return { ...this.metrics }
  }
}