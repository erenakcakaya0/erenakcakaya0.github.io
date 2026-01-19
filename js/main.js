const DisportOS = {
    state: {
        apps: [],
        languageData: {},
        currentLanguage: 'en',
        dialogueStates: {},
        selectedIcons: new Set(),
        isDragging: false,
        listenersInitialized: false,
        settings: {
            theme: 'win95-classic',
            language: 'en',
        },
    },

    async init() {
        this.loadSettings();
        this.applySettings();
        this.loadGameState();

        try {
            const [appsData, langData, filterData] = await Promise.all([
                this.helpers.loadJSON('data/apps.json'),
                this.helpers.loadJSON('data/languages.json'),
                this.helpers.loadJSON('data/search-filter.json')
            ]);

            this.state.apps = appsData;
            this.state.languageData = langData;
            this.state.searchFilterData = filterData;
            
            // this.handleLoginProcess();
            this.startSession();

        } catch (error) {
            document.body.innerHTML = "<h2 style='color:white; background:blue; padding:20px;'>System Error</h2>";
        }
    },

    handleLoginProcess() {
        const desktop = document.getElementById('desktop');
        const taskbar = document.getElementById('taskbar');
        if (desktop) desktop.style.display = 'none';
        if (taskbar) taskbar.style.display = 'none';

        DisportOS.Login.render(() => {
            this.startSession();
        });
    },

    startSession() {
        const desktop = document.getElementById('desktop');
        const taskbar = document.getElementById('taskbar');
        if (desktop) desktop.style.display = 'block';
        if (taskbar) taskbar.style.display = 'flex';

        this.applySettings();

        DisportOS.Clock.init();
        
        if (document.getElementById('start-menu')) {
            document.getElementById('start-menu').remove();
        }
        DisportOS.StartMenu.create();
        
        this.ui.updateStaticTexts();
        this.ui.createDesktopIcons();

        if (DisportOS.DisportService && !DisportOS.DisportService.isReady) {
            DisportOS.DisportService.init();
        }

        if (!this.state.listenersInitialized) {
            this.initEventListeners();
            this.state.listenersInitialized = true;
        }
    },

    shutdown() {
        
    },


    quitApplication() {
        console.log("NO QUIT!");
    },

    Login: {
        dailyConfig: {
            1: { passwordKey: "login.password_day1", hintKey: "login.hint_day1" },
            2: { passwordKey: "login.password_day2", hintKey: "login.hint_day2" },
            3: { passwordKey: "login.password_day3", hintKey: "login.hint_day3" },
            4: { passwordKey: "login.password_day4", hintKey: "login.hint_day4" },
            5: { useComputerName: true, hintKey: "login.hint_day5" }
        },

        render(onSuccessCallback) {
            const existing = document.getElementById('login-overlay');
            if (existing) existing.remove();

            const settings = DisportOS.state.settings;
            const currentDay = DisportOS.state.currentGameDay || 1;
            const dayData = this.dailyConfig[currentDay] || this.dailyConfig[1];
            
            let targetPassword = "";
            if (dayData.useComputerName) {
                targetPassword = settings.computerName;
            } else {
                targetPassword = DisportOS.helpers.getText(dayData.passwordKey);
            }
            
            const txt = {
                title: DisportOS.helpers.getText('login.title'),
                role: DisportOS.helpers.getText('login.role'),
                label: DisportOS.helpers.getText('login.password_label'),
                shutdown: DisportOS.helpers.getText('login.shutdown'),
                ok: DisportOS.helpers.getText('login.ok'),
                hint: DisportOS.helpers.getText(dayData.hintKey)
            };

            const overlay = document.createElement('div');
            overlay.id = 'login-overlay';
            
            overlay.innerHTML = `
                <div class="login-window">
                    <div class="login-title-bar"><span>${txt.title}</span></div>
                    <div class="login-content">
                        <div class="login-user-profile">
                            <img src="${settings.avatar}" class="login-avatar" alt="User">
                            <div class="login-info">
                                <span class="login-username">${settings.computerName}</span>
                                <span style="font-size: 11px; color: #666;">${txt.role}</span>
                            </div>
                        </div>
                        <div class="login-input-group">
                            <label>${txt.label}</label>
                            <input type="password" id="login-password" class="login-input" autofocus>
                            <div id="login-hint" class="password-hint">${txt.hint}</div>
                        </div>
                        <div class="login-actions">
                            <button id="btn-shutdown-system" class="login-btn login-shutdown-btn">
                                <img src="assets/icons/shutdown.png" width="16" height="16"> ${txt.shutdown}
                            </button>
                            <button id="btn-login-ok" class="login-btn" style="font-weight:bold;">${txt.ok}</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const passInput = overlay.querySelector('#login-password');
            const hintDiv = overlay.querySelector('#login-hint');

            const checkPass = () => {
                const inputVal = passInput.value.trim().toLowerCase();
                const targetVal = String(targetPassword).trim().toLowerCase();

                if (inputVal === targetVal) {
                    overlay.style.opacity = '0';
                    setTimeout(() => {
                        overlay.remove();
                        if (onSuccessCallback) onSuccessCallback();
                    }, 1000);
                } else {
                    passInput.value = '';
                    passInput.classList.add('shake-anim');
                    hintDiv.style.display = 'block';
                    setTimeout(() => {
                        passInput.classList.remove('shake-anim');
                        passInput.focus();
                    }, 500);
                }
            };

            overlay.querySelector('#btn-login-ok').addEventListener('click', checkPass);
            
            passInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') checkPass();
            });

            overlay.querySelector('#btn-shutdown-system').addEventListener('click', () => {
                console.log("??? this not a game bro... you can't shutdown");
                DisportOS.Dialog.confirm({
                    titleKey: 'dialog.quit_confirm_title',
                    messageKey: 'dialog.quit_confirm_message',
                    onConfirm: () => DisportOS.quitApplication(),
                });
            });
            
            setTimeout(() => passInput.focus(), 100);
        }
    },

    loadGameState() {
        const savedState = localStorage.getItem('disport_gamestate');
        if (savedState) {
            const gameState = JSON.parse(savedState);
            this.state.currentGameDay = gameState.currentGameDay || 1;
            this.state.dialogueStates = gameState.dialogueStates || {};
            this.state.playerChoices = gameState.playerChoices || {};
            this.state.playerAttributes = gameState.playerAttributes || {};
            this.state.friendStatuses = gameState.friendStatuses || {};
            this.state.gameTime = gameState.clock || { hour: 9, minute: 0 };
        }
    },

    saveGameState() {
        const gameState = {
            currentGameDay: this.state.currentGameDay,
            dialogueStates: this.state.dialogueStates,
            playerChoices: this.state.playerChoices,
            playerAttributes: this.state.playerAttributes,
            friendStatuses: this.state.friendStatuses,
            clock: this.state.gameTime
        };
        localStorage.setItem('disport_gamestate', JSON.stringify(gameState));
    },

    loadSettings() {
        const savedSettings = localStorage.getItem('disport_settings');
        if (savedSettings) {
            this.state.settings = JSON.parse(savedSettings);
        }
        this.state.currentLanguage = this.state.settings.language;
    },

    saveSettings(newSettings) {
        this.state.settings = newSettings;
        localStorage.setItem('disport_settings', JSON.stringify(newSettings));
    },

    applySettings() {
        const themeLink = document.getElementById('theme-link');
        if (themeLink) {
            themeLink.href = `assets/themes/${this.state.settings.theme}.css`;
        }
    },

    helpers: {
        async loadJSON(url) {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        },
        getText(key) {
            const keys = key.split('.');
            let result = DisportOS.state.languageData[DisportOS.state.currentLanguage];
            for (const k of keys) {
                result = result?.[k];
            }
            return result || key;    
        },
        isOverlapping(elem1, elem2) {
            const rect1 = elem1.getBoundingClientRect();
            const rect2 = elem2.getBoundingClientRect();
            return !(
                rect1.right < rect2.left ||
                rect1.left > rect2.right ||
                rect1.bottom < rect2.top ||
                rect1.top > rect2.bottom
            );
        },
        translateElement(element) {
            element.querySelectorAll('[data-lang-key]').forEach(el => {
                const key = el.dataset.langKey;
                const text = el.textContent = DisportOS.helpers.getText(key);
                if (text.includes('<')) {
                    el.innerHTML = text;
                } else {
                    el.textContent = text;
                }
            });
        },
        removeDesktopSelection() {
            const selectedIcon = document.querySelector('.desktop-icon.selected');
            if (selectedIcon) {
                selectedIcon.classList.remove('selected');
                DisportOS.state.selectedIcons.clear();
            }
        },
        levenshteinDistance(a, b) {
            const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
            for (let i = 0; i <= a.length; i += 1) { matrix[0][i] = i; }
            for (let j = 0; j <= b.length; j += 1) { matrix[j][0] = j; }
            for (let j = 1; j <= b.length; j += 1) {
                for (let i = 1; i <= a.length; i += 1) {
                    const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
                    matrix[j][i] = Math.min(
                        matrix[j][i - 1] + 1,
                        matrix[j - 1][i] + 1,
                        matrix[j - 1][i - 1] + indicator,
                    );
                }
            }
            return matrix[b.length][a.length];
        },
        filterSearchQuery(query, knownKeywords) {
             const cleanQuery = query.toLowerCase().trim();
             const filterData = DisportOS.state.searchFilterData;
             if (filterData && filterData.hasOwnProperty(cleanQuery)) {
                 return filterData[cleanQuery];
             }
             return query; 
        },
        shuffleArray(array) {
            let currentIndex = array.length,  randomIndex;
            while (currentIndex != 0) {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex--;
                [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
            }
            return array;
        }
    },

    desktop: {
        selectIcon(iconElement, multiSelect = false) {
            if (!multiSelect) this.clearSelection();
            iconElement.classList.add('selected');
            DisportOS.state.selectedIcons.add(iconElement);
        },
        toggleIconSelection(iconElement) {
            if (iconElement.classList.contains('selected')) {
                iconElement.classList.remove('selected');
                DisportOS.state.selectedIcons.delete(iconElement);
            } else {
                iconElement.classList.add('selected');
                DisportOS.state.selectedIcons.add(iconElement);
            }
        },
        clearSelection() {
            DisportOS.state.selectedIcons.forEach(icon => icon.classList.remove('selected'));
            DisportOS.state.selectedIcons.clear();
        }
    },

    apps: {
        launch(appId) {
            const appData = DisportOS.state.apps.find(app => app.id === appId);
            if (!appData) return;

            DisportOS.helpers.removeDesktopSelection();

            let existingWindowId = null;
            if (!appData.window.allowMultipleInstances) {
                for (const [id, windowState] of DisportOS.WindowManager.state.openWindows.entries()) {
                    if (windowState.appData.id === appId) {
                        existingWindowId = id;
                        break;
                    }
                }
            }

            if (existingWindowId) {
                DisportOS.WindowManager.restoreWindow(existingWindowId);
                DisportOS.WindowManager.focusWindow(existingWindowId);
            } else {
                DisportOS.WindowManager.createWindow(appData);
            }

            const app = DisportOS.state.apps.find(a => a.id === appId);
        }
    },

    ui: {
        createDesktopIcons() {
            const desktop = document.getElementById('desktop');
            desktop.innerHTML = '';

            DisportOS.state.apps.forEach(app => {
                const iconDiv = document.createElement('div');
                iconDiv.className = 'desktop-icon';
                iconDiv.setAttribute('data-app-id', app.id);
                iconDiv.title = DisportOS.helpers.getText(app.name_key);

                const iconImg = document.createElement('img');
                iconImg.src = app.icon;

                const iconSpan = document.createElement('span');
                iconSpan.textContent = DisportOS.helpers.getText(app.name_key);

                iconDiv.appendChild(iconImg);
                iconDiv.appendChild(iconSpan);

                let touchStartX = 0;
                let touchStartY = 0;
                let isIconDragging = false;

                iconDiv.addEventListener('touchstart', (e) => {
                    const touch = e.touches[0];
                    touchStartX = touch.clientX;
                    touchStartY = touch.clientY;
                    isIconDragging = false;
                    
                    DisportOS.desktop.selectIcon(iconDiv);
                }, { passive: true });

                iconDiv.addEventListener('touchmove', (e) => {
                    const touch = e.touches[0];
                    const diffX = Math.abs(touch.clientX - touchStartX);
                    const diffY = Math.abs(touch.clientY - touchStartY);

                    if (diffX > 5 || diffY > 5) {
                        isIconDragging = true;
                    }
                }, { passive: true });

                iconDiv.addEventListener('touchend', (e) => {
                    if (!isIconDragging) {
                        e.preventDefault();
                        DisportOS.apps.launch(app.id);
                        
                        setTimeout(() => {
                            DisportOS.desktop.clearSelection();
                        }, 500);
                    }
                });
                // ----------------------------------------

                desktop.appendChild(iconDiv);
            });
        },
        updateStaticTexts() {
            const btn = document.querySelector('#start-button span');
            if(btn) btn.textContent = DisportOS.helpers.getText('start_menu.start');
        },
        rerenderAllText() {
            this.createDesktopIcons();
            this.updateStaticTexts();
            if (DisportOS.StartMenu.element) DisportOS.helpers.translateElement(DisportOS.StartMenu.element);
        }
    },
    
    initEventListeners() {
        const getClientPos = (e) => {
            if (e.touches && e.touches.length > 0) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
            return { x: e.clientX, y: e.clientY };
        };

        document.addEventListener('mouseup', (e) => {
            const button = e.target.closest('button');
            if (button) button.blur();
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('#context-menu')) DisportOS.ContextMenu.close();

            if (!e.target.closest('#start-menu') && e.target.id !== 'start-button' && !e.target.closest('#start-button')) {
                DisportOS.StartMenu.close();
            }

            const icon = e.target.closest('.desktop-icon');
            if (!icon && !e.target.closest('.window') && !e.target.closest('#taskbar')) {
                if (DisportOS.state.isDragging) {
                    DisportOS.state.isDragging = false;
                    return;
                }
                DisportOS.desktop.clearSelection();
            } else if (icon) {
                const multiSelect = e.ctrlKey || e.metaKey;
                if (multiSelect) DisportOS.desktop.toggleIconSelection(icon);
                else DisportOS.desktop.selectIcon(icon);
            }
        });

        const startBtn = document.getElementById('start-button');
        if(startBtn) startBtn.addEventListener('click', () => DisportOS.StartMenu.toggle());

        const desktop = document.getElementById('desktop');
        if(desktop) {
            desktop.addEventListener('dblclick', (e) => {
                const icon = e.target.closest('.desktop-icon');
                if (icon) DisportOS.apps.launch(icon.dataset.appId);
            });

            let selectionBox = null;
            let startX, startY;

            const startSelection = (e) => {
                if ((e.type === 'mousedown' && e.button !== 0) || 
                    e.target.closest('.desktop-icon') || 
                    e.target.closest('.window')) return;
                
                // e.preventDefault(); 

                const pos = getClientPos(e);
                startX = pos.x;
                startY = pos.y;

                const onMove = (moveEvent) => {
                    const movePos = getClientPos(moveEvent);
                    
                    if (!DisportOS.state.isDragging) {
                        if (Math.abs(movePos.x - startX) > 5 || Math.abs(movePos.y - startY) > 5) {
                            DisportOS.state.isDragging = true;
                            
                            if (!moveEvent.ctrlKey && !moveEvent.metaKey) DisportOS.desktop.clearSelection();
                            
                            selectionBox = document.createElement('div');
                            selectionBox.id = 'selection-box';
                            document.body.appendChild(selectionBox);
                        }
                    }

                    if (DisportOS.state.isDragging && selectionBox) {
                        if(moveEvent.type === 'touchmove') moveEvent.preventDefault();

                        const left = Math.min(startX, movePos.x);
                        const top = Math.min(startY, movePos.y);
                        const width = Math.abs(startX - movePos.x);
                        const height = Math.abs(startY - movePos.y);

                        selectionBox.style.left = `${left}px`;
                        selectionBox.style.top = `${top}px`;
                        selectionBox.style.width = `${width}px`;
                        selectionBox.style.height = `${height}px`;

                        document.querySelectorAll('.desktop-icon').forEach(icon => {
                            if (DisportOS.helpers.isOverlapping(selectionBox, icon)) {
                                icon.classList.add('selected'); 
                                DisportOS.state.selectedIcons.add(icon);
                            } else if (!moveEvent.ctrlKey && !moveEvent.metaKey) {
                                icon.classList.remove('selected'); 
                                DisportOS.state.selectedIcons.delete(icon);
                            }
                        });
                    }
                };

                const onEnd = () => {
                    if (selectionBox) { selectionBox.remove(); selectionBox = null; }
                    
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onEnd);
                    document.removeEventListener('touchmove', onMove);
                    document.removeEventListener('touchend', onEnd);

                    setTimeout(() => {
                        DisportOS.state.isDragging = false;
                    }, 50);
                };

                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onEnd);
                document.addEventListener('touchmove', onMove, { passive: false });
                document.addEventListener('touchend', onEnd);
            };

            desktop.addEventListener('mousedown', startSelection);
            desktop.addEventListener('touchstart', startSelection, { passive: false });
        }

        document.addEventListener('contextmenu', (e) => {
            e.preventDefault(); 
            let menuItems = [];
            
            let clientX = e.clientX;
            let clientY = e.clientY;
            if(clientX === undefined && e.touches && e.touches.length > 0) {
                 clientX = e.touches[0].clientX;
                 clientY = e.touches[0].clientY;
            }

            const position = { x: clientX, y: clientY };
            const desktopIcon = e.target.closest('.desktop-icon');
            const taskbarTab = e.target.closest('.task-tab');

            if (desktopIcon) {
                const appId = desktopIcon.dataset.appId;
                menuItems = [
                    { labelKey: 'context_menu.icon.open', action: () => DisportOS.apps.launch(appId) },
                    { isSeparator: true },
                    { labelKey: 'context_menu.icon.cut', disabled: true },
                    { labelKey: 'context_menu.icon.copy', disabled: true },
                    { labelKey: 'context_menu.icon.delete', disabled: true }
                ];
            } else if (taskbarTab) {
                const windowId = taskbarTab.id.replace('tab-', '');
                const windowState = DisportOS.WindowManager.state.openWindows.get(windowId);
                const appName = DisportOS.helpers.getText(windowState.appData.name_key);
                menuItems = [
                    { label: appName, isRawText: true, disabled: true },
                    { labelKey: 'context_menu.taskbar.close', action: () => DisportOS.WindowManager.closeWindow(windowId) }
                ];
            } else if (e.target.id === 'desktop') {
                menuItems = [
                    { labelKey: 'context_menu.desktop.view', disabled: true },
                    { labelKey: 'context_menu.desktop.sort_by', disabled: true },
                    { labelKey: 'context_menu.desktop.refresh', action: () => {
                        DisportOS.ui.createDesktopIcons();
                        }
                    },
                    { labelKey: 'context_menu.desktop.new', disabled: true }
                ];
            }

            if (menuItems.length > 0) DisportOS.ContextMenu.create(menuItems, position);
            else DisportOS.ContextMenu.close();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && DisportOS.state.selectedIcons.size === 1 && DisportOS.WindowManager.state.activeWindowId === null) {
                const singleIcon = DisportOS.state.selectedIcons.values().next().value;
                DisportOS.apps.launch(singleIcon.dataset.appId);
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    DisportOS.init();
});