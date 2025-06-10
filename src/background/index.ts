chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed')
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request)
  
  if (request.action === 'getTabInfo') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ tab: tabs[0] })
    })
    return true
  }
  
  if (request.action === 'getHistory') {
    const { startTime, endTime, maxResults = 100 } = request
    
    chrome.history.search({
      text: '',
      startTime: startTime || Date.now() - 7 * 24 * 60 * 60 * 1000, // default: 1 week ago
      endTime: endTime || Date.now(),
      maxResults: maxResults
    }, (historyItems) => {
      const sortedHistory = historyItems.sort((a, b) => {
        return (b.lastVisitTime || 0) - (a.lastVisitTime || 0)
      })
      sendResponse({ history: sortedHistory })
    })
    return true
  }
})