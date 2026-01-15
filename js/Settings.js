DisportOS.Settings = {

    init(contentContainer, windowId) {
        this.container = contentContainer;
        this.windowId = windowId;

        this.themeSelect = this.container.querySelector('#theme-select');
        this.langSelect = this.container.querySelector('#lang-select');
        
        const okButton = this.container.querySelector('button.ok');
        const cancelButton = this.container.querySelector('button.cancel');

        this.loadCurrentSettings();

        okButton.addEventListener('click', () => this.saveAndApply());
        cancelButton.addEventListener('click', () => DisportOS.WindowManager.closeWindow(this.windowId));
    },

    loadCurrentSettings() {
        const settings = DisportOS.state.settings;
        
        if (this.themeSelect) this.themeSelect.value = settings.theme;
        if (this.langSelect) this.langSelect.value = settings.language;
    },

    saveAndApply() {
        const newSettings = {
            theme: this.themeSelect.value,
            language: this.langSelect.value,
        };
        
        const currentSettings = DisportOS.state.settings;

        if (currentSettings.language !== newSettings.language) {
            DisportOS.Dialog.confirm({
                titleKey: 'dialog.restart_required_title',
                messageKey: 'dialog.restart_required_message',
                onConfirm: () => {
                    DisportOS.saveSettings({ ...currentSettings, ...newSettings });
                    window.location.reload();
                },
                onCancel: () => {
                    this.loadCurrentSettings();
                }
            });
        } else {
            DisportOS.saveSettings({ ...currentSettings, ...newSettings });
            DisportOS.applySettings();
            DisportOS.WindowManager.closeWindow(this.windowId);
        }
    }
};