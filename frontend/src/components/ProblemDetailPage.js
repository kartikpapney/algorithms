import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProblemModal from './ProblemModal';
import backendManager from '../backend-config';
import './ProblemDetail.css';

const ProblemDetailPage = () => {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProblem = async () => {
      try {
        setIsLoading(true);
        console.log('Loading problem with ID:', problemId);
        
        try {
          const problems = await backendManager.getProblems();
          const foundProblem = problems.find(p => 
            p.id === problemId || 
            p._id === problemId || 
            p.titleSlug === problemId ||
            p.number === problemId ||
            p.number === parseInt(problemId)
          );
          
          if (foundProblem) {
            console.log('Found problem from backend:', foundProblem);
            setProblem(foundProblem);
            setIsLoading(false);
            return;
          }
        } catch (backendError) {
          console.log('Backend failed, trying localStorage:', backendError);
        }
      
      } catch (error) {
        console.error('Error loading problem:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (problemId) {
      loadProblem();
    }
  }, [problemId]);

  const handleClose = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="loading-container">
          <h2>Loading problem...</h2>
          <p>Please wait while we fetch the problem details</p>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="error-state">
        <div className="error-container">
          <h2>Problem not found</h2>
          <p>Problem with ID "{problemId}" could not be found.</p>
          <button 
            onClick={handleClose}
            className="back-button"
          >
            Back to Problems List
          </button>
        </div>
      </div>
    );
  }

  return <ProblemModal problem={problem} onClose={handleClose} />;
};

export default ProblemDetailPage;
