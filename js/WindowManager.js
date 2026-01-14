PortfolioOS.WindowManager = {
    windows: new Map(),
    zIndex: 100,
    activeWindowId: null,

    init() {
        this.taskbarTabs = document.getElementById('window-tabs');
    },

    async createWindow(appData) {
        // Tekil pencere kontrolü
        if (!appData.window.allowMultipleInstances) {
            const existingId = Array.from(this.windows.keys()).find(id => this.windows.get(id).appId === appData.id);
            if (existingId) {
                this.focusWindow(existingId);
                return;
            }
        }

        const id = `win-${Date.now()}`;
        const win = document.createElement('div');
        win.className = 'window';
        win.id = id;
        win.style.width = `${appData.window.default_width}px`;
        win.style.height = `${appData.window.default_height}px`;
        
        const randomX = 50 + Math.random() * 100;
        const randomY = 50 + Math.random() * 100;
        win.style.left = `${randomX}px`;
        win.style.top = `${randomY}px`;
        win.style.zIndex = ++this.zIndex;

        // Başlık çubuğu ve içerik iskeleti
        win.innerHTML = `
            <div class="title-bar">
                <div class="title-bar-text">
                    <img src="${appData.icon}" width="16" height="16" style="vertical-align:middle; margin-right:4px;">
                    ${PortfolioOS.helpers.getText(appData.window.title_key)}
                </div>
                <div class="window-controls">
                    <button data-action="minimize">_</button>
                    <button data-action="maximize" ${appData.window.canMaximize ? '' : 'disabled'}>□</button>
                    <button data-action="close">X</button>
                </div>
            </div>
            <div class="window-content">${PortfolioOS.helpers.getText('system.loading')}</div>
        `;

        document.body.appendChild(win);
        
        // State'e ekle
        this.windows.set(id, { element: win, appId: appData.id, state: 'normal' });
        
        // Taskbar ve kontroller
        this.createTaskbarTab(id, appData);
        this.focusWindow(id);
        this.makeDraggable(win);
        this.attachControls(win, id);

        // İçeriği yükle
        await this.loadContent(win, appData.window.content_html_file);

        // Ayarlar penceresi özel başlatıcı
        if (appData.id === 'app_settings' && PortfolioOS.Settings) {
            PortfolioOS.Settings.init(win.querySelector('.window-content'), id);
        }
    },

    async loadContent(winElement, url) {
        try {
            const res = await fetch(url);
            if(!res.ok) throw new Error("File not found");
            const html = await res.text();
            const contentDiv = winElement.querySelector('.window-content');
            contentDiv.innerHTML = html;
            PortfolioOS.helpers.translateElement(contentDiv);
        } catch (e) {
            console.error(e);
            if(winElement.querySelector('.window-content')) {
                winElement.querySelector('.window-content').innerHTML = `
                    <div style="padding:10px; color:red;">
                        ${PortfolioOS.helpers.getText('system.error_loading')}<br>
                        <small>(${url})</small>
                    </div>`;
            }
        }
    },

    focusWindow(id) {
        const winData = this.windows.get(id);
        if (!winData) return;

        if (this.activeWindowId && this.windows.has(this.activeWindowId)) {
            this.windows.get(this.activeWindowId).element.classList.remove('active');
            document.getElementById(`tab-${this.activeWindowId}`)?.classList.remove('active');
        }

        winData.element.style.zIndex = ++this.zIndex;
        winData.element.classList.add('active');
        winData.element.style.display = 'flex';
        
        const tab = document.getElementById(`tab-${id}`);
        if(tab) tab.classList.add('active');
        
        this.activeWindowId = id;
    },

    // --- KRİTİK DÜZELTME: Daha Güvenli Kapatma ---
    closeWindow(id) {
        // 1. DOM Temizliği (State'de olmasa bile fiziksel olarak sil)
        const winEl = document.getElementById(id);
        if (winEl) winEl.remove();

        const tabEl = document.getElementById(`tab-${id}`);
        if (tabEl) tabEl.remove();

        // 2. State Temizliği
        if (this.windows.has(id)) {
            this.windows.delete(id);
        }

        if (this.activeWindowId === id) this.activeWindowId = null;
    },

    // --- KRİTİK DÜZELTME: Toplu Kapatma ve Temizlik ---
    closeAll() {
        // Kayıtlı tüm pencereleri kapat
        const ids = Array.from(this.windows.keys());
        ids.forEach(id => this.closeWindow(id));
        
        // Ekstra Güvenlik: Eğer hala inatçı tab kaldıysa container'ı temizle
        if (this.taskbarTabs) {
            this.taskbarTabs.innerHTML = '';
        }
        
        // State'i tamamen sıfırla
        this.windows.clear();
        this.activeWindowId = null;
    },

    minimizeWindow(id) {
        const winData = this.windows.get(id);
        if (winData) {
            winData.element.style.display = 'none';
            document.getElementById(`tab-${id}`)?.classList.remove('active');
            this.activeWindowId = null;
        }
    },

    maximizeWindow(id) {
        const winData = this.windows.get(id);
        if (!winData) return;

        if (winData.state === 'maximized') {
            winData.element.classList.remove('maximized');
            winData.state = 'normal';
        } else {
            winData.element.classList.add('maximized');
            winData.state = 'maximized';
        }
    },

    createTaskbarTab(id, appData) {
        const tab = document.createElement('div');
        tab.className = 'task-tab';
        tab.id = `tab-${id}`;
        tab.innerHTML = `
            <img src="${appData.icon}">
            <span>${PortfolioOS.helpers.getText(appData.name_key)}</span>
        `;
        tab.onclick = () => {
            if (this.activeWindowId === id && this.windows.get(id).element.style.display !== 'none') {
                this.minimizeWindow(id);
            } else {
                this.focusWindow(id);
            }
        };
        this.taskbarTabs.appendChild(tab);
    },

    attachControls(element, id) {
        element.addEventListener('mousedown', () => this.focusWindow(id));
        element.querySelector('[data-action="close"]').onclick = () => this.closeWindow(id);
        element.querySelector('[data-action="minimize"]').onclick = (e) => { e.stopPropagation(); this.minimizeWindow(id); };
        element.querySelector('[data-action="maximize"]').onclick = () => this.maximizeWindow(id);
    },

    makeDraggable(element) {
        const titleBar = element.querySelector('.title-bar');
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        titleBar.addEventListener('mousedown', (e) => {
            if(e.target.tagName === 'BUTTON') return;
            if(element.classList.contains('maximized')) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = element.offsetLeft;
            initialTop = element.offsetTop;
            document.body.style.userSelect = 'none'; 
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            element.style.left = `${initialLeft + dx}px`;
            element.style.top = `${initialTop + dy}px`;
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            document.body.style.userSelect = '';
        });
    }
};