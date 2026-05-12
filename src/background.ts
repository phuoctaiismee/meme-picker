export {}

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, {
      name: "TOGGLE_OVERLAY"
    }).catch(err => {
      console.log("Content script not ready yet or restricted page:", err)
    })
  }
})
