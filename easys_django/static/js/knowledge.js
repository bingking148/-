document.addEventListener('DOMContentLoaded', function() {
    console.log('=== Knowledge page initialized ===');
    
    // 存储章节数据和知识点数据
    let chapters = [];
    let currentChapter = null;
    let knowledgePoints = {};
    let currentKnowledgeId = null;
    
    // 存储知识点详情信息（id和title）
    let knowledgeDetails = {};
    
    // 获取DOM元素
    const chapterList = document.getElementById('chapter-list');
    const knowledgeList = document.getElementById('knowledge-list');
    const knowledgeDetail = document.getElementById('knowledge-detail');
    const knowledgeTitle = document.getElementById('knowledge-title');
    const knowledgeSummary = document.getElementById('knowledge-summary');
    const currentChapterTitle = document.getElementById('current-chapter-title');
    const emptyDetailPlaceholder = document.getElementById('empty-detail-placeholder');
    
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
            await loadAllKnowledgeDetails();
        } catch (error) {
            console.error('Initialization failed:', error);
            knowledgeList.innerHTML = '<p class="empty-tip">加载失败，请刷新页面重试</p>';
        }
    }
    
    // 加载所有知识点详情信息（标题）
    async function loadAllKnowledgeDetails() {
        console.log('Loading knowledge details from /api/knowledge/details/all...');
        try {
            const response = await fetch('/api/knowledge/details/all');
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const text = await response.text();
            knowledgeDetails = JSON.parse(text);
            console.log('Loaded knowledge details:', Object.keys(knowledgeDetails).length);
        } catch (error) {
            console.error('Failed to load knowledge details:', error);
            simulateKnowledgeDetails();
        }
    }
    
    // 临时方法：模拟知识点标题数据
    function simulateKnowledgeDetails() {
        console.warn('Using simulated data as fallback');
        let allKnowledgeIds = [];
        
        for (const chapterId in knowledgePoints) {
            allKnowledgeIds = allKnowledgeIds.concat(knowledgePoints[chapterId]);
        }
        
        allKnowledgeIds.forEach(kpId => {
            let title = "知识点";
            if (kpId.startsWith("kc")) title = "数据结构基本概念";
            else if (kpId.startsWith("kl")) title = "线性表";
            else if (kpId.startsWith("ks")) title = "栈和队列";
            else if (kpId.startsWith("kt")) title = "树和二叉树";
            else if (kpId.startsWith("kg")) title = "图";
            else if (kpId.startsWith("ka")) title = "算法分析";
            
            knowledgeDetails[kpId] = {
                id: kpId,
                title: title + " " + kpId.substring(2)
            };
        });
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
            chapters = JSON.parse(text);
            console.log(`Loaded ${chapters.length} chapters:`, chapters);
            
            renderChapters();
            await loadAllKnowledgePoints();
        } catch (error) {
            console.error('Failed to load chapters:', error);
            chapterList.innerHTML = '<li class="empty-tip">加载章节失败: ' + error.message + '</li>';
        }
    }
    
    // 加载所有章节的知识点
    async function loadAllKnowledgePoints() {
        console.log('Loading knowledge points from /api/knowledge/chapters...');
        try {
            const response = await fetch('/api/knowledge/chapters');
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const text = await response.text();
            knowledgePoints = JSON.parse(text);
            console.log('Loaded knowledge points:', Object.keys(knowledgePoints));
        } catch (error) {
            console.error('Failed to load knowledge points:', error);
        }
    }
    
    // 获取知识点标题
    async function getKnowledgeTitle(knowledgeId) {
        if (knowledgeDetails[knowledgeId] && knowledgeDetails[knowledgeId].title) {
            return knowledgeDetails[knowledgeId].title;
        }
        
        try {
            const response = await fetch(`/api/knowledge/${knowledgeId}/title`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!knowledgeDetails[knowledgeId]) {
                knowledgeDetails[knowledgeId] = { id: knowledgeId, title: data.title };
            } else {
                knowledgeDetails[knowledgeId].title = data.title;
            }
            
            return data.title;
        } catch (error) {
            console.error(`Failed to get title for ${knowledgeId}:`, error);
            return "";
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
            
            const titleSpan = document.createElement('span');
            titleSpan.className = 'chapter-title';
            titleSpan.textContent = `${chapter.id}. ${chapter.title || '未命名'}`;
            
            const icon = document.createElement('i');
            icon.className = 'fas fa-chevron-right chapter-icon';
            
            li.appendChild(titleSpan);
            li.appendChild(icon);
            
            li.addEventListener('click', (e) => {
                e.preventDefault();
                toggleChapter(chapter, li);
            });
            
            chapterList.appendChild(li);
        });
    }
    
    // 切换章节展开/折叠状态
    function toggleChapter(chapter, chapterElement) {
        console.log('Toggling chapter:', chapter);
        const wasActive = chapterElement.classList.contains('active');
        
        const allChapters = document.querySelectorAll('.chapter-item');
        allChapters.forEach(item => {
            item.classList.remove('active', 'expanded');
        });
        
        if (!wasActive) {
            chapterElement.classList.add('active', 'expanded');
            currentChapter = chapter;
            currentChapterTitle.textContent = ` - ${chapter.title || '未命名'}`;
            loadKnowledgePoints(chapter.id);
        } else {
            currentChapter = null;
            currentChapterTitle.textContent = '';
            knowledgeList.innerHTML = '<p class="empty-tip">请选择章节查看知识点</p>';
        }
    }
    
    // 加载某章节的知识点
    function loadKnowledgePoints(chapterId) {
        console.log('Loading knowledge points for chapter:', chapterId);
        const chapterKnowledgePoints = knowledgePoints[chapterId] || [];
        
        if (!chapterKnowledgePoints || chapterKnowledgePoints.length === 0) {
            knowledgeList.innerHTML = '<p class="empty-tip">该章节暂无知识点</p>';
            return;
        }
        
        knowledgeList.innerHTML = '';
        
        chapterKnowledgePoints.forEach(kpId => {
            const div = document.createElement('div');
            div.className = 'knowledge-item';
            div.dataset.id = kpId;
            
            let kpTitle = knowledgeDetails[kpId] ? knowledgeDetails[kpId].title : "";
            
            const idSpan = document.createElement('span');
            idSpan.className = 'knowledge-id';
            idSpan.textContent = kpId;
            
            const titleDiv = document.createElement('div');
            titleDiv.className = 'knowledge-title-text';
            titleDiv.textContent = kpTitle;
            
            div.appendChild(idSpan);
            div.appendChild(titleDiv);
            
            div.addEventListener('click', (e) => {
                e.stopPropagation();
                selectKnowledgePoint(kpId, div);
            });
            
            knowledgeList.appendChild(div);
        });
    }
    
    // 选择知识点并显示详情
    function selectKnowledgePoint(knowledgeId, element) {
        console.log('Selecting knowledge point:', knowledgeId);
        const allKnowledgeItems = document.querySelectorAll('.knowledge-item');
        allKnowledgeItems.forEach(item => item.classList.remove('active'));
        if (element) element.classList.add('active');
        
        currentKnowledgeId = knowledgeId;
        loadKnowledgeDetail(knowledgeId);
    }
    
    // 加载知识点详情
    async function loadKnowledgeDetail(knowledgeId) {
        console.log('Loading knowledge detail for:', knowledgeId);
        try {
            emptyDetailPlaceholder.style.display = 'none';
            knowledgeDetail.style.display = 'flex';
            
            const kpDetail = knowledgeDetails[knowledgeId] || { id: knowledgeId, title: "" };
            
            if (!kpDetail.title) {
                kpDetail.title = await getKnowledgeTitle(knowledgeId);
            }
            
            knowledgeTitle.innerHTML = `<span class="knowledge-id-label">${kpDetail.id}</span>`;
            if (kpDetail.title) {
                knowledgeTitle.innerHTML += ` - <span class="knowledge-title-label">${kpDetail.title}</span>`;
            }
            
            knowledgeSummary.innerHTML = '<div style="text-align: center; padding: 20px;">加载中...</div>';
            
            const response = await fetch(`/api/knowledge/${knowledgeId}`);
            console.log('Detail response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const text = await response.text();
            console.log('Detail response length:', text.length);
            
            // Check if response is JSON or plain text
            let summary;
            try {
                summary = JSON.parse(text);
            } catch (e) {
                // It's plain text (markdown)
                summary = text;
            }
            
            // Use marked to render markdown
            if (typeof marked !== 'undefined') {
                const renderedHTML = marked.parse(summary);
                knowledgeSummary.innerHTML = renderedHTML;
            } else {
                knowledgeSummary.textContent = summary;
            }
        } catch (error) {
            console.error('Failed to load knowledge detail:', error);
            knowledgeSummary.innerHTML = '<div class="error-message">加载知识点详情失败: ' + error.message + '</div>';
        }
    }
});
