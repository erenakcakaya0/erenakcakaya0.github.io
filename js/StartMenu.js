DisportOS.StartMenu = {
    _menuData: [
        { labelKey: 'start_menu.update', icon: 'assets/icons/update.png', disabled: true },
        { isSeparator: true },
        { labelKey: 'start_menu.programs', icon: 'assets/icons/programs.png', disabled: true },
        { labelKey: 'start_menu.favorites', icon: 'assets/icons/favorites.png', disabled: true },
        { labelKey: 'start_menu.documents', icon: 'assets/icons/document.png', disabled: true },
        { isSeparator: true },
        { labelKey: 'start_menu.find', icon: 'assets/icons/find.png', disabled: true },
        { labelKey: 'start_menu.help', icon: 'assets/icons/help.png', disabled: true },
        { labelKey: 'start_menu.run', icon: 'assets/icons/run.png', disabled: true },
        { isSeparator: true },
        { labelKey: 'start_menu.log_off', icon: 'assets/icons/logoff.png', disabled: true },
        { labelKey: 'start_menu.shutdown', icon: 'assets/icons/shutdown.png', disabled: true }
    ],

    create() {
        const menu = document.createElement('div');
        menu.id = 'start-menu';
        
        let itemsHTML = '';
        this._menuData.forEach(item => {
            if (item.isSeparator) {
                itemsHTML += '<div class="start-menu-separator"></div>';
            } else {
                itemsHTML += `
                    <div class="start-menu-item" data-action="${item.action ? 'true' : 'false'}">
                        <img src="${item.icon}" alt="">
                        <span data-lang-key="${item.labelKey}">${item.labelKey}</span>
                    </div>
                `;
            }
        });
        
        menu.innerHTML = `
            <div class="start-menu-sidebar">
                Minidows<span>'95</span>
            </div>
            <div class="start-menu-items">
                ${itemsHTML}
            </div>
        `;
        document.body.appendChild(menu);
        this.element = menu;

        DisportOS.helpers.translateElement(this.element);

        this.element.addEventListener('click', (e) => {
            const itemElement = e.target.closest('.start-menu-item');
            if (itemElement && itemElement.dataset.action === 'true') {
                const key = itemElement.querySelector('span').dataset.langKey;
                const menuItem = this._menuData.find(m => m.labelKey === key);
                menuItem?.action();
                this.close();
            }
        });
    },

    toggle() {
        this.element.classList.toggle('visible');
    },
    close() {
        this.element.classList.remove('visible');
    }
};