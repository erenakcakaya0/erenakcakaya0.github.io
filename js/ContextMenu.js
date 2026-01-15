DisportOS.ContextMenu = {
    
    create(items, position) {
        this.close();

        const menu = document.createElement('div');
        menu.id = 'context-menu';
        
        items.forEach(item => {
            if (item.isSeparator) {
                const separator = document.createElement('div');
                separator.className = 'context-menu-separator';
                menu.appendChild(separator);
            } else {
                const menuItem = document.createElement('div');
                menuItem.className = 'context-menu-item';
                
                menuItem.textContent = item.isRawText ? item.label : DisportOS.helpers.getText(item.labelKey);

                if (item.disabled) {
                    menuItem.classList.add('disabled');
                } else {
                    menuItem.addEventListener('click', () => {
                        item.action();
                        this.close();
                    });
                }
                menu.appendChild(menuItem);
            }
        });
        
        document.body.appendChild(menu);

        const menuWidth = menu.offsetWidth;
        const menuHeight = menu.offsetHeight;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        let left = position.x;
        let top = position.y;

        if (left + menuWidth > screenWidth) {
            left = screenWidth - menuWidth;
        }
        if (top + menuHeight > screenHeight) {
            top = screenHeight - menuHeight;
        }

        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;
    },

    close() {
        const menu = document.getElementById('context-menu');
        if (menu) {
            menu.remove();
        }
    }
};