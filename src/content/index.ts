console.log('Content script loaded')

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'buttonClicked') {
    console.log('Button was clicked in popup')
    document.body.style.backgroundColor = '#f0f0f0'
    setTimeout(() => {
      document.body.style.backgroundColor = ''
    }, 1000)
  }
})