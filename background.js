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
  updateBadge();
}

function updateDeclarativeNetRequestRules() {
  chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
    const existingRuleIds = existingRules.map(rule => rule.id);

    const newRules = filters.map((filter, index) => ({
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
      removeRuleIds: existingRuleIds,
      addRules: newRules
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error updating rules:', chrome.runtime.lastError);
      } else {
        console.log('Rules updated successfully');
      }
    });
  });
}

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
  addUrl(info.request.url);
});

function updateBadge() {
  chrome.action.setBadgeText({text: urlList.length.toString()});
  chrome.action.setBadgeBackgroundColor({color: '#FF0000'});
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getUrlList':
      sendResponse({ urlList });
      break;
    case 'clearUrlList':
      urlList = [];
      chrome.storage.local.set({ urlList });
      updateBadge();
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

updateBadge();
