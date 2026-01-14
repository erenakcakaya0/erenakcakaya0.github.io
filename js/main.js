const PortfolioOS = {
    state: {
        apps: [],
        languageData: {},
        currentLanguage: 'tr',
        settings: {
            theme: 'win95-classic',
            language: 'tr'
        },
        selectedIcons: new Set(),
        isSelecting: false
    },

    async init() {
        console.log("PortfolioOS Başlatılıyor...");
        this.loadSettings();
        this.applySettings();

        try {
            const [appsData, langData] = await Promise.all([
                this.helpers.loadJSON('data/apps.json'),
                this.helpers.loadJSON('data/languages.json')
            ]);

            this.state.apps = appsData;
            this.state.languageData = langData;

            this.initSystemComponents();
            this.ui.renderDesktop();
            this.initEventListeners();

        } catch (error) {
            console.error("Sistem başlatılamadı:", error);
        }
    },

    initSystemComponents() {
        if (PortfolioOS.Clock) PortfolioOS.Clock.init();
        if (PortfolioOS.StartMenu) PortfolioOS.StartMenu.init();
        if (PortfolioOS.WindowManager) PortfolioOS.WindowManager.init();
        this.ui.updateStaticTexts();
    },

    loadSettings() {
        const saved = localStorage.getItem('portfolio_settings');
        if (saved) {
            this.state.settings = JSON.parse(saved);
            this.state.currentLanguage = this.state.settings.language;
        }
    },

    saveSettings(newSettings) {
        this.state.settings = newSettings;
        this.state.currentLanguage = newSettings.language;
        localStorage.setItem('portfolio_settings', JSON.stringify(newSettings));
        this.applySettings();
        this.ui.renderDesktop();
        this.ui.updateStaticTexts();
        if(PortfolioOS.StartMenu) PortfolioOS.StartMenu.render();

        if (languageChanged && PortfolioOS.WindowManager) {
            PortfolioOS.WindowManager.closeAll();
        }
    },

    applySettings() {
        const themeLink = document.getElementById('theme-link');
        if (themeLink) {
            themeLink.href = `assets/themes/${this.state.settings.theme}.css`;
        }
    },

    helpers: {
        async loadJSON(url) {
            const res = await fetch(url);
            return await res.json();
        },
        getText(key) {
            const keys = key.split('.');
            let res = PortfolioOS.state.languageData[PortfolioOS.state.currentLanguage];
            for (const k of keys) {
                if(res) res = res[k];
            }
            return res || key;
        },
        translateElement(el) {
            el.querySelectorAll('[data-lang-key]').forEach(item => {
                item.textContent = this.getText(item.dataset.langKey);
            });
        },
        // İki elementin çakışıp çakışmadığını kontrol eder
        isOverlapping(el1, el2) {
            const rect1 = el1.getBoundingClientRect();
            const rect2 = el2.getBoundingClientRect();
            return !(
                rect1.right < rect2.left ||
                rect1.left > rect2.right ||
                rect1.bottom < rect2.top ||
                rect1.top > rect2.bottom
            );
        }
    },

    ui: {
        renderDesktop() {
            const desktop = document.getElementById('desktop');
            desktop.innerHTML = '';
            
            PortfolioOS.state.apps.forEach(app => {
                const icon = document.createElement('div');
                icon.className = 'desktop-icon';
                icon.dataset.appId = app.id;
                icon.innerHTML = `
                    <img src="${app.icon}" draggable="false">
                    <span>${PortfolioOS.helpers.getText(app.name_key)}</span>
                `;
                desktop.appendChild(icon);
            });
        },
        updateStaticTexts() {
            const startBtn = document.querySelector('#start-button span');
            if(startBtn) startBtn.textContent = PortfolioOS.helpers.getText('start_menu.start');
        }
    },

    apps: {
        launch(appId) {
            const app = PortfolioOS.state.apps.find(a => a.id === appId);
            if(app) PortfolioOS.WindowManager.createWindow(app);
        }
    },

    initEventListeners() {
        const desktop = document.getElementById('desktop');

        // --- 1. MOUSE EVENTS (SOL TIK, ÇİFT TIK) ---
        desktop.addEventListener('click', (e) => {
            const icon = e.target.closest('.desktop-icon');
            const startMenu = e.target.closest('#start-menu');
            const startBtn = e.target.closest('#start-button');
            const contextMenu = e.target.closest('#context-menu');

            // İkon Seçimi (Tekil)
            if (icon) {
                // Ctrl tuşuna basılı değilse diğerlerini temizle
                if (!e.ctrlKey) {
                    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
                }
                icon.classList.add('selected');
            } else if (!e.target.closest('.task-tab') && !e.target.closest('.window')) {
                // Boşluğa tıklanırsa hepsini temizle
                document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
            }

            if (!startMenu && !startBtn && PortfolioOS.StartMenu) PortfolioOS.StartMenu.close();
            if (!contextMenu && PortfolioOS.ContextMenu) PortfolioOS.ContextMenu.close();
        });

        desktop.addEventListener('dblclick', (e) => {
            const icon = e.target.closest('.desktop-icon');
            if (icon && icon.dataset.appId) {
                PortfolioOS.apps.launch(icon.dataset.appId);
                icon.classList.remove('selected');
            }
        });

        // --- 2. DİKDÖRTGEN SEÇİM ARACI (DÜZELTİLDİ) ---
        let startX, startY;
        const selectionBox = document.createElement('div');
        selectionBox.id = 'selection-box';
        document.body.appendChild(selectionBox);

        desktop.addEventListener('mousedown', (e) => {
            if (e.target !== desktop || e.button !== 0) return;

            PortfolioOS.state.isSelecting = true;
            startX = e.clientX;
            startY = e.clientY;
            
            selectionBox.style.left = startX + 'px';
            selectionBox.style.top = startY + 'px';
            selectionBox.style.width = '0px';
            selectionBox.style.height = '0px';
            selectionBox.style.display = 'block';

            // Seçim başlarken eski seçimleri temizle (Ctrl basılı değilse)
            if (!e.ctrlKey) {
                document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!PortfolioOS.state.isSelecting) return;

            const currentX = e.clientX;
            const currentY = e.clientY;
            const width = Math.abs(currentX - startX);
            const height = Math.abs(currentY - startY);
            const left = Math.min(currentX, startX);
            const top = Math.min(currentY, startY);

            selectionBox.style.width = width + 'px';
            selectionBox.style.height = height + 'px';
            selectionBox.style.left = left + 'px';
            selectionBox.style.top = top + 'px';

            // ÇAKIŞMA KONTROLÜ (Overlap Check)
            const icons = document.querySelectorAll('.desktop-icon');
            icons.forEach(icon => {
                if (PortfolioOS.helpers.isOverlapping(selectionBox, icon)) {
                    icon.classList.add('selected');
                } else {
                    // Eğer Ctrl basılı değilse ve kutudan çıktıysa seçimi kaldır
                    // (Windows davranışı biraz daha karışıktır ama bu basit versiyon yeterli)
                    if (!e.ctrlKey) icon.classList.remove('selected');
                }
            });
        });

        document.addEventListener('mouseup', () => {
            if (PortfolioOS.state.isSelecting) {
                PortfolioOS.state.isSelecting = false;
                selectionBox.style.display = 'none';
            }
        });

        // --- 3. SAĞ TIK MENÜSÜ ---
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (PortfolioOS.ContextMenu) {
                PortfolioOS.ContextMenu.show(e);
            }
        });

        const startBtn = document.getElementById('start-button');
        if(startBtn) {
            startBtn.addEventListener('click', () => PortfolioOS.StartMenu.toggle());
        }
    }
};

document.addEventListener('DOMContentLoaded', () => PortfolioOS.init());