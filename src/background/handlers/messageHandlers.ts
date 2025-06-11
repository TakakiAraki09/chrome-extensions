import { IndexedDBManager } from '../db/IndexedDBManager'
import { InterestCalculator } from '../services/InterestCalculator'
import { BrowsingActivity } from '../types'

type MessageHandler = (request: any, sender: chrome.runtime.MessageSender) => Promise<any>

export const createMessageHandlers = (dbManager: IndexedDBManager): Record<string, MessageHandler> => ({
  getTabInfo: async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    return { tab: tabs[0] }
  },

  getHistory: async (request) => {
    const { startTime, endTime, maxResults = 100 } = request
    
    const historyItems = await chrome.history.search({
      text: '',
      startTime: startTime || Date.now() - 7 * 24 * 60 * 60 * 1000,
      endTime: endTime || Date.now(),
      maxResults: maxResults
    })
    
    const sortedHistory = historyItems.sort((a, b) => {
      return (b.lastVisitTime || 0) - (a.lastVisitTime || 0)
    })
    
    return { history: sortedHistory }
  },

  saveBrowsingActivity: async (request) => {
    const activity: BrowsingActivity = request.data
    
    try {
      const id = await dbManager.saveBrowsingActivity(activity)
      console.log('Activity saved with ID:', id)
      
      const domainActivities = await dbManager.getBrowsingActivities({
        domain: activity.domain,
        startTime: Date.now() - 7 * 24 * 60 * 60 * 1000 // Last 7 days
      })
      
      const interestScore = InterestCalculator.calculateInterestScore(domainActivities)
      const factors = InterestCalculator.getInterestFactors(domainActivities)
      
      await dbManager.updateInterestScore({
        domain: activity.domain,
        score: interestScore,
        factors,
        lastUpdated: Date.now()
      })
      
      console.log(`Interest score updated for ${activity.domain}: ${interestScore}`)
      return { success: true, id }
    } catch (error) {
      console.error('Failed to save activity:', error)
      return { success: false, error: (error as Error).message }
    }
  },

  getBrowsingData: async (request) => {
    const { domain, startTime, endTime, limit } = request
    
    try {
      const activities = await dbManager.getBrowsingActivities({ 
        domain, 
        startTime, 
        endTime, 
        limit 
      })
      return { activities }
    } catch (error) {
      console.error('Failed to get browsing data:', error)
      return { activities: [], error: (error as Error).message }
    }
  },

  getInterestScores: async () => {
    try {
      const scores = await dbManager.getInterestScores()
      return { scores }
    } catch (error) {
      console.error('Failed to get interest scores:', error)
      return { scores: [], error: (error as Error).message }
    }
  }
})

export const handleMessage = (
  handlers: Record<string, MessageHandler>,
  request: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
): boolean => {
  console.log('Message received:', request)
  
  const handler = handlers[request.action]
  if (!handler) {
    console.warn(`Unknown action: ${request.action}`)
    return false
  }
  
  handler(request, sender)
    .then(sendResponse)
    .catch(error => {
      console.error(`Error handling ${request.action}:`, error)
      sendResponse({ error: error.message })
    })
  
  return true // Indicates async response
}