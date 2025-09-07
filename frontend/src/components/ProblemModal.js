import { ExternalLink, Camera } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';
import html2canvas from 'html2canvas';
import { useTheme } from '../contexts/ThemeContext';
import './ProblemModal.css';

const ProblemModal = ({ problem, onClose }) => {
  const { isDark } = useTheme();
  
  if (!problem) return null;

  const handleScreenshot = async () => {
    try {

      const screenshotContainer = document.createElement('div');
      screenshotContainer.style.cssText = `
        position: fixed;
        top: -10000px;
        left: 0;
        width: 768px;
        background: white;
        padding: 40px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      const titleElement = document.createElement('div');
      titleElement.style.cssText = `
        text-align: center;
        font-size: 32px;
        font-weight: bold;
        margin-bottom: 40px;
        color: #000;
        border-bottom: 3px solid #000;
        padding-bottom: 20px;
      `;
      titleElement.textContent = `${problem.number ? `${problem.number}. ` : ''}${problem.title.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;

      const originalProblemContent = document.querySelector('.problem-content');
      if (originalProblemContent) {
        const problemClone = originalProblemContent.cloneNode(true);
        problemClone.style.cssText = `
          width: 100%;
          margin-bottom: 40px;
          background: white;
          border: 2px solid #000;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 4px 4px 0px #000;
        `;
        screenshotContainer.appendChild(titleElement);
        screenshotContainer.appendChild(problemClone);
      }

      const originalSolutionContent = document.querySelector('.solution-content');
      if (originalSolutionContent && problem.solution) {
        const solutionClone = originalSolutionContent.cloneNode(true);
        solutionClone.style.cssText = `
          width: 100%;
          background: white;
          border: 2px solid #000;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 4px 4px 0px #000;
        `;
        
        const solutionTitle = document.createElement('h2');
        solutionTitle.style.cssText = `
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 20px;
          color: #000;
          text-align: center;
        `;
        solutionTitle.textContent = 'Solution:';
        
        const codeElements = solutionClone.querySelectorAll('pre, code');
        codeElements.forEach(codeEl => {
          codeEl.style.cssText += `
            white-space: pre-wrap !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            max-width: 100% !important;
            overflow-x: hidden !important;
          `;
        });
        
        const syntaxHighlighters = solutionClone.querySelectorAll('[class*="language-"], .token');
        syntaxHighlighters.forEach(el => {
          el.style.cssText += `
            white-space: pre-wrap !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
          `;
        });
        
        solutionClone.insertBefore(solutionTitle, solutionClone.firstChild);
        screenshotContainer.appendChild(solutionClone);
      }

      document.body.appendChild(screenshotContainer);

      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(screenshotContainer, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: 768,
        height: screenshotContainer.scrollHeight
      });

      document.body.removeChild(screenshotContainer);

      canvas.toBlob(async (blob) => {
        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          
          const button = document.querySelector('.screenshot-btn');
          const originalText = button.innerHTML;
          button.innerHTML = '<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>Copied!';
          
          setTimeout(() => {
            button.innerHTML = originalText;
          }, 2000);
        } catch (clipboardError) {
          console.error('Error copying to clipboard:', clipboardError);
          alert('Screenshot captured but could not copy to clipboard. Your browser may not support this feature.');
        }
      }, 'image/png');

    } catch (error) {
      console.error('Error taking screenshot:', error);
      alert('Error taking screenshot. Please try again.');
    }
  };

  return (
    <div className="fullpage-container">
      <div className="fullpage-content">
        <div className="fullpage-header">
          
          <div className="header-center">
            <h1 className="problem-title">
              {problem.number && `${problem.number}. `}
              {problem.title.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h1>
          </div>
          
          <div className="header-right">
            <button 
              onClick={handleScreenshot}
              className="screenshot-btn"
              title="Take Screenshot"
            >
              <Camera size={20} />
              Capture
            </button>
            {problem.url && (
              <a 
                href={problem.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="external-link-btn"
              >
                <ExternalLink size={20} />
                Checkout
              </a>
            )}
          </div>
        </div>

        <div className="fullpage-body">
          <div className="content-grid">
            <div className="problem-content">
              <div className="problem-section">
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
