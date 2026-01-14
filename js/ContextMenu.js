PortfolioOS.ContextMenu = {
    menuElement: null,

    init() {
        this.menuElement = document.createElement('div');
        this.menuElement.id = 'context-menu';
        this.menuElement.style.display = 'none';
        document.body.appendChild(this.menuElement);
    },

    show(e) {
        if (!this.menuElement) this.init();

        const targetIcon = e.target.closest('.desktop-icon');
        const targetTaskbarTab = e.target.closest('.task-tab');
        const targetTaskbar = e.target.closest('#taskbar');
        const targetWindow = e.target.closest('.window');
        
        // Helper fonksiyonuna kısayol (kod okunabilirliği için)
        const t = (key) => PortfolioOS.helpers.getText(`context_menu.${key}`);
        
        let items = [];

        if (targetIcon) {
            // --- İKON MENÜSÜ ---
            const appId = targetIcon.dataset.appId;
            items = [
                { label: t('open'), action: () => PortfolioOS.apps.launch(appId), bold: true },
                { separator: true },
                { label: t('cut'), disabled: true },
                { label: t('copy'), disabled: true },
                { separator: true },
                { label: t('delete'), disabled: true },
                { label: t('properties'), disabled: true } // İleride özellikler penceresi yapabilirsin
            ];
        } else if (targetTaskbarTab) {
            // --- TASKBAR SEKME MENÜSÜ ---
            const winId = targetTaskbarTab.id.replace('tab-', '');
            
            items = [
                { label: t('restore'), action: () => PortfolioOS.WindowManager.focusWindow(winId) },
                { label: t('minimize'), action: () => PortfolioOS.WindowManager.minimizeWindow(winId) },
                { separator: true },
                { label: t('close'), action: () => PortfolioOS.WindowManager.closeWindow(winId), bold: true }
            ];

        } else if (targetTaskbar) {
            // --- BOŞ TASKBAR MENÜSÜ ---
            items = [
                { label: t('cascade_windows'), disabled: true },
                { label: t('tile_windows'), disabled: true },
                { separator: true },
                { label: t('properties'), action: () => PortfolioOS.apps.launch('app_settings') }
            ];
        } else if (!targetWindow) {
            // --- MASAÜSTÜ MENÜSÜ ---
            items = [
                { label: t('arrange_icons'), disabled: true },
                { label: t('refresh'), action: () => { PortfolioOS.ui.renderDesktop(); } },
                { separator: true },
                { label: t('new'), disabled: true },
                { separator: true },
                { label: t('properties'), action: () => PortfolioOS.apps.launch('app_settings') }
            ];
        }

        // Menüyü oluştur ve konumlandır
        if (items.length > 0) {
            this.renderItems(items);
            this.menuElement.style.display = 'flex';
            
            let x = e.clientX;
            let y = e.clientY;
            
            const rect = this.menuElement.getBoundingClientRect();
            // Ekran dışına taşmayı engelle
            if (x + rect.width > window.innerWidth) x -= rect.width;
            if (y + rect.height > window.innerHeight) y -= rect.height;

            this.menuElement.style.left = `${x}px`;
            this.menuElement.style.top = `${y}px`;
        } else {
            this.close();
        }
    },

    renderItems(items) {
        this.menuElement.innerHTML = '';
        items.forEach(item => {
            if (item.separator) {
                const sep = document.createElement('div');
                sep.className = 'context-separator';
                this.menuElement.appendChild(sep);
            } else {
                const div = document.createElement('div');
                div.className = 'context-item';
                div.textContent = item.label;
                
                if (item.bold) div.style.fontWeight = 'bold';
                
                if (item.disabled) {
                    div.style.color = '#808080';
                    div.style.cursor = 'default';
                } else {
                    div.onclick = () => {
                        item.action();
                        this.close();
                    };
                }
                this.menuElement.appendChild(div);
            }
        });
    },

    close() {
        if (this.menuElement) {
            this.menuElement.style.display = 'none';
        }
    }
};