export class NavigationHandler {
  private currentUrl: string
  private onNavigationCallback: () => void
  private observer: MutationObserver

  constructor(onNavigation: () => void) {
    this.currentUrl = window.location.href
    this.onNavigationCallback = onNavigation
    this.observer = this.createObserver()
    this.init()
  }

  private init() {
    this.setupEventListeners()
    this.observer.observe(document, { childList: true, subtree: true })
  }

  private createObserver(): MutationObserver {
    return new MutationObserver(() => {
      if (document.readyState === 'complete') {
        this.checkUrlChange()
      }
    })
  }

  private setupEventListeners() {
    window.addEventListener('popstate', this.handleUrlChange)
    this.interceptHistoryMethods()
  }

  private interceptHistoryMethods() {
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = (...args) => {
      originalPushState.apply(history, args)
      setTimeout(() => this.handleUrlChange(), 0)
    }

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args)
      setTimeout(() => this.handleUrlChange(), 0)
    }
  }

  private handleUrlChange = () => {
    this.checkUrlChange()
  }

  private checkUrlChange() {
    if (window.location.href !== this.currentUrl) {
      this.currentUrl = window.location.href
      this.onNavigationCallback()
    }
  }

  destroy() {
    window.removeEventListener('popstate', this.handleUrlChange)
    this.observer.disconnect()
  }
}