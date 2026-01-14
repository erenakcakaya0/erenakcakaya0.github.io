PortfolioOS.StartMenu = {
    init() {
        this.container = null;
    },

    render() {
        if(this.container) this.container.remove();
        
        this.container = document.createElement('div');
        this.container.id = 'start-menu';
        
        // Menü yapısı
        const items = [
            { label: 'start_menu.programs', icon: 'assets/icons/programs.png', hasArrow: true },
            { label: 'start_menu.documents', icon: 'assets/icons/document.png', hasArrow: true },
            { label: 'start_menu.settings', icon: 'assets/icons/settings.png', hasArrow: true },
            { label: 'start_menu.find', icon: 'assets/icons/find.png', hasArrow: true },
            { label: 'start_menu.help', icon: 'assets/icons/help.png' },
            { label: 'start_menu.run', icon: 'assets/icons/run.png' },
            { separator: true },
            { label: 'start_menu.shutdown', icon: 'assets/icons/shutdown.png', action: () => alert('Sistemi kapatmak için tarayıcı sekmesini kapatabilirsiniz.') }
        ];

        let html = '<div class="sidebar"><strong>Windows</strong><span>95</span></div><div class="menu-items">';
        
        items.forEach(item => {
            if (item.separator) {
                html += '<div class="separator"></div>';
            } else {
                html += `
                    <div class="menu-item">
                        <img src="${item.icon}">
                        <span>${PortfolioOS.helpers.getText(item.label)}</span>
                        ${item.hasArrow ? '<span class="arrow">▶</span>' : ''}
                    </div>
                `;
            }
        });
        
        html += '</div>';
        this.container.innerHTML = html;
        document.body.appendChild(this.container);

        const shutdownBtn = this.container.querySelectorAll('.menu-item')[items.length - 1]; // Sonuncusu
        if(shutdownBtn) shutdownBtn.onclick = items[items.length-1].action;
    },

    toggle() {
        if (!this.container) this.render();
        this.container.classList.toggle('visible');
        document.getElementById('start-button').classList.toggle('active');
    },

    close() {
        if (this.container) this.container.classList.remove('visible');
        document.getElementById('start-button')?.classList.remove('active');
    }
};