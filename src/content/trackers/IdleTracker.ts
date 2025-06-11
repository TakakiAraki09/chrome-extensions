export class IdleTracker {
  private idleTimer?: number
  private idleThreshold: number
  private onIdleCallback: () => void
  private onActiveCallback: () => void

  constructor(
    idleThreshold: number,
    onIdle: () => void,
    onActive: () => void
  ) {
    this.idleThreshold = idleThreshold
    this.onIdleCallback = onIdle
    this.onActiveCallback = onActive
    this.init()
  }

  private init() {
    this.attachEventListeners()
    this.resetIdleTimer()
  }

  private attachEventListeners() {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ]
    
    events.forEach(event => {
      document.addEventListener(event, this.handleActivity, { passive: true })
    })
  }

  private handleActivity = () => {
    this.onActiveCallback()
    this.resetIdleTimer()
  }

  private resetIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
    }
    
    this.idleTimer = window.setTimeout(() => {
      this.onIdleCallback()
    }, this.idleThreshold)
  }

  destroy() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
    }
    
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ]
    
    events.forEach(event => {
      document.removeEventListener(event, this.handleActivity)
    })
  }
}