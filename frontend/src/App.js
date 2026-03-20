import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Problems from './pages/Problems';
import Knowledge from './pages/Knowledge';
import Chat from './pages/Chat';

function App() {
  return (
    <div className="App">
      <Navbar />
      <div className="main-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/knowledge" element={<Knowledge />} />
          <Route path="/chat/:questionId" element={<Chat />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
