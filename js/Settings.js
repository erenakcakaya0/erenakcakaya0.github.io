PortfolioOS.Settings = {
    init(container, windowId) {
        this.container = container;
        this.windowId = windowId;

        const currentSettings = PortfolioOS.state.settings;
        
        const themeSelect = container.querySelector('#theme-select');
        const langSelect = container.querySelector('#lang-select');
        
        if(themeSelect) themeSelect.value = currentSettings.theme;
        if(langSelect) langSelect.value = currentSettings.language;

        container.querySelector('#btn-ok').onclick = () => {
            const newSettings = {
                theme: themeSelect.value,
                language: langSelect.value
            };
            
            // Ayarları kaydet (Dil değişirse tüm pencereler kapanır)
            PortfolioOS.saveSettings(newSettings);
            
            // Eğer pencere hala açıksa (dil değişmediyse) manuel kapat
            if (document.getElementById(this.windowId)) {
                PortfolioOS.WindowManager.closeWindow(this.windowId);
            }
        };

        container.querySelector('#btn-cancel').onclick = () => {
            PortfolioOS.WindowManager.closeWindow(this.windowId);
        };
    }
};