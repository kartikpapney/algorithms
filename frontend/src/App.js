import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProblemDetailPage from './components/ProblemDetailPage';
import './App.css';
import { ProblemListPage } from './components/ProblemList';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProblemListPage />} />
        <Route path="/problem/:problemId" element={<ProblemDetailPage />} />
      </Routes>
    </Router>
  );
}

export default App;
