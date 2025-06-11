import { BrowsingActivity, InterestScore } from '../types'

export interface DatabaseSchema {
  browsingActivities: BrowsingActivity & { id?: number }
  interestScores: InterestScore & { id?: number }
}

export interface QueryOptions {
  domain?: string
  startTime?: number
  endTime?: number
  limit?: number
}

export class IndexedDBManager {
  private dbName = 'BrowsingTracker'
  private version = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        this.createStores(db)
      }
    })
  }

  private createStores(db: IDBDatabase): void {
    if (!db.objectStoreNames.contains('browsingActivities')) {
      const activityStore = db.createObjectStore('browsingActivities', { 
        keyPath: 'id', 
        autoIncrement: true 
      })
      activityStore.createIndex('domain', 'domain', { unique: false })
      activityStore.createIndex('url', 'url', { unique: false })
      activityStore.createIndex('startTime', 'startTime', { unique: false })
    }
    
    if (!db.objectStoreNames.contains('interestScores')) {
      const scoreStore = db.createObjectStore('interestScores', { 
        keyPath: 'id', 
        autoIncrement: true 
      })
      scoreStore.createIndex('domain', 'domain', { unique: false })
      scoreStore.createIndex('score', 'score', { unique: false })
    }
  }

  async saveBrowsingActivity(activity: BrowsingActivity): Promise<number> {
    if (!this.db) throw new Error('Database not initialized')
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['browsingActivities'], 'readwrite')
      const store = transaction.objectStore('browsingActivities')
      const request = store.add(activity)
      
      request.onsuccess = () => resolve(request.result as number)
      request.onerror = () => reject(request.error)
    })
  }

  async updateInterestScore(score: InterestScore): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['interestScores'], 'readwrite')
      const store = transaction.objectStore('interestScores')
      const index = store.index('domain')
      const request = index.get(score.domain)
      
      request.onsuccess = () => {
        const existing = request.result
        if (existing) {
          const updateRequest = store.put({ ...score, id: existing.id })
          updateRequest.onsuccess = () => resolve()
          updateRequest.onerror = () => reject(updateRequest.error)
        } else {
          const addRequest = store.add(score)
          addRequest.onsuccess = () => resolve()
          addRequest.onerror = () => reject(addRequest.error)
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  async getBrowsingActivities(options: QueryOptions = {}): Promise<BrowsingActivity[]> {
    if (!this.db) throw new Error('Database not initialized')
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['browsingActivities'], 'readonly')
      const store = transaction.objectStore('browsingActivities')
      
      let request: IDBRequest
      
      if (options.domain) {
        const index = store.index('domain')
        request = index.getAll(options.domain)
      } else {
        request = store.getAll()
      }
      
      request.onsuccess = () => {
        let results = request.result as BrowsingActivity[]
        
        if (options.startTime || options.endTime) {
          results = results.filter(activity => {
            if (options.startTime && activity.startTime < options.startTime) return false
            if (options.endTime && activity.startTime > options.endTime) return false
            return true
          })
        }
        
        results.sort((a, b) => b.startTime - a.startTime)
        
        if (options.limit) {
          results = results.slice(0, options.limit)
        }
        
        resolve(results)
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  async getInterestScores(): Promise<InterestScore[]> {
    if (!this.db) throw new Error('Database not initialized')
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['interestScores'], 'readonly')
      const store = transaction.objectStore('interestScores')
      const request = store.getAll()
      
      request.onsuccess = () => {
        const results = request.result as InterestScore[]
        results.sort((a, b) => b.score - a.score)
        resolve(results)
      }
      
      request.onerror = () => reject(request.error)
    })
  }
}