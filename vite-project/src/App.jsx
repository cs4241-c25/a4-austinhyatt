import * as ReactRouterDOM from 'react-router-dom';
const { BrowserRouter: Router, Routes, Route } = ReactRouterDOM;
import Login from './login';
import Dashboard from './dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="" element={<Login />} />
        <Route path="dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
