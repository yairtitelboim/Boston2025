import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import TestPage from './components/Map/components/POIGraph/TestPage';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/test/bell-curve" element={<TestPage />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
