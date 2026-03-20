document.addEventListener('DOMContentLoaded', function() {
    console.log('=== Problems page initialized ===');
    
    // 存储章节数据
    let chapters = [];
    let currentChapter = null;
    
    // 获取DOM元素
    const chapterList = document.getElementById('chapter-list');
    const questionList = document.getElementById('question-list');
    const currentChapterTitle = document.getElementById('current-chapter-title');
    
    // 检查marked库
    if (typeof marked === 'undefined') {
        console.warn('Marked.js library not loaded!');
    } else {
        console.log('Marked.js library loaded');
        try {
            marked.use({
                breaks: true,
                gfm: true
            });
        } catch (e) {
            console.warn('Marked configuration failed:', e);
        }
    }
    
    // 初始化
    init();
    
    async function init() {
        console.log('Starting initialization...');
        try {
            await loadChapters();
        } catch (error) {
            console.error('Initialization failed:', error);
            questionList.innerHTML = '<p class="empty-tip">加载失败，请刷新页面重试</p>';
        }
    }
    
    // 加载章节列表
    async function loadChapters() {
        console.log('Loading chapters from /api/chapters...');
        try {
            chapterList.innerHTML = '<li class="empty-tip">加载中...</li>';
            
            const startTime = Date.now();
            const response = await fetch('/api/chapters');
            const elapsed = Date.now() - startTime;
            console.log(`API response time: ${elapsed}ms`);
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const text = await response.text();
            console.log('Response text length:', text.length);
            
            chapters = JSON.parse(text);
            console.log(`Loaded ${chapters.length} chapters:`, chapters);
            
            renderChapters();
        } catch (error) {
            console.error('Failed to load chapters:', error);
            chapterList.innerHTML = '<li class="empty-tip">加载章节失败: ' + error.message + '</li>';
        }
    }
    
    // 渲染章节列表
    function renderChapters() {
        console.log('Rendering chapters...');
        chapterList.innerHTML = '';
        
        if (!chapters || chapters.length === 0) {
            chapterList.innerHTML = '<li class="empty-tip">暂无章节数据</li>';
            return;
        }
        
        chapters.forEach(chapter => {
            const li = document.createElement('li');
            li.className = 'chapter-item';
            li.dataset.id = chapter.id;
            li.textContent = `${chapter.id}. ${chapter.title || '未命名'}`;
            
            li.addEventListener('click', () => selectChapter(chapter));
            
            chapterList.appendChild(li);
        });
        
        // 默认选中第一个章节
        if (chapters.length > 0) {
            selectChapter(chapters[0]);
        }
    }
    
    // 选择章节
    function selectChapter(chapter) {
        console.log('Selecting chapter:', chapter);
        currentChapter = chapter;
        
        // 更新UI
        const chapterItems = document.querySelectorAll('.chapter-item');
        chapterItems.forEach(item => {
            if (item.dataset.id === chapter.id) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // 更新标题
        currentChapterTitle.textContent = ` - ${chapter.title || '未命名'}`;
        
        // 加载问题
        loadQuestions(chapter.id);
    }
    
    // 加载问题列表
    async function loadQuestions(chapterId) {
        console.log(`Loading questions for chapter ${chapterId}...`);
        try {
            questionList.innerHTML = '<p class="empty-tip">加载中...</p>';
            
            const startTime = Date.now();
            const response = await fetch(`/api/chapters/${chapterId}/questions`);
            const elapsed = Date.now() - startTime;
            console.log(`API /api/chapters/${chapterId}/questions took ${elapsed}ms`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const text = await response.text();
            const questions = JSON.parse(text);
            console.log(`Loaded ${questions.length} questions`);
            
            renderQuestions(questions);
        } catch (error) {
            console.error('Failed to load questions:', error);
            questionList.innerHTML = '<p class="empty-tip">加载题目失败: ' + error.message + '</p>';
        }
    }
    
    // 渲染问题列表
    function renderQuestions(questions) {
        console.log('Rendering questions:', questions);
        
        if (!questions || questions.length === 0) {
            questionList.innerHTML = '<p class="empty-tip">该章节暂无题目</p>';
            return;
        }
        
        questionList.innerHTML = '';
        
        questions.forEach(question => {
            const div = document.createElement('div');
            div.className = 'question-item';
            
            // 添加难度标签类
            let difficultyClass = 'medium';
            let difficultyText = question.difficulty || '中等';
            if (difficultyText === '简单') {
                difficultyClass = 'easy';
            } else if (difficultyText === '困难') {
                difficultyClass = 'hard';
            }
            
            // 处理标题
            let titleText = question.title || '无标题';
            if (typeof marked !== 'undefined') {
                try {
                    const titleHTML = marked.parse(titleText);
                    titleText = titleHTML.replace(/<\/?p>/g, '');
                } catch (e) {
                    console.warn('Marked parsing failed:', e);
                }
            }
            
            div.innerHTML = `
                <div class="title">${titleText}</div>
                <div class="meta">
                    <span>${question.type || '未知类型'}</span>
                    <span class="difficulty ${difficultyClass}">${difficultyText}</span>
                </div>
            `;
            
            div.addEventListener('click', () => {
                window.location.href = `/chat/${question.id}`;
            });
            
            questionList.appendChild(div);
        });
    }
});
