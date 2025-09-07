import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import ProblemDetailPage from './components/ProblemDetailPage';
import ThemeToggle from './components/ThemeToggle';
import './App.css';
import { ProblemListPage } from './components/ProblemList';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <ThemeToggle />
        <Routes>
          <Route path="/" element={<ProblemListPage />} />
          <Route path="/problem/:problemId" element={<ProblemDetailPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
