import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">
          <span className="highlight">EasyDS</span> - 基于费曼学习法的考研数据结构智能教学系统
        </h1>
        <p className="hero-subtitle">
          颠覆传统"问答式"学习模式，引领"主动讲解式"学习革新
        </p>
        <p className="hero-hint">
          点击导航栏的<span style={{fontWeight: 'bold'}}>"章节题库"</span>开始您的学习之旅
        </p>
      </section>

      {/* Introduction */}
      <section className="intro-section">
        <h2 className="section-title">智能教学新体验</h2>
        <p className="intro-text">
          EasyDS是一款创新型AI教育系统，专为考研数据结构学习设计。系统采用费曼学习法（"通过教授来学习"），
          通过多智能体协同教学模式，实现深度交互式学习体验。
        </p>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title" style={{textAlign: 'center', display: 'block'}}>系统特色</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-header">
              <div className="feature-icon">
                <i className="fas fa-brain"></i>
              </div>
              <h3 className="feature-title">三层智能体模型</h3>
            </div>
            <div className="feature-desc">
              路由Agent评估回答，学生Agent进行知识点追问，教师Agent提供纠错指导
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-header">
              <div className="feature-icon">
                <i className="fas fa-lightbulb"></i>
              </div>
              <h3 className="feature-title">费曼学习法</h3>
            </div>
            <div className="feature-desc">
              主动讲解加深理解，发现知识盲点，建立完整知识体系
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-header">
              <div className="feature-icon">
                <i className="fas fa-sync-alt"></i>
              </div>
              <h3 className="feature-title">动态教学路径</h3>
            </div>
            <div className="feature-desc">
              系统根据您的表现实时调整教学策略，提供个性化学习体验
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-header">
              <div className="feature-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h3 className="feature-title">严格遵循考研大纲</h3>
            </div>
            <div className="feature-desc">
              知识点覆盖精准，紧贴考研要求，整合权威资料
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="guide-section">
        <h2 className="section-title" style={{textAlign: 'center', display: 'block'}}>使用指南</h2>
        <div className="guide-grid">
          <div className="guide-card">
            <div className="guide-icon">
              <i className="fas fa-book-open"></i>
            </div>
            <h3 className="guide-title">章节题库</h3>
            <p className="guide-desc">浏览按章节分类的数据结构题目，选择您想学习的内容</p>
          </div>

          <div className="guide-card">
            <div className="guide-icon">
              <i className="fas fa-comments"></i>
            </div>
            <h3 className="guide-title">主动讲解</h3>
            <p className="guide-desc">尝试自己讲解题目的解题思路，系统将评估您的表现</p>
          </div>

          <div className="guide-card">
            <div className="guide-icon">
              <i className="fas fa-sync-alt"></i>
            </div>
            <h3 className="guide-title">智能反馈</h3>
            <p className="guide-desc">获得智能体个性化指导，纠正错误，填补知识空缺</p>
          </div>

          <div className="guide-card">
            <div className="guide-icon">
              <i className="fas fa-brain"></i>
            </div>
            <h3 className="guide-title">知识速记</h3>
            <p className="guide-desc">随时查阅关键知识点，构建完整的知识体系</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2 className="cta-title">开始您的学习之旅</h2>
        <p className="cta-text">
          点击导航栏的<span className="highlight">"章节题库"</span>，
          选择一道题目，尝试讲解您的解题思路，体验费曼学习法的魅力！
        </p>
      </section>
    </div>
  );
}

export default Home;
