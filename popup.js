document.addEventListener('DOMContentLoaded', () => {
  const urlList = document.getElementById('urlList');
  const filterList = document.getElementById('filterList');
  const clearListBtn = document.getElementById('clearList');
  const filterForm = document.getElementById('filterForm');
  const hostnameInput = document.getElementById('hostname');
  const protocolSelect = document.getElementById('protocol');

  function updateUrlList() {
    chrome.runtime.sendMessage({ action: 'getUrlList' }, (response) => {
      urlList.innerHTML = '';
      if (response.urlList.length === 0) {
        const li = document.createElement('li');
        li.className = 'list-group-item text-muted';
        li.textContent = 'No URLs. Please refresh the page to start searching.';
        urlList.appendChild(li);
      } else {
        response.urlList.forEach((item) => {
          const li = document.createElement('li');
          li.className = 'list-group-item';
          li.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
              <span class="url-text" title="${item.url}">
                <i class="bi bi-chevron-right me-2 toggle-icon"></i>
                <i class="bi bi-clipboard me-2 copy-icon" title="Copy full URL"></i>
                ${item.url}
              </span>
              <small class="text-muted">${new Date(item.timestamp).toLocaleTimeString()}</small>
            </div>
            <div class="url-details mt-2" style="display: none;"></div>
          `;
          const toggleIcon = li.querySelector('.toggle-icon');
          const detailsDiv = li.querySelector('.url-details');
          const copyIcon = li.querySelector('.copy-icon');
          
          li.addEventListener('click', (e) => {
            if (!e.target.closest('.copy-icon')) {
              toggleUrlDetails(item.url, detailsDiv, toggleIcon);
            }
          });
          
          copyIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(item.url);
            copyIcon.classList.remove('bi-clipboard');
            copyIcon.classList.add('bi-check2');
            setTimeout(() => {
              copyIcon.classList.remove('bi-check2');
              copyIcon.classList.add('bi-clipboard');
            }, 2000);
          });
          
          urlList.appendChild(li);
        });
      }
    });
  }

  function updateFilterList() {
    chrome.runtime.sendMessage({ action: 'getFilters' }, (response) => {
      filterList.innerHTML = '';
      if (response.filters && response.filters.length > 0) {
        response.filters.forEach((filter, index) => {
          const li = document.createElement('li');
          li.className = 'list-group-item d-flex justify-content-between align-items-center';
          
          const filterText = document.createElement('span');
          if (filter.protocol === 'All') {
            filterText.textContent = filter.hostname;
          } else {
            filterText.innerHTML = `<span class="text-muted">${filter.protocol}://</span>${filter.hostname}`;
          }
          li.appendChild(filterText);
          
          const btnGroup = document.createElement('div');
          btnGroup.className = 'btn-group';
          
          const editBtn = document.createElement('button');
          editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
          editBtn.className = 'btn btn-sm btn-primary';
          editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            editFilter(index, filter);
          });
          
          const deleteBtn = document.createElement('button');
          deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
          deleteBtn.className = 'btn btn-sm btn-danger';
          deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteFilter(index);
          });
          
          btnGroup.appendChild(editBtn);
          btnGroup.appendChild(deleteBtn);
          li.appendChild(btnGroup);
          filterList.appendChild(li);
        });
      } else {
        const li = document.createElement('li');
        li.className = 'list-group-item text-muted';
        li.textContent = 'No filters added yet';
        filterList.appendChild(li);
      }
    });
  }

  function toggleUrlDetails(urlString, detailsDiv, toggleIcon) {
    if (detailsDiv.style.display === 'none' || detailsDiv.style.display === '') {
      const url = new URL(urlString);
      const queryParams = Array.from(url.searchParams.entries());

      let details = {};

      if (url.protocol) {
        details['Protocol'] = url.protocol.slice(0, -1);
      }

      if (url.hostname) {
        details['Hostname'] = url.hostname;
      }

      if (url.pathname && url.pathname !== '/') {
        details['Path'] = url.pathname;
      }

      if (queryParams.length > 0) {
        details['Query Parameters'] = '<ul class="list-unstyled mb-0">' + 
          queryParams.map(([key, value]) => 
            `<li><strong>${key}:</strong> <code>${decodeURIComponent(value)}</code> <i class="bi bi-clipboard copy-btn" data-clipboard-text="${decodeURIComponent(value)}"></i></li>`
          ).join('') + 
        '</ul>';
      }

      if (url.hash) {
        details['Fragment'] = url.hash;
      }

      detailsDiv.innerHTML = Object.entries(details).map(([key, value]) => `
        <div class="mb-2">
          <strong>${key}:</strong> 
          ${typeof value === 'string' && !value.startsWith('<ul') ? `<code>${value}</code>` : value}
          ${typeof value === 'string' && !value.startsWith('<ul') ? `<i class="bi bi-clipboard copy-btn" data-clipboard-text="${value}"></i>` : ''}
        </div>
      `).join('');
      
      detailsDiv.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(btn.dataset.clipboardText);
          btn.classList.remove('bi-clipboard');
          btn.classList.add('bi-check2');
          setTimeout(() => {
            btn.classList.remove('bi-check2');
            btn.classList.add('bi-clipboard');
          }, 2000);
        });
      });
      
      detailsDiv.style.display = 'block';
      toggleIcon.classList.remove('bi-chevron-right');
      toggleIcon.classList.add('bi-chevron-down');
    } else {
      detailsDiv.style.display = 'none';
      toggleIcon.classList.remove('bi-chevron-down');
      toggleIcon.classList.add('bi-chevron-right');
    }
  }

  function editFilter(index, filter) {
    hostnameInput.value = filter.hostname;
    protocolSelect.value = filter.protocol;
    filterForm.dataset.editIndex = index;
    filterForm.querySelector('button[type="submit"]').textContent = 'Update';
  }

  function deleteFilter(index) {
    chrome.runtime.sendMessage({ action: 'deleteFilter', index }, () => {
      updateFilterList();
    });
  }

  clearListBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'clearUrlList' }, () => {
      updateUrlList();
      updateClearListButtonVisibility();
    });
  });

  filterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const filter = {
      hostname: hostnameInput.value,
      protocol: protocolSelect.value
    };
    const editIndex = filterForm.dataset.editIndex;
    if (editIndex !== undefined) {
      chrome.runtime.sendMessage({ action: 'updateFilter', index: parseInt(editIndex), filter }, () => {
        updateFilterList();
        filterForm.reset();
        delete filterForm.dataset.editIndex;
        filterForm.querySelector('button[type="submit"]').textContent = 'Add';
      });
    } else {
      chrome.runtime.sendMessage({ action: 'addFilter', filter }, () => {
        updateFilterList();
        filterForm.reset();
      });
    }
  });

  updateUrlList();
  updateFilterList();
  updateClearListButtonVisibility();
});

function showDetailView(url) {
  mainScrollPosition = window.scrollY;

  const detailContent = document.getElementById('detailContent');
  const urlObj = new URL(url);
  const queryParams = Array.from(urlObj.searchParams.entries());

  let detailHtml = '';

  if (urlObj.protocol) {
    detailHtml += `<div><strong>Protocol:</strong> <code>${urlObj.protocol.slice(0, -1)}</code> <i class="bi bi-clipboard copy-btn" data-clipboard-text="${urlObj.protocol.slice(0, -1)}"></i></div>`;
  }

  if (urlObj.hostname) {
    detailHtml += `<div><strong>Hostname:</strong> <code>${urlObj.hostname}</code> <i class="bi bi-clipboard copy-btn" data-clipboard-text="${urlObj.hostname}"></i></div>`;
  }

  if (urlObj.pathname && urlObj.pathname !== '/') {
    detailHtml += `<div><strong>Path:</strong> <code>${urlObj.pathname}</code> <i class="bi bi-clipboard copy-btn" data-clipboard-text="${urlObj.pathname}"></i></div>`;
  }

  if (queryParams.length > 0) {
    detailHtml += '<div><strong>Query Parameters:</strong><ul>';
    queryParams.forEach(([key, value]) => {
      const decodedValue = decodeURIComponent(value);
      detailHtml += `
        <li class="query-param">
          <strong>${key}:</strong> <code>${decodedValue}</code> <i class="bi bi-clipboard copy-btn" data-clipboard-text="${decodedValue}"></i>
        </li>
      `;
    });
    detailHtml += '</ul></div>';
  }

  if (urlObj.hash) {
    detailHtml += `<div><strong>Fragment:</strong> <code>${urlObj.hash}</code> <i class="bi bi-clipboard copy-btn" data-clipboard-text="${urlObj.hash}"></i></div>`;
  }

  detailContent.innerHTML = detailHtml;

  // Add event listeners for copy buttons
  detailContent.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      navigator.clipboard.writeText(e.target.dataset.clipboardText);
      e.target.classList.remove('bi-clipboard');
      e.target.classList.add('bi-check2');
      setTimeout(() => {
        e.target.classList.remove('bi-check2');
        e.target.classList.add('bi-clipboard');
      }, 2000);
    });
  });

  document.querySelector('.slide-container').style.transform = 'translateX(-50%)';
  document.querySelector('.detail-view').classList.remove('hidden');
  
  // Use requestAnimationFrame to ensure the scroll happens in the next paint cycle
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
  });
}

function hideDetailView() {
  document.querySelector('.slide-container').style.transform = 'translateX(0)';
  document.querySelector('.detail-view').classList.add('hidden');
  
  // Use requestAnimationFrame to ensure the scroll happens in the next paint cycle
  requestAnimationFrame(() => {
    window.scrollTo(0, mainScrollPosition);
  });
}

let mainScrollPosition = 0;

function initializePopup() {
  mainScrollPosition = 0;
  window.scrollTo(0, 0);

  // Add event listeners for scroll position
  window.addEventListener('scroll', () => {
    const detailView = document.querySelector('.detail-view');
    if (detailView && detailView.classList.contains('hidden')) {
      mainScrollPosition = window.scrollY;
    }
  });
}

// Call initializePopup when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializePopup);

function updateClearListButtonVisibility() {
  const clearListBtn = document.getElementById('clearList');
  chrome.runtime.sendMessage({ action: 'getUrlList' }, (response) => {
    clearListBtn.style.display = response.urlList.length > 0 ? 'block' : 'none';
  });
}
