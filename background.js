let urlList = [];
let filters = [];

chrome.storage.local.get(['urlList', 'filters'], (result) => {
  urlList = result.urlList || [];
  filters = result.filters || [];
  updateDeclarativeNetRequestRules();
});

function addUrl(url) {
  urlList.push({
    url: url,
    timestamp: new Date().toISOString()
  });
  chrome.storage.local.set({ urlList });
  updateBadge(); // Update badge after adding a URL
}

function updateDeclarativeNetRequestRules() {
  const rules = filters.map((filter, index) => ({
    id: index + 1,
    priority: 1,
    action: {
      type: 'allow'
    },
    condition: {
      urlFilter: filter.hostname,
      resourceTypes: ['main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'font', 'object', 'xmlhttprequest', 'ping', 'csp_report', 'media', 'websocket', 'other']
    }
  }));

  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: rules.map(rule => rule.id),
    addRules: rules
  });
}

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
  addUrl(info.request.url);
});

function updateBadge() {
  chrome.action.setBadgeText({text: urlList.length.toString()});
  chrome.action.setBadgeBackgroundColor({color: '#FF0000'}); // Red color
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getUrlList':
      sendResponse({ urlList });
      break;
    case 'clearUrlList':
      urlList = [];
      chrome.storage.local.set({ urlList });
      updateBadge(); // Update badge after clearing the list
      sendResponse({ success: true });
      break;
    case 'getFilters':
      sendResponse({ filters });
      break;
    case 'addFilter':
      filters.push(request.filter);
      chrome.storage.local.set({ filters });
      updateDeclarativeNetRequestRules();
      sendResponse({ success: true });
      break;
    case 'updateFilter':
      filters[request.index] = request.filter;
      chrome.storage.local.set({ filters });
      updateDeclarativeNetRequestRules();
      sendResponse({ success: true });
      break;
    case 'deleteFilter':
      filters.splice(request.index, 1);
      chrome.storage.local.set({ filters });
      updateDeclarativeNetRequestRules();
      sendResponse({ success: true });
      break;
  }
  return true;
});

// Initial badge update
updateBadge();
