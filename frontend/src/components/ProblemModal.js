import React, { useEffect, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';
import html2canvas from 'html2canvas';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import './ProblemModal.css';

const ProblemModal = ({ problem, onClose }) => {
  const { isDark } = useTheme();
  
  const handleScreenshot = useCallback(async () => {
    try {
      // Capture the entire fullpage-container
      const fullPageElement = document.querySelector('.fullpage-container');
      if (!fullPageElement) {
        alert('Could not find the page content to screenshot.');
        return;
      }

      // Use html2canvas to capture the full page
      const canvas = await html2canvas(fullPageElement, {
        backgroundColor: isDark ? '#1a1612' : '#ffffff',
        scale: 1,
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: fullPageElement.scrollWidth,
        height: fullPageElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight
      });

      // Convert to blob and copy to clipboard
      canvas.toBlob(async (blob) => {
        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          
          // Show success feedback
          alert('Full page screenshot copied to clipboard!');
        } catch (clipboardError) {
          console.error('Error copying to clipboard:', clipboardError);
          
          // Fallback: create download link
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${problem.title}-screenshot.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          alert('Screenshot downloaded (clipboard not supported).');
        }
      }, 'image/png');

    } catch (error) {
      console.error('Error taking screenshot:', error);
      alert('Error taking screenshot. Please try again.');
    }
  }, [isDark, problem.title]);

  // Add keyboard shortcut for screenshot
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        handleScreenshot();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleScreenshot]);

  if (!problem) return null;

  return (
    <div className="fullpage-container">
      <div className="fullpage-content">
        <div className="app-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="app-title">Algorithms</h1>
            </div>
            
            <div className="header-center">
              {/* Empty for symmetry */}
            </div>
            
            <div className="header-right">
              <ThemeToggle />
            </div>
          </div>
        </div>

        <div className="fullpage-body">
          <div className="content-grid">
            <div className="problem-content">
              <div className="problem-section">
                {/* Clickable Problem Title */}
                {problem.url ? (
                  <a 
                    href={problem.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="problem-title-link"
                  >
                    <h1 className="problem-title-header">
                      {problem.number && `${problem.number}. `}
                      {problem.title.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h1>
                  </a>
                ) : (
                  <h1 className="problem-title-header">
                    {problem.number && `${problem.number}. `}
                    {problem.title.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h1>
                )}
                
                <div 
                    className="description-content"
                    dangerouslySetInnerHTML={{ __html: problem.description }}
                  />
              </div>
            </div>

            <div className="solution-content">
              {problem.solution ? (
                <div className="problem-section">
                  <div className="solution-container">
                    <SyntaxHighlighter
                      language={
                        typeof problem.solution === 'object' 
                          ? (problem.solution.language || 'java')
                          : 'java'
                      }
                      style={isDark ? okaidia : oneLight}
                      customStyle={{
                        margin: 0,
                        fontSize: '14px',
                        lineHeight: '1.5',
                        padding: '20px',
                        fontFamily: '"JetBrains Mono", "Fira Code", Consolas, Monaco, "Courier New", monospace',
                        overflowX: 'auto',
                        fontWeight: '400',
                        letterSpacing: '0.3px',
                        width: '100%',
                        whiteSpace: 'pre',
                        background: 'transparent',
                        borderRadius: '0px'
                      }}
                      showLineNumbers={false}
                      wrapLines={true}
                      wrapLongLines={false}
                      useInlineStyles={true}
                      showInlineLineNumbers={false}
                      startingLineNumber={1}
                      lineProps={(lineNumber) => ({
                        style: { 
                          display: 'block', 
                          whiteSpace: 'pre',
                          backgroundColor: 'transparent',
                          margin: 0,
                          padding: 0
                        }
                      })}
                    >
                      {problem.solution}
                    </SyntaxHighlighter>
                  </div>
                </div>
              ) : (
                <div className="problem-section">
                  <div className="no-solution">
                    <p>No solution available for this problem.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemModal;
