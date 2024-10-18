document.addEventListener('DOMContentLoaded', () => {
  const urlList = document.getElementById('urlList');
  const filterList = document.getElementById('filterList');
  const clearListBtn = document.getElementById('clearList');
  const filterForm = document.getElementById('filterForm');
  const hostnameInput = document.getElementById('hostname');
  const protocolSelect = document.getElementById('protocol');

  function truncateUrl(url, maxLength = 50) {
    if (url.length <= maxLength) return url;
    const start = url.substr(0, maxLength / 2 - 2);
    const end = url.substr(-maxLength / 2 + 1);
    return `${start}...${end}`;
  }

  function updateUrlList() {
    chrome.runtime.sendMessage({ action: 'getUrlList' }, (response) => {
      urlList.innerHTML = '';
      response.urlList.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        const truncatedUrl = truncateUrl(item.url);
        li.innerHTML = `
          <div class="d-flex justify-content-between align-items-center">
            <span class="url-text" title="${item.url}">
              <i class="bi bi-chevron-right me-2 toggle-icon"></i>
              ${truncatedUrl}
            </span>
            <small class="text-muted">${new Date(item.timestamp).toLocaleString()}</small>
          </div>
          <div class="url-details mt-2"></div>
        `;
        const toggleIcon = li.querySelector('.toggle-icon');
        const detailsDiv = li.querySelector('.url-details');
        li.addEventListener('click', () => toggleUrlDetails(item.url, detailsDiv, toggleIcon));
        urlList.appendChild(li);
      });
    });
  }

  function updateFilterList() {
    chrome.runtime.sendMessage({ action: 'getFilters' }, (response) => {
      filterList.innerHTML = '';
      if (response.filters && response.filters.length > 0) {
        response.filters.forEach((filter, index) => {
          const li = document.createElement('li');
          li.className = 'list-group-item d-flex justify-content-between align-items-center';
          li.textContent = `${filter.hostname} (${filter.protocol})`;
          
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
      let details;
      try {
        const url = new URL(urlString);
        details = {
          Protocol: url.protocol.slice(0, -1),
          Hostname: url.hostname,
          Path: url.pathname,
          'Query Strings': Object.fromEntries(url.searchParams.entries()),
          Segment: url.hash
        };
      } catch (error) {
        details = {
          Error: 'Invalid URL',
          'Raw URL': urlString
        };
      }
      
      detailsDiv.innerHTML = Object.entries(details).map(([key, value]) => `
        <div class="mb-1">
          <strong>${key}:</strong> 
          <code class="ms-2">${JSON.stringify(value)}</code>
          <i class="bi bi-clipboard copy-btn ms-2" data-clipboard-text="${JSON.stringify(value)}"></i>
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
});
