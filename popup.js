// Minimal popup script
document.addEventListener('DOMContentLoaded', function() {
  const captureBtn = document.getElementById('captureBtn');
  const configBtn = document.getElementById('configBtn');
  const configPanel = document.getElementById('configPanel');
  const configSave = document.getElementById('configSave');
  const baseUrlInput = document.getElementById('baseUrlInput');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const status = document.getElementById('status');
  const problemCount = document.getElementById('problemCount');
  const backendSync = new ChromeBackendSync();
  
  // Initialize popup
  init();
  
  async function init() {
    await loadConfiguration();
    await loadStats();
  }
  
  async function loadConfiguration() {
    try {
      await backendSync.initialize();
      baseUrlInput.value = backendSync.baseUrl || 'http://localhost:3001';
      
      // Don't pre-populate API key for security
      const hasApiKey = await backendSync.isApiKeyConfigured();
      if (hasApiKey) {
        apiKeyInput.placeholder = '••••••••••••••••••••';
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  }
  
  async function loadStats() {
    try {
      console.log("here");
      const count = await backendSync.getUserProblemCount();
      console.log(count);
      problemCount.textContent = count.toString();
    } catch (error) {
      console.error('Failed to load stats:', error);
      problemCount.textContent = '?';
    }
  }
  
  configBtn.addEventListener('click', function() {
    configPanel.classList.toggle('show');
  });
  
  configSave.addEventListener('click', async function() {
    try {
      const baseUrl = baseUrlInput.value.trim() || 'http://localhost:3001';
      const apiKey = apiKeyInput.value.trim();
      
      if (!apiKey && apiKeyInput.placeholder !== '••••••••••••••••••••') {
        showStatus('❌ Please enter an API key', 'error');
        return;
      }
      
      const success = await backendSync.storeConfig(baseUrl, apiKey || undefined);
      
      if (success) {
        showStatus('✅ Configuration saved!', 'success');
        configPanel.classList.remove('show');
        
        // Clear the API key input for security
        if (apiKey) {
          apiKeyInput.value = '';
          apiKeyInput.placeholder = '••••••••••••••••••••';
        }
        
        // Reload stats with new configuration
        setTimeout(() => {
          loadStats();
          status.style.display = 'none';
        }, 2000);
      } else {
        showStatus('❌ Failed to save configuration', 'error');
      }
    } catch (error) {
      console.error('Configuration save error:', error);
      showStatus('❌ Configuration save failed', 'error');
    }
  });
  
  captureBtn.addEventListener('click', async function() {
    try {
      console.log('Capture button clicked');
      showStatus('Checking configuration...', 'info');
      captureBtn.disabled = true;
      
      // Check if API key is configured
      const hasApiKey = await backendSync.isApiKeyConfigured();
      if (!hasApiKey) {
        showStatus('❌ Please configure API key in Settings first', 'error');
        configPanel.classList.add('show');
        return;
      }
      
      showStatus('Capturing...', 'info');
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('leetcode.com/problems/')) {
        throw new Error('Please navigate to a LeetCode problem page first');
      }

      let response;
      try {
        response = await chrome.tabs.sendMessage(tab.id, { action: 'extractProblemData' });
      } catch (error) {

        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          
          // Wait a bit for the script to load
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Try sending the message again
          response = await chrome.tabs.sendMessage(tab.id, { action: 'extractProblemData' });
        } catch (injectError) {
          console.error('❌ Failed to inject content script:', injectError);
          throw new Error('Content script failed to load. Please refresh the page and try again.');
        }
      }

      if (!response?.success) {
        throw new Error(response?.error || 'Failed to extract problem data');
      }
      
      const result = await backendSync.saveProblem(response.data);
      
      if (result.success) {
        showStatus('✅ Problem captured successfully!', 'success');
        
        // Refresh problem count
        setTimeout(() => {
          loadStats();
          status.style.display = 'none';
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to save to backend');
      }
      
    } catch (error) {
      console.error('Popup error:', error);
      
      // Handle specific API key error
      if (error.message.includes('API_KEY_REQUIRED')) {
        showStatus('❌ API key required. Please configure in Settings.', 'error');
        configPanel.classList.add('show');
      } else {
        showStatus(`❌ ${error.message}`, 'error');
      }
    } finally {
      captureBtn.disabled = false;
    }
  });
  
  function showStatus(message, type = 'info') {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
  }
});
