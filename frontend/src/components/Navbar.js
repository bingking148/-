import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();
  
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed-nav">
      <div className="nav-logo">数据结构智能教学系统</div>
      <div className="nav-links">
        <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
          首页
        </Link>
        <Link to="/problems" className={`nav-item ${isActive('/problems') || isActive('/chat') ? 'active' : ''}`}>
          章节题库
        </Link>
        <Link to="/knowledge" className={`nav-item ${isActive('/knowledge') ? 'active' : ''}`}>
          知识点速记
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
