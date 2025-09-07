function getCsrfToken() {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrftoken') return value;
  }
  return null;
}

// Fetch submitted solution from LeetCode API
async function fetchSubmittedSolution(problemId) {
  try {
    
    const languages = ['java'];
    
    for (const lang of languages) {
      try {

        const response = await fetch(`https://leetcode.com/submissions/latest/?qid=${problemId}&lang=${lang}`, {
          method: 'GET',
          headers: {
            'accept': '*/*',
            'content-type': 'application/json',
            'X-CSRFToken': getCsrfToken() || '',
            'Referer': window.location.href
          },
          credentials: 'include'
        });
                
        if (response.ok) {
          const solutionData = await response.json();
          if (solutionData && solutionData.code) {
            return {
              ...solutionData,
              lang: lang
            };
          }
        }
      } catch (langError) {
        console.error(`❌ Failed to fetch solution for ${lang}:`, langError.message);
        continue;
      }
    }

    console.error('❌ No solution found in any language');
    return null;
    
  } catch (error) {
    console.error('❌ Failed to fetch solution:', error);
    return null;
  }
}

// Fetch problem data from LeetCode API
async function fetchProblemData() {
  try {
    
    const urlParts = window.location.pathname.split('/');
    
    const problemSlug = urlParts[2];
    
    if (!problemSlug) throw new Error('Could not extract problem slug from URL');
    
    const query = `query questionDetail($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        title titleSlug questionFrontendId content difficulty
        topicTags { name } hints likes dislikes
        codeSnippets { code lang langSlug } exampleTestcaseList
      }
    }`;
        
    const csrfToken = getCsrfToken();

    const response = await fetch('https://leetcode.com/graphql/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken || '',
        'Referer': window.location.href
      },
      credentials: 'include',
      body: JSON.stringify({ query, variables: { titleSlug: problemSlug } })
    });
    
    
    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    
    const data = await response.json();
    
    const question = data.data?.question;
    if (!question) {
      console.error('❌ No question data found in response:', data);
      throw new Error('No question data found');
    }
    
    // Fetch the submitted solution
    const solutionData = await fetchSubmittedSolution(question.questionFrontendId);
    
    const result = {
      id: question.questionFrontendId,
      title: question.title,
      titleSlug: question.titleSlug,
      url: `https://leetcode.com/problems/${question.titleSlug}/`,
      difficulty: question.difficulty,
      description: question.content,
      tags: question.topicTags?.map(tag => tag.name) || [],
      hints: question.hints || [],
      solution: solutionData?.code || '',
      solutionLanguage: solutionData?.lang || 'java',
      submissionStatus: solutionData?.status_display || 'Unknown',
      capturedAt: new Date().toISOString()
    };
    return result;
    
  } catch (error) {
    console.error('❌ fetchProblemData error:', error);
    throw error;
  }
}

// Listen for popup messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  if (request.action === 'extractProblemData') {
    fetchProblemData()
      .then(data => {
        sendResponse({ success: true, data });
      })
      .catch(error => {
        console.error('❌ Failed to extract problem data:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});
