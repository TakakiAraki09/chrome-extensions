export class VisibilityTracker {
  private isVisible = true
  private callbacks = {
    onVisible: () => {},
    onHidden: () => {}
  }

  constructor(onVisible: () => void, onHidden: () => void) {
    this.callbacks.onVisible = onVisible
    this.callbacks.onHidden = onHidden
    this.init()
  }

  private init() {
    this.attachEventListeners()
  }

  private attachEventListeners() {
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    window.addEventListener('focus', this.handleFocus)
    window.addEventListener('blur', this.handleBlur)
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.setVisible(false)
    } else {
      this.setVisible(true)
    }
  }

  private handleFocus = () => {
    this.setVisible(true)
  }

  private handleBlur = () => {
    this.setVisible(false)
  }

  private setVisible(visible: boolean) {
    if (this.isVisible === visible) return
    
    this.isVisible = visible
    if (visible) {
      this.callbacks.onVisible()
    } else {
      this.callbacks.onHidden()
    }
  }

  getIsVisible(): boolean {
    return this.isVisible
  }

  destroy() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    window.removeEventListener('focus', this.handleFocus)
    window.removeEventListener('blur', this.handleBlur)
  }
}