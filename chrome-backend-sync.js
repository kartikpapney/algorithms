// Chrome Extension Backend Integration
class ChromeBackendSync {
  constructor() {
    this.baseUrl = null;
    this.apiKey = null;
    this.initialized = false;
  }

  // Initialize with stored configuration
  async initialize() {
    if (this.initialized) return;
    
    try {
      const result = await chrome.storage.local.get(['baseUrl', 'apiKey']);
      
      if (result.baseUrl) {
        this.baseUrl = result.baseUrl;
      }
      
      if (result.apiKey) {
        this.apiKey = result.apiKey;
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to load stored config:', error);
    }
  }

  async isApiKeyConfigured() {
    await this.initialize();
    return !!this.apiKey;
  }

  async storeConfig(baseUrl, apiKey) {
    try {
      await chrome.storage.local.set({ 
        baseUrl: baseUrl || this.baseUrl,
        apiKey: apiKey 
      });
      
      if (baseUrl) this.baseUrl = baseUrl;
      if (apiKey) this.apiKey = apiKey;
      
      return true;
    } catch (error) {
      console.error('Failed to store config:', error);
      return false;
    }
  }

  // Set backend URL (call this after deployment)
  setBaseUrl(url) {
    this.baseUrl = url.replace(/\/$/, ''); // Remove trailing slash
  }

  setApiKey(key) {
    this.apiKey = key;
  }

  async saveProblem(problemData) {
    try {
      await this.initialize(); // Ensure config is loaded
      
      // Check if API key is available, if not throw error to prompt user
      if (!this.apiKey) {
        throw new Error('API_KEY_REQUIRED');
      }
            
      const response = await fetch(`${this.baseUrl}/api/problems`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify({
          title: problemData.title,
          url: problemData.url,
          difficulty: problemData.difficulty,
          description: problemData.description || '',
          solution: problemData.solution || '',
          testCases: problemData.testCases || [],
          tags: problemData.tags || [],
          userEmail: '', // You can get this from Chrome identity if needed
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}: ${result.error}`);
      }

      return {
        success: true,
        id: result.data._id,
        message: result.message
      };

    } catch (error) {
      throw new Error(`Backend save failed: ${error.message}`);
    }
  }

  async getProblems(filters = {}) {
    try {
      await this.initialize(); // Ensure config is loaded
      
      const queryParams = new URLSearchParams();
      
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.difficulty) queryParams.append('difficulty', filters.difficulty);
      if (filters.tags) queryParams.append('tags', filters.tags.join(','));
      if (filters.userId) queryParams.append('userId', filters.userId);

      const url = `${this.baseUrl}/api/problems?${queryParams.toString()}`;

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}: ${result.error}`);
      }

      return {
        success: true,
        problems: result.data,
        pagination: result.pagination
      };

    } catch (error) {
      console.error('Failed to fetch problems from backend:', error);
      throw new Error(`Backend fetch failed: ${error.message}`);
    }
  }

  async getProblem(id) {
    try {
      await this.initialize(); // Ensure config is loaded
      

      const response = await fetch(`${this.baseUrl}/api/problems/${id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}: ${result.error}`);
      }

      return {
        success: true,
        problem: result.data
      };

    } catch (error) {
      console.error('Failed to fetch problem from backend:', error);
      throw new Error(`Backend fetch failed: ${error.message}`);
    }
  }

  async getStats() {
    try {
      await this.initialize(); // Ensure config is loaded
      
      const response = await fetch(`${this.baseUrl}/api/stats`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}: ${result.error}`);
      }

      return {
        success: true,
        stats: result.data
      };

    } catch (error) {
      console.error('Failed to fetch stats from backend:', error);
      throw new Error(`Backend stats failed: ${error.message}`);
    }
  }

  async testConnection() {
    try {
      await this.initialize(); // Ensure config is loaded
      
      const response = await fetch(`${this.baseUrl}/api/`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return {
        success: true,
        info: result
      };

    } catch (error) {
      console.error('Backend connection failed:', error);
      throw new Error(`Connection failed: ${error.message}`);
    }
  }

  async getUserProblems() {
    try {
      const userId = await this.generateUserId();
      return await this.getProblems({ userId, limit: 1000 }); // Get all user problems
    } catch (error) {
      console.error('Failed to get user problems:', error);
      throw error;
    }
  }

  async getUserProblemCount() {
    try {
      await this.initialize(); // Ensure config is loaded
      const response = await fetch(`${this.baseUrl}/api/count`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}: ${result.error}`);
      }
      return result.success ? result.data.count : 0;
    } catch (error) {
      console.error('Failed to get user problem count:', error);
      return 0;
    }
  }
}

window.ChromeBackendSync = ChromeBackendSync;
