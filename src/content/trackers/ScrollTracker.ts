import { ScrollMetrics } from '../types'

export class ScrollTracker {
  private metrics: ScrollMetrics = {
    depth: 0,
    maxDepth: 0,
    totalDistance: 0
  }
  private lastScrollY = window.scrollY
  private onUpdateCallback: () => void

  constructor(onUpdate: () => void) {
    this.onUpdateCallback = onUpdate
    this.init()
  }

  private init() {
    this.attachEventListeners()
    this.calculateInitialDepth()
  }

  private attachEventListeners() {
    window.addEventListener('scroll', this.handleScroll, { passive: true })
    document.addEventListener('wheel', this.onUpdateCallback, { passive: true })
    document.addEventListener('touchmove', this.onUpdateCallback, { passive: true })
  }

  private handleScroll = () => {
    const currentScrollY = window.scrollY
    const scrollDistance = Math.abs(currentScrollY - this.lastScrollY)
    
    this.metrics.totalDistance += scrollDistance
    
    const scrollDepth = this.calculateScrollDepth()
    this.metrics.depth = scrollDepth
    this.metrics.maxDepth = Math.max(this.metrics.maxDepth, scrollDepth)
    
    this.onUpdateCallback()
    this.lastScrollY = currentScrollY
  }

  private calculateScrollDepth(): number {
    const windowHeight = window.innerHeight
    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    )
    
    return Math.min(100, Math.round((window.scrollY + windowHeight) / documentHeight * 100))
  }

  private calculateInitialDepth() {
    this.metrics.depth = this.calculateScrollDepth()
    this.metrics.maxDepth = this.metrics.depth
  }

  getMetrics(): ScrollMetrics {
    return { ...this.metrics }
  }

  destroy() {
    window.removeEventListener('scroll', this.handleScroll)
    document.removeEventListener('wheel', this.onUpdateCallback)
    document.removeEventListener('touchmove', this.onUpdateCallback)
  }
}