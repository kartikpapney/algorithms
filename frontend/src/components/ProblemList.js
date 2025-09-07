import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import backendManager from '../backend-config';
import './ProblemList.css'

export const ProblemListPage = () => {
  const navigate = useNavigate();
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadProblemsFromBackend = useCallback(async (searchQuery = '') => {
    try {
      setIsLoading(true);
      console.log('Fetching problems from backend...', searchQuery ? `with search: "${searchQuery}"` : '');
      const backendProblems = await backendManager.getProblems(searchQuery);
      console.log('Backend problems received:', backendProblems);
      
      if (backendProblems && backendProblems.length > 0) {
        setFilteredProblems(backendProblems);
        console.log('Loaded from backend:', backendProblems.length, 'problems');
      } else if (!searchQuery) {
        // Only fall back to localStorage if no search query
        console.log('No backend problems found, falling back to localStorage');
      } else {
        setFilteredProblems([]);
      }
    } catch (error) {
      console.error('Failed to load from backend:', error);
      setFilteredProblems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProblemsFromBackend();
  }, [loadProblemsFromBackend]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadProblemsFromBackend(searchQuery);
    }, 300);

    return () => {
      clearTimeout(timeout);
    };
  }, [searchQuery, loadProblemsFromBackend]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleProblemClick = (problem) => {

    const problemId = problem.id || problem._id || problem.titleSlug || problem.number;
    navigate(`/problem/${problemId}`);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#64748b';
    }
  };


  const stripHtml = (html) => {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="app-title">Algorithms</h1>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="controls">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search problems by title, difficulty, or tags..."
              className="search-input"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>

        <div className="problems-grid">
          {isLoading ? (
            <div className="loading">Loading problems...</div>
          ) : filteredProblems.length === 0 ? (
            <div className="no-problems">
              <h2>No problems found</h2>
            </div>
          ) : (
            filteredProblems.map((problem, index) => (
              <div 
                key={problem.id || problem._id || index} 
                className="problem-card"
                onClick={() => handleProblemClick(problem)}
              >
                <div className="problem-header">
                  <h3 className="problem-title">
                    {problem.number && `${problem.number}. `}
                    {problem.title.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h3>
                  <span 
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(problem.difficulty) }}
                  >
                    {problem.difficulty || 'Unknown'}
                  </span>
                </div>
                
                <p className="problem-description">
                  {stripHtml(problem.description)?.substring(0, 150)}
                  {stripHtml(problem.description)?.length > 150 ? '...' : ''}
                </p>
                
                <div className="problem-meta">

                  {
                    problem.tags.map((tag) => {
                      return <span className="language-tag">{tag}</span>
                    })
                  }
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}