class BackendManager {
  constructor() {
    console.log(process.env.REACT_APP_BACKEND_URL)
    this.baseUrl = `${process.env.REACT_APP_BACKEND_URL}`;
  }

  async getProblems(searchQuery = '') {
    try {
      let url = `${this.baseUrl}/problems`;
      if (searchQuery.trim()) {
        url += `?search=${encodeURIComponent(searchQuery)}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch problems: ${response.status}`);
      }
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching problems from backend:', error);
      throw error;
    }
  }

}

// Create and export singleton instance
const backendManager = new BackendManager();
export default backendManager;
