DisportOS.WindowManager = {
    state: {
        openWindows: new Map(),
        zIndexCounter: 100,
        activeWindowId: null
    },

    async createWindow(appData) {
        const windowId = `window-${appData.id}-${Date.now()}`;
        
        const windowElem = document.createElement('div');
        windowElem.className = 'window';
        windowElem.id = windowId;
        windowElem.style.width = `${appData.window.default_width}px`;
        windowElem.style.height = `${appData.window.default_height}px`;
        windowElem.style.top = `${Math.random() * 100 + 50}px`;
        windowElem.style.left = `${Math.random() * 200 + 100}px`;

        windowElem.innerHTML = `
            <div class="title-bar">
                <img src="${appData.icon}" width="16" height="16" style="margin-right: 5px;">
                <span class="title-bar-text">${DisportOS.helpers.getText(appData.window.title_key)}</span>
                <div class="window-controls">
                    <button data-action="minimize" title="Küçült">_</button>
                    <button data-action="maximize" title="Büyüt" ${appData.window.canMaximize ? '' : 'disabled'}>[]</button>
                    <button data-action="close" title="Kapat">X</button>
                </div>
            </div>
            <div class="content">Yükleniyor...</div>
        `;

        document.body.appendChild(windowElem);

        const windowState = {
            element: windowElem,
            state: 'normal',
            appData: appData,
            previousGeometry: null,
            instance: null
        };

        this.state.openWindows.set(windowId, windowState);
        
        await this._loadContent(windowElem, appData.window.content_html_file, windowId, appData);

        if (appData.id === 'app_internet_explorer') {
            const browserInstance = new Browser(windowElem.querySelector('.ie-container'));
            await browserInstance.init();
            windowState.instance = browserInstance;
        }
        
        this._createTaskbarTab(windowId, appData);
        this.focusWindow(windowId);
        this._attachEventListeners(windowElem, windowId);
    },

    focusWindow(windowId) {
        DisportOS.desktop.clearSelection();
        if (this.state.activeWindowId && this.state.activeWindowId !== windowId) {
            const prevWin = this.state.openWindows.get(this.state.activeWindowId);
            if(prevWin) prevWin.element.classList.remove('active');
            document.getElementById(`tab-${this.state.activeWindowId}`)?.classList.remove('active');
        }

        const windowState = this.state.openWindows.get(windowId);
        if (windowState) {
            windowState.element.style.zIndex = ++this.state.zIndexCounter;
            windowState.element.classList.add('active');
            document.getElementById(`tab-${windowId}`)?.classList.add('active');
            this.state.activeWindowId = windowId;
        }
    },

    closeWindow(windowId) {
        const windowState = this.state.openWindows.get(windowId);
        if (windowState) {
            if (windowState.appData.id === 'app_disport' && windowState.instance) {
                windowState.instance.destroy();
            }

            if (windowState.appData.id === 'app_doom') {
                DisportOS.DoomApp.destroy();
            }

            windowState.element.remove();
            this.state.openWindows.delete(windowId);
            this._removeTaskbarTab(windowId);
        }
    },
    
    minimizeWindow(windowId) {
        const windowState = this.state.openWindows.get(windowId);
        if (windowState) {
            windowState.element.style.display = 'none';
            windowState.state = 'minimized';
            document.getElementById(`tab-${windowId}`).classList.remove('active');
            if (this.state.activeWindowId === windowId) {
                this.state.activeWindowId = null;
            }
        }
    },

    restoreWindow(windowId) {
        const windowState = this.state.openWindows.get(windowId);
        if (windowState && windowState.state === 'minimized') {
            windowState.element.style.display = 'flex';
            windowState.state = windowState.element.classList.contains('maximized') ? 'maximized' : 'normal';
            this.focusWindow(windowId);
        }
    },

    toggleMaximize(windowId) {
        const windowState = this.state.openWindows.get(windowId);
        if (!windowState || !windowState.appData.window.canMaximize) return;

        const windowElem = windowState.element;
        if (windowState.state === 'maximized') {
            windowElem.classList.remove('maximized');
            windowState.state = 'normal';
        } else {
            windowElem.classList.add('maximized');
            windowState.state = 'maximized';
        }
    },

    _createTaskbarTab(windowId, appData) {
        const tabsContainer = document.getElementById('window-tabs');
        const tab = document.createElement('button');
        tab.className = 'task-tab';
        tab.id = `tab-${windowId}`;
        tab.innerHTML = `
            <img src="${appData.icon}" alt="">
            <span>${DisportOS.helpers.getText(appData.name_key)}</span>
        `;
        tab.addEventListener('click', () => this._handleTabClick(windowId));
        tabsContainer.appendChild(tab);
    },

    _removeTaskbarTab(windowId) {
        document.getElementById(`tab-${windowId}`)?.remove();
    },

    _handleTabClick(windowId) {
        const windowState = this.state.openWindows.get(windowId);
        if (!windowState) return;

        if (windowState.state === 'minimized') {
            this.restoreWindow(windowId);
        } else {
            if (this.state.activeWindowId === windowId) {
                this.minimizeWindow(windowId);
            } else {
                this.focusWindow(windowId);
            }
        }
    },

    async _loadContent(windowElem, url, windowId, appData) {
        try {
            const contentContainer = windowElem.querySelector('.content');
            const response = await fetch(url);
            if (!response.ok) throw new Error('İçerik yüklenemedi.');
            contentContainer.innerHTML = await response.text();

            DisportOS.helpers.translateElement(contentContainer);

            if (appData.id === 'app_settings') {
                DisportOS.Settings.init(contentContainer, windowId);
            }

            if (appData && appData.id === 'app_notepad') {
                DisportOS.Notepad.init(contentContainer);
            }

            if (appData && appData.id === 'app_disport') {
                const disportContainer = contentContainer.querySelector('.disport-container');
                if (disportContainer) {
                    const appInstance = new DisportApp(disportContainer);
                    await appInstance.init();
                    const windowState = this.state.openWindows.get(windowId);
                    if (windowState) {
                        windowState.instance = appInstance; 
                    }
                }
            }

            if (appData && appData.id === 'app_my_computer') {
                DisportOS.MyComputer.init(contentContainer);
            }

            if (appData && appData.id === 'app_paint') {
                DisportOS.Paint.init(contentContainer);
            }

            if (appData && appData.id === 'app_doom') {
                DisportOS.DoomApp.init(contentContainer);
            }

        } catch (error) {
            windowElem.querySelector('.content').innerHTML = `<p style="color:red; padding: 10px;">${error.message}</p>`;
        }
    },

    _attachEventListeners(windowElem, windowId) {
        const titleBar = windowElem.querySelector('.title-bar');
        windowElem.addEventListener('mousedown', () => this.focusWindow(windowId));
        
        const controls = windowElem.querySelector('.window-controls');
        controls.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'close') this.closeWindow(windowId);
            if (action === 'minimize') this.minimizeWindow(windowId);
            if (action === 'maximize') this.toggleMaximize(windowId);
        });

        titleBar.addEventListener('mousedown', (e) => {
            if (e.target.closest('.window-controls')) return;

            const windowState = this.state.openWindows.get(windowId);
            
            if (windowState.state === 'maximized') {
                const mouseXRatio = e.clientX / windowElem.offsetWidth;

                windowElem.classList.remove('maximized');
                windowState.state = 'normal';

                const newWidth = windowState.appData.window.default_width;
                const newHeight = windowState.appData.window.default_height;
                windowElem.style.width = `${newWidth}px`;
                windowElem.style.height = `${newHeight}px`;

                const newLeft = e.clientX - (newWidth * mouseXRatio);
                const newTop = e.clientY - 15; 

                windowElem.style.left = `${newLeft}px`;
                windowElem.style.top = `${newTop}px`;
            }

            let offsetX = e.clientX - windowElem.offsetLeft;
            let offsetY = e.clientY - windowElem.offsetTop;
            
            const onMouseMove = (moveEvent) => {
                let newLeft = moveEvent.clientX - offsetX;
                let newTop = moveEvent.clientY - offsetY;

                if (newTop < 0) {
                    newTop = 0;
                }

                const maxTop = window.innerHeight - 30 - 30; 
                if (newTop > maxTop) {
                    newTop = maxTop;
                }

                const safeZone = 60; 
                const windowWidth = windowElem.offsetWidth;
                
                const maxLeft = window.innerWidth - safeZone;
                if (newLeft > maxLeft) {
                    newLeft = maxLeft;
                }

                const minLeft = -(windowWidth - safeZone);
                if (newLeft < minLeft) {
                    newLeft = minLeft;
                }

                // ----------------------------------------

                windowElem.style.left = `${newLeft}px`;
                windowElem.style.top = `${newTop}px`;
            };
            
            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
            };
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp, { once: true });
        });
    }
};