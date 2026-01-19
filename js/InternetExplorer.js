class Browser {
    constructor(contentContainer) {
        this.container = contentContainer;
        this.sites = null;
        this.history = [];
        this.historyIndex = -1;
        this.isLoading = false;
        
        this.elements = {
            backBtn: this.container.querySelector('#ie-back-btn'),
            forwardBtn: this.container.querySelector('#ie-forward-btn'),
            refreshBtn: this.container.querySelector('#ie-refresh-btn'),
            homeBtn: this.container.querySelector('#ie-home-btn'),
            searchBtn: this.container.querySelector('#ie-search-btn'),
            urlInput: this.container.querySelector('#ie-url-input'),
            progressBar: this.container.querySelector('#ie-progress-bar'),
            contentArea: this.container.querySelector('#ie-content')
        };

        this._attachEventListeners();
    }

    async init() {
        this.sites = await DisportOS.helpers.loadJSON('data/sites.json');
        
        const startUrl = DisportOS.state.pendingOpenUrl || 'http://www.boogle.com';
        
        if (DisportOS.state.pendingOpenUrl) {
            DisportOS.state.pendingOpenUrl = null;
        }

        this.navigate(startUrl);
    }

    navigate(url, addToHistory = true, isVisitable = true) {
        this._stopDinoGame();
        if (this.isLoading) return;
        this.isLoading = true;
        
        if (addToHistory) {
            if (this.historyIndex < this.history.length - 1) {
                this.history.splice(this.historyIndex + 1);
            }
            this.history.push({ url: url, isVisitable: isVisitable });
            this.historyIndex = this.history.length - 1;
        }

        this.elements.urlInput.value = url;
        this._startLoadingAnimation();
        this._updateNavButtons();

        const duration = (Math.random() * (1.6 - 0.8) + 0.8);
        setTimeout(() => {
            this._renderPage(url, isVisitable);
            this.isLoading = false;
        }, duration * 1000);
    }

    _renderPage(url, isVisitable) {
        if (!isVisitable) {
            this._renderErrorPage();
            return;
        }
        if (url.startsWith('http://www.youview')) {
            const windowState = DisportOS.WindowManager.state.openWindows.get(this.container.closest('.window').id);
            
            if (windowState && windowState.instance instanceof YouViewApp) {
                windowState.instance.handleNavigation(url);
            } else {
                fetch('apps/youview/main.html')
                    .then(response => response.text())
                    .then(html => {
                        this.elements.contentArea.innerHTML = html;
                        DisportOS.helpers.translateElement(this.elements.contentArea);
                        const youviewInstance = new YouViewApp(this.elements.contentArea.querySelector('.youview-container'), this);
                        if (windowState) windowState.instance = youviewInstance; 
                        youviewInstance.init();
                    });
            }
            return;
        }

        const contentArea = this.elements.contentArea;

        if (url === 'http://www.boogle.com') {
            this._renderBoogleHome();
        } else if (url.includes('boogle.com/search?q=')) {
            const query = url.split('q=')[1];
            this._renderSearchResults(decodeURIComponent(query));
        } else if (url === 'http://www.dome-metamars.com') {
            this._renderSiteDetails('apps/ie-pages/dome-metamars.html');
        } else if (url === 'http://www.antlerds-song.com') {
            this._renderSiteDetails('apps/ie-pages/antlerds-song.html');
        }else if (url === 'http://www.basilantus.net') {
            this._renderSiteDetails('apps/ie-pages/basilantus.html');
        }else if (url === 'http://www.disport-os.com') {
            this._renderSiteDetails('apps/ie-pages/disport.html');
        }else if (url.startsWith('http://www.dialogue-editor.com')) {
            fetch('apps/ie-pages/dialogue-editor.html')
                .then(response => response.text())
                .then(html => {
                    this.elements.contentArea.innerHTML = html;
                    
                    const path = url.replace('http://www.dialogue-editor.com', '');
                    const contentDiv = this.elements.contentArea.querySelector('#dialogue-content');
                    
                    if (path === '' || path === '/') {
                        this._renderDialogueHome(contentDiv);
                    } else if (path === '/nodes') {
                        this._renderDialogueNodes(contentDiv);
                    } else if (path === '/io') {
                        this._renderDialogueIO(contentDiv);
                    }else if (path === '/state') {
                        this._renderDialogueState(contentDiv);
                    }else {
                        contentDiv.innerHTML = "<h1>Error!</h1><p>Page not found.</p>";
                    }

                    DisportOS.helpers.translateElement(this.elements.contentArea);
                })
                .catch(err => {
                    console.error(err);
                    this.elements.contentArea.innerHTML = "<h1>404 - File Not Found</h1>";
                });
            return;
        }else if (url === 'http://www.cellblock-zero.com') {
            this._renderSiteDetails('apps/ie-pages/cellblock.html');
        }else if (url === 'http://www.lucifersbargain.com') {
            this._renderSiteDetails('apps/ie-pages/lucifers-bargain.html');
        }else if (url === 'http://www.pixebit.io') {
            this._renderSiteDetails('apps/ie-pages/pixebit.html');
        }else if (url === 'http://www.ue-combat-sys.com') {
            this._renderSiteDetails('apps/ie-pages/unreal-combat.html');
        }else if (url === 'http://www.eren-content.com') {
            this._renderSiteDetails('apps/ie-pages/eren-content.html');
        }else if (url === 'http://www.backend-proto.com') {
            this._renderSiteDetails('apps/ie-pages/backend-mobile.html');
        }
        
        
        else {
                const site = Object.values(this.sites).find(s => s.url === url);
                if (site && site.isVisitable) {
                const title = DisportOS.helpers.getText(site.titleKey);
                this.elements.contentArea.innerHTML = `<h1>${title}</h1><p>No Find!</p>`;
            } 
            else {
                this._renderErrorPage();
            }
        }
    }

    _renderSiteDetails(sitelink)
    {
        fetch(sitelink)
            .then(response => response.text())
            .then(html => {
                this.elements.contentArea.innerHTML = html;
                DisportOS.helpers.translateElement(this.elements.contentArea);
            })
            .catch(err => {
                this.elements.contentArea.innerHTML = "<h1>404 - File Not Found</h1>";
            });
        return;
    }

    _renderBoogleHome() {
        fetch('apps/ie-pages/boogle-home.html')
        .then(response => response.text())
        .then(html => {
            this.elements.contentArea.innerHTML = html;
            DisportOS.helpers.translateElement(this.elements.contentArea);
        });
    }
    
    _renderSearchResults(query) {
        const sanitizedQuery = query.replace(/"/g, '&quot;');
        fetch('apps/ie-pages/boogle-results.html')
            .then(response => response.text())
            .then(html => {
                this.elements.contentArea.innerHTML = html;
                const searchInput = this.elements.contentArea.querySelector('#boogle-search-input');
                const resultsList = this.elements.contentArea.querySelector('#search-results-list');
                
                searchInput.value = sanitizedQuery;

                let searchResultsHTML = `<h2>'${query}' için arama sonuçları:</h2>`;
                const queryKey = query.toLowerCase();
                const querySlug = query.replace(/\s+/g, '-').toLowerCase();

                const siteData = this.sites[queryKey];

                if (siteData) {
                    const title = DisportOS.helpers.getText(siteData.titleKey);
                    const description = DisportOS.helpers.getText(siteData.descriptionKey);
                    searchResultsHTML += this._buildResult(title, siteData.url, siteData.isVisitable, description);
                    
                    const combinedResults = [...siteData.relatedResults, ...this.sites.generic_results];
                    
                    const shuffledResults = DisportOS.helpers.shuffleArray(combinedResults);
                    
                    shuffledResults.forEach(res => {
                        let resTitle = DisportOS.helpers.getText(res.titleKey).replace(/{query}/g, query);
                        const resUrl = res.url.replace(/{query-slug}/g, querySlug);
                        let resDescription = DisportOS.helpers.getText(res.descriptionKey).replace(/{query}/g, query);
                        searchResultsHTML += this._buildResult(resTitle, resUrl, res.isVisitable, resDescription);
                    });

                } 
                else {
                    const shuffledResults = DisportOS.helpers.shuffleArray([...this.sites.generic_results]);
                    
                    shuffledResults.forEach(res => {
                        let resTitle = DisportOS.helpers.getText(res.titleKey).replace(/{query}/g, query);
                        const resUrl = res.url.replace(/{query-slug}/g, querySlug);
                        let resDescription = DisportOS.helpers.getText(res.descriptionKey).replace(/{query}/g, query);
                        searchResultsHTML += this._buildResult(resTitle, resUrl, res.isVisitable, resDescription);
                    });
                }
                
                resultsList.innerHTML = searchResultsHTML;
                DisportOS.helpers.translateElement(this.elements.contentArea);
            });
    }

    _buildResult(title, url, isVisitable, description) {
        const urlText = url ? url : 'http://www.error.com';
        return `
            <div class="search-result">
                <h3><a href="#" data-url="${url}" data-is-visitable="${isVisitable}">${title}</a></h3>
                <span>${urlText}</span>
                <p>${description}</p>
            </div>
        `;
    }

    _renderErrorPage() {
        fetch('apps/ie-pages/network-error.html')
        .then(response => response.text())
        .then(html => {
            this.elements.contentArea.innerHTML = html;
            DisportOS.helpers.translateElement(this.elements.contentArea);
            this._startDinoGame();
        });
    }

    _openLightbox(imgSrc) {
        const overlay = document.createElement('div');
        overlay.className = 'ie-lightbox-overlay';
        
        const img = document.createElement('img');
        img.src = imgSrc;
        img.className = 'ie-lightbox-image';
        
        overlay.onclick = () => {
            overlay.remove();
        };
        
        overlay.appendChild(img);
        
        this.container.appendChild(overlay); 
    }
    
    _stopDinoGame() {
        if (this.dinoInterval) clearInterval(this.dinoInterval);
        if (this.dinoHandler) document.removeEventListener('keydown', this.dinoHandler);
        this.dinoInterval = null;
        this.dinoHandler = null;
    }

    _startDinoGame() {
        const dino = this.elements.contentArea.querySelector('#dino');
        const cactus = this.elements.contentArea.querySelector('#cactus');
        const msgElement = this.elements.contentArea.querySelector('p[data-lang-key]'); 
        
        if (!dino || !cactus) return;

        let isRunning = false;
        
        const jump = () => {
            if (!dino.classList.contains("jump")) {
                dino.classList.add("jump");
                setTimeout(() => dino.classList.remove("jump"), 500);
            }
        };

        const startGame = () => {

        };

        const gameOver = () => {
            isRunning = false;
            clearInterval(this.dinoInterval);
            cactus.classList.remove('moving');
            if(msgElement) msgElement.innerHTML = "<b>OYUN BİTTİ!</b><br>Tekrar oynamak için BOŞLUK tuşuna bas.";
        };

        this.dinoHandler = (e) => {
            if (e.code === "Space" && document.body.contains(dino)) {
                e.preventDefault(); 
                
                if (!isRunning) {
                    startGame();
                    jump();
                } else {
                    jump();
                }
            }
        };

        document.addEventListener('keydown', this.dinoHandler);
    }

    _startLoadingAnimation() {
       const bar = this.elements.progressBar;

        bar.classList.remove('fading-out');
        bar.style.transition = 'none';
        bar.style.width = '0%';
        
        setTimeout(() => {
            const duration = (Math.random() * (1.6 - 0.8) + 0.8);
            
            bar.style.transition = `width ${duration}s linear, opacity 0.5s ease-out`;
            bar.style.width = '100%';

            setTimeout(() => {
                bar.classList.add('fading-out');
            }, duration * 1000);
            
        }, 50); 
    }

    _updateNavButtons() {
        this.elements.backBtn.disabled = this.historyIndex <= 0;
        this.elements.forwardBtn.disabled = this.historyIndex >= this.history.length - 1;
    }

    _attachEventListeners() {
        this.elements.backBtn.addEventListener('click', () => {
            if (this.historyIndex > 0) {
                this.historyIndex--;
                const historyItem = this.history[this.historyIndex];
                this.navigate(historyItem.url, false, historyItem.isVisitable);
            }
        });

        this.elements.forwardBtn.addEventListener('click', () => {
            if (this.historyIndex < this.history.length - 1) {
                this.historyIndex++;
                const historyItem = this.history[this.historyIndex];
                this.navigate(historyItem.url, false, historyItem.isVisitable);
            }
        });
        
        this.elements.refreshBtn.addEventListener('click', () => {
            if (this.history.length > 0) {
                const historyItem = this.history[this.historyIndex];
                this.navigate(historyItem.url, false, historyItem.isVisitable);
            }
        });
        
        this.elements.homeBtn.addEventListener('click', () => this.navigate('http://www.boogle.com'));
        //this.elements.searchBtn.addEventListener('click', () => this.navigate('http://www.boogle.com'));

        this.elements.contentArea.addEventListener('submit', (e) => {
            if (e.target.id === 'boogle-search-form') {
                e.preventDefault();
                const searchInput = e.target.querySelector('#boogle-search-input');
                const query = searchInput.value;

                if (query) {
                    const knownKeywords = Object.keys(this.sites).filter(k => this.sites[k].isVisitable);
                    
                    const filteredQuery = DisportOS.helpers.filterSearchQuery(query, knownKeywords);
                    
                    if (query !== filteredQuery) {
                        searchInput.value = filteredQuery;
                    }
                    
                    this.navigate(`http://www.boogle.com/search?q=${encodeURIComponent(filteredQuery)}`);
                }
            }
        });
        
        this.elements.contentArea.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            
            if (!link) return;

            if (link.classList.contains('external-link')) {
                e.preventDefault();
                const realUrl = link.dataset.url;
                if (realUrl) {
                    window.open(realUrl, '_blank');
                }
                return;
            }

            if (link.dataset.url) {
                e.preventDefault();
                const url = link.dataset.url;
                const isVisitable = link.dataset.isVisitable === 'true'; 
                this.navigate(url, true, isVisitable);
            }
        });

        this.elements.contentArea.addEventListener('click', (e) => {
            if (e.target.classList.contains('clickable-image')) {
                this._openLightbox(e.target.src);
            }
        });
    }

    _renderDialogueHome(container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <img src="assets/icons/tool.png" width="64" style="margin-bottom: 20px;">
                <h1 style="color: #fff;" data-lang-key="sites.dialogue_editor_home_title">Visual Dialogue Editor</h1>
                <p style="color: #ccc; max-width: 600px; margin: 0 auto 30px auto;" data-lang-key="sites.dialogue_editor_home_desc">...</p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; max-width: 800px; margin: 0 auto 40px auto;">
                    <a href="#" data-url="http://www.dialogue-editor.com/nodes" data-is-visitable="true" class="doc-btn" data-lang-key="sites.dialogue_editor_btn_nodes">Nodes</a>
                    <a href="#" data-url="http://www.dialogue-editor.com/state" data-is-visitable="true" class="doc-btn" data-lang-key="sites.dialogue_editor_btn_state">State</a>
                    <a href="#" data-url="http://www.dialogue-editor.com/io" data-is-visitable="true" class="doc-btn" data-lang-key="sites.dialogue_editor_btn_io">IO</a>
                </div>

                <div style="border-top: 1px solid #444; padding-top: 30px; max-width: 800px; margin: 0 auto;">
                    <h3 style="color: #4ec9b0; margin-bottom: 10px;" data-lang-key="sites.dialogue_editor_app_ui_title">Uygulama ve Arayüz</h3>
                    <p style="color: #aaa; font-size: 13px; margin-bottom: 20px;" data-lang-key="sites.dialogue_editor_app_ui_desc">...</p>
                    
                    <a href="#" class="external-link doc-btn-outline" 
                       data-url="https://github.com"
                       data-lang-key="sites.dialogue_editor_btn_repo">
                       [ GitHub Reposuna Git ]
                    </a>
                </div>
                
                <style>
                    .doc-btn {
                        display: block; padding: 15px; background: #333; color: white; text-decoration: none;
                        border: 1px solid #444; border-radius: 5px; text-align: center; font-weight: bold;
                        transition: all 0.2s;
                    }
                    .doc-btn:hover { background: #007acc; border-color: #007acc; transform: translateY(-2px); }

                    .doc-btn-outline {
                        display: inline-block; padding: 10px 20px; background: transparent; color: #4ec9b0; 
                        text-decoration: none; border: 1px solid #4ec9b0; border-radius: 5px; font-weight: bold;
                        font-family: 'Consolas', monospace; transition: all 0.2s;
                    }
                    .doc-btn-outline:hover { background: #4ec9b0; color: #1e1e1e; }
                </style>
            </div>
        `;
    }

    _renderDialogueNodes(container) {
        const h = (code) => {
            let safeCode = code
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");

            safeCode = safeCode.replace(/(".*?")/g, '<span class="code-string">$1</span>');
            safeCode = safeCode.replace(/`([^`]+)`/g, '<span class="code-string">`$1`</span>');
            
            safeCode = safeCode.replace(/\/\/.*$/gm, '<span class="code-comment">$&</span>');

            safeCode = safeCode.replace(/\b(function|var|let|const|this|return|if|else|new|import|export|switch|case|break|default|Object|assign|prototype)\b/g, '<span class="code-keyword">$1</span>');

            safeCode = safeCode.replace(/\b([A-Z][a-zA-Z0-9_]*)(?=\.)/g, '<span class="code-function">$1</span>');
            safeCode = safeCode.replace(/\b(LiteGraph|state)\b/g, '<span class="code-function">$1</span>');

            return safeCode;
        };

        const codeStart = `
            function StartNode() {
                this.addOutput("Start", LiteGraph.EVENT);
                this.addWidget("text", "NPC Name", "Alice", "npcName");
                this.title = "Start";
                this.bgcolor = "#2e7d32";
            }
            Object.assign(StartNode.prototype, BaseDialogueNode);
            LiteGraph.registerNodeType("dialogue/start", StartNode);
            `;

        const codeDialogue = `
            function DialogueNode() {
                this.addInput("In", LiteGraph.ACTION);
                this.title = "Dialogue";
                this.bgcolor = "#1565c0";
                
                this.properties = { 
                    npcText: {},
                    textImage: "", 
                    choices: []
                };
                
                this.createWidgets();
            }

            DialogueNode.prototype.createWidgets = function() {
                this.widgets = [];
                
                state.languages.forEach(lang => {
                    this.properties.npcText[lang] = this.properties.npcText[lang] || "";
                    this.addWidget("text", \`NPC (\${lang})\`, this.properties.npcText[lang], (val) => {
                        this.properties.npcText[lang] = val;
                    });
                });

                this.addWidget("text", "Image Path", this.properties.textImage, (val) => this.properties.textImage = val);

                this.addWidget("button", "+ Add Choice", null, () => this.addChoice());

                this.updateChoicesUI();
            };

            DialogueNode.prototype.addChoice = function(choiceData = null) {
                const newChoice = { text: {}, fullText: {}, effects: {} };
                
                state.languages.forEach(lang => {
                    newChoice.text[lang] = choiceData?.text?.[lang] || "";
                    newChoice.fullText[lang] = choiceData?.fullText?.[lang] || "";
                });
                state.attributes.forEach(attr => {
                    newChoice.effects[attr] = choiceData?.effects?.[attr] || 0;
                });

                this.properties.choices.push(newChoice);
                this.updateChoicesUI();
            };

            DialogueNode.prototype.updateChoicesUI = function() {
                this.widgets = this.widgets.slice(0, state.languages.length + 2); 

                const choiceCount = this.properties.choices.length;

                const savedLinks = {};
                if (this.outputs) {
                    this.outputs.forEach((output, index) => {
                        if (output.links && output.links.length > 0) {
                            savedLinks[index] = [...output.links]; 
                        }
                    });
                }

                if (this.outputs) {
                    this.outputs.length = 0;
                } else {
                    this.outputs = [];
                }

                if (choiceCount === 0) {
                    this.addOutput("Next", LiteGraph.EVENT);
                } 

                else {
                    for (let i = 0; i < choiceCount; i++) {
                        this.addOutput(\`Choice \${i + 1}\`, LiteGraph.EVENT);
                    }
                }

                if (this.outputs) {
                    this.outputs.forEach((output, index) => {
                        if (savedLinks[index]) {
                            output.links = savedLinks[index];
                        }
                    });
                }

                this.properties.choices.forEach((choice, index) => {
                    this.addWidget("toggle", \`--- Choice \${index + 1} ---\`, true, () => {}, { disabled: true });
                    
                    this.addWidget("button", "Remove", null, () => {
                        this.properties.choices.splice(index, 1);
                        this.updateChoicesUI();
                        state.previewUpdater.update();
                    });

                    state.languages.forEach(lang => {
                        this.addWidget("text", \`Btn Text (\${lang})\`, choice.text[lang], (v) => { choice.text[lang] = v; state.previewUpdater.update(); });
                        this.addWidget("text", \`Full Text (\${lang})\`, choice.fullText[lang], (v) => { choice.fullText[lang] = v; state.previewUpdater.update(); });
                    });

                    state.attributes.forEach(attr => {
                        this.addWidget("number", \`\${attr} (+/-)\`, choice.effects[attr], (v) => { choice.effects[attr] = v; state.previewUpdater.update(); }, { precision: 1 });
                    });
                });

                this.setSize(this.computeSize());
                this.setDirtyCanvas(true, true);
                state.previewUpdater.update();
            };

            DialogueNode.prototype.onSettingsChange = function() {
                this.createWidgets();
            };

            Object.assign(DialogueNode.prototype, BaseDialogueNode);
            LiteGraph.registerNodeType("dialogue/dialogue", DialogueNode);
            `;

        const codeBranch = `
            function BranchNode() {
                this.addInput("In", LiteGraph.ACTION);
                this.addOutput("True", LiteGraph.EVENT);
                this.addOutput("False", LiteGraph.EVENT);
                this.title = "Branch (Condition)";
                this.bgcolor = "#f57f17";

                this.properties = { 
                    attribute: state.attributes[0] || "", 
                    op: "==", 
                    value: 0 
                };
                this.createWidgets();
            }

            BranchNode.prototype.createWidgets = function() {
                this.widgets = [];
                const operators = ["==", ">", "<", ">=", "<=", "!="];
                
                this.addWidget("combo", "Attribute", this.properties.attribute, (v) => { this.properties.attribute = v; state.previewUpdater.update(); }, { values: state.attributes });
                this.addWidget("combo", "Operator", this.properties.op, (v) => { this.properties.op = v; state.previewUpdater.update(); }, { values: operators });
                this.addWidget("number", "Value", this.properties.value, (v) => { this.properties.value = v; state.previewUpdater.update(); });
            };

            BranchNode.prototype.onSettingsChange = function() {
                this.createWidgets();
            };

            Object.assign(BranchNode.prototype, BaseDialogueNode);
            LiteGraph.registerNodeType("dialogue/branch", BranchNode);
            `;

        const codeMerge = `
            function MergeNode() {
                this.addOutput("Out", LiteGraph.EVENT);
                this.title = "Merge";
                this.bgcolor = "#455a64";
                
                this.addWidget("button", "+ Add Input", null, () => this.addInputPin());
                this.addWidget("button", "- Remove Input", null, () => this.removeInputPin());

                this.addInput("In A", LiteGraph.ACTION);
                this.addInput("In B", LiteGraph.ACTION);
            }

            MergeNode.prototype.addInputPin = function() {
                const count = this.inputs ? this.inputs.length : 0;
                const name = \`In \${String.fromCharCode(65 + count)}\`; // A, B, C...
                this.addInput(name, LiteGraph.ACTION);
                this.setSize(this.computeSize());
            };

            MergeNode.prototype.removeInputPin = function() {
                if (this.inputs && this.inputs.length > 2) {
                    this.removeInput(this.inputs.length - 1);
                    this.setSize(this.computeSize());
                }
            };

            Object.assign(MergeNode.prototype, BaseDialogueNode);
            LiteGraph.registerNodeType("dialogue/merge", MergeNode);
            `;

        const codeEnd = `
            function EndNode() {
                this.addInput("End", LiteGraph.ACTION);
                this.title = "End";
                this.bgcolor = "#c62828";
            }
            Object.assign(EndNode.prototype, BaseDialogueNode);
            LiteGraph.registerNodeType("dialogue/end", EndNode);
            `;

        const codeSetChoice = `
            function SetChoiceNode() {
                this.addInput("In", LiteGraph.ACTION);
                this.addOutput("Out", LiteGraph.EVENT);
                this.title = "Set Choice";
                this.bgcolor = "#6a1b9a";
                this.properties = { category: "", value: "" };
                this.createWidgets();
            }

            SetChoiceNode.prototype.createWidgets = function() {
                this.widgets = [];
                const categories = Object.keys(state.choices);
                
                this.addWidget("combo", "Category", this.properties.category, (v) => {
                    this.properties.category = v;
                    this.createWidgets();
                    state.previewUpdater.update();
                }, { values: categories });

                if (this.properties.category && state.choices[this.properties.category]) {
                    const values = state.choices[this.properties.category];
                    this.addWidget("combo", "Value", this.properties.value, (v) => {
                        this.properties.value = v;
                        state.previewUpdater.update();
                    }, { values: values });
                }
            };

            SetChoiceNode.prototype.onSettingsChange = function() {
                this.createWidgets();
            };

            Object.assign(SetChoiceNode.prototype, BaseDialogueNode);
            LiteGraph.registerNodeType("dialogue/set_choice", SetChoiceNode);
            `;

        const codeBranchChoice = `
            function BranchChoiceNode() {
                this.addInput("In", LiteGraph.ACTION);
                this.title = "Branch Choice";
                this.bgcolor = "#ef6c00";
                this.properties = { category: "" };
                this.createWidgets();
            }

            BranchChoiceNode.prototype.createWidgets = function() {
                this.widgets = [];
                const categories = Object.keys(state.choices);

                this.addWidget("combo", "Category", this.properties.category, (v) => {
                    this.properties.category = v;
                    this.updateOutputs();
                    state.previewUpdater.update();
                }, { values: categories });
                
                this.updateOutputs();
            };

            BranchChoiceNode.prototype.updateOutputs = function() {
                const savedLinks = {};
                if (this.outputs) {
                    this.outputs.forEach((output, index) => {
                        if (output.links && output.links.length > 0) {
                            savedLinks[index] = [...output.links];
                        }
                    });
                }

                if(this.outputs) {
                        this.outputs.length = 0; 
                } else {
                        this.outputs = [];
                }

                const cat = this.properties.category;
                if (cat && state.choices[cat]) {
                    state.choices[cat].forEach(opt => {
                        this.addOutput(opt, LiteGraph.EVENT);
                    });
                } else {
                    this.addOutput("Default", LiteGraph.EVENT);
                }

                if (this.outputs) {
                    this.outputs.forEach((output, index) => {
                        if (savedLinks[index]) {
                            output.links = savedLinks[index];
                        }
                    });
                }

                this.setSize(this.computeSize());
            };

            BranchChoiceNode.prototype.onSettingsChange = function() {
                this.createWidgets();
            };

            Object.assign(BranchChoiceNode.prototype, BaseDialogueNode);
            LiteGraph.registerNodeType("dialogue/branch_choice", BranchChoiceNode);
            `;

        // --- RENDER ---
        
        container.innerHTML = `
            <h1 data-lang-key="sites.dialogue_doc_nodes_title" style="color: #fff; border-bottom: 2px solid #007acc; padding-bottom: 10px;">Nodes.js</h1>
            <p data-lang-key="sites.dialogue_doc_nodes_intro" style="color: #ccc; margin-bottom: 30px;"></p>

            <div class="doc-section">
                <h3 class="doc-title" data-lang-key="sites.dialogue_doc_node_start_title">Start Node</h3>
                <p class="doc-desc" data-lang-key="sites.dialogue_doc_node_start_desc"></p>
                <div class="code-block">${h(codeStart)}</div>
            </div>

            <div class="doc-section">
                <h3 class="doc-title" data-lang-key="sites.dialogue_doc_node_dialogue_title">Dialogue Node</h3>
                <p class="doc-desc" data-lang-key="sites.dialogue_doc_node_dialogue_desc"></p>
                <div class="code-block">${h(codeDialogue)}</div>
            </div>

            <div class="doc-section">
                <h3 class="doc-title" data-lang-key="sites.dialogue_doc_node_branch_title">Branch Node</h3>
                <p class="doc-desc" data-lang-key="sites.dialogue_doc_node_branch_desc"></p>
                <div class="code-block">${h(codeBranch)}</div>
            </div>

            <div class="doc-section">
                <h3 class="doc-title" data-lang-key="sites.dialogue_doc_node_merge_title">Merge Node</h3>
                <p class="doc-desc" data-lang-key="sites.dialogue_doc_node_merge_desc"></p>
                <div class="code-block">${h(codeMerge)}</div>
            </div>

            <div class="doc-section">
                <h3 class="doc-title" data-lang-key="sites.dialogue_doc_node_end_title">End Node</h3>
                <p class="doc-desc" data-lang-key="sites.dialogue_doc_node_end_desc"></p>
                <div class="code-block">${h(codeEnd)}</div>
            </div>

            <div class="doc-section">
                <h3 class="doc-title" data-lang-key="sites.dialogue_doc_node_set_choice_title">Set Choice Node</h3>
                <p class="doc-desc" data-lang-key="sites.dialogue_doc_node_set_choice_desc"></p>
                <div class="code-block">${h(codeSetChoice)}</div>
            </div>

            <div class="doc-section" style="border-bottom: none;">
                <h3 class="doc-title" data-lang-key="sites.dialogue_doc_node_branch_choice_title">Branch Choice Node</h3>
                <p class="doc-desc" data-lang-key="sites.dialogue_doc_node_branch_choice_desc"></p>
                <div class="code-block">${h(codeBranchChoice)}</div>
            </div>
        `;
    }

    _renderDialogueIO(container) {
        const h = (code) => {
            let safeCode = code
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");

            safeCode = safeCode.replace(/(".*?")/g, '<span class="code-string">$1</span>');
            safeCode = safeCode.replace(/`([^`]+)`/g, '<span class="code-string">`$1`</span>');
            safeCode = safeCode.replace(/\/\/.*$/gm, '<span class="code-comment">$&</span>');
            safeCode = safeCode.replace(/\b(function|var|let|const|this|return|if|else|new|import|export|switch|case|break|default|Object|assign|prototype|try|catch)\b/g, '<span class="code-keyword">$1</span>');
            safeCode = safeCode.replace(/\b([A-Z][a-zA-Z0-9_]*)(?=\.)/g, '<span class="code-function">$1</span>');
            safeCode = safeCode.replace(/\b(LiteGraph|state|JSON|Math|Map|FileReader)\b/g, '<span class="code-function">$1</span>');

            return safeCode;
        };

        const codeImports = `
            import * as state from './state.js';
            import { updateSettingsUI, updateChoicesUI } from './ui.js';
            `;

        const codeExport = `
            export function exportGraphToJSON() {
                let npcName = "DefaultNPC";
                
                const startNode = state.graph.findNodesByType("dialogue/start")[0];
                if (startNode) {
                    const nameWidget = startNode.widgets?.find(w => w.name === "NPC Name");
                    if (nameWidget) npcName = nameWidget.value;
                }

                const output = {
                    settings: {
                        npcName: npcName,
                        startNodeGuid: startNode ? startNode.id : null,
                        languages: [...state.languages],
                        attributes: [...state.attributes],
                        choices: JSON.parse(JSON.stringify(state.choices))
                    },
                    nodes: [],
                    edges: []
                };

                const nodeMap = new Map();

                state.graph._nodes.forEach(node => {
                    nodeMap.set(node.id, node);

                    const typeParts = node.type.split('/');
                    const cleanType = typeParts.length > 1 ? typeParts[1] : node.type;

                    const nodeData = {
                        guid: node.id,
                        type: cleanType,
                        position: { x: node.pos[0], y: node.pos[1] }
                    };

                    switch(cleanType) {
                        case 'dialogue':
                            nodeData.npcText = node.properties.npcText;
                            nodeData.textImage = node.properties.textImage;
                            nodeData.choices = node.properties.choices.map((c) => ({
                                text: c.text,
                                fullText: c.fullText,
                                effects: c.effects,
                                toNodeGuid: null
                            }));
                            break;
                        case 'branch':
                            nodeData.branch = {
                                attributeKey: node.properties.attribute,
                                op: node.properties.op,
                                value: node.properties.value
                            };
                            break;
                        case 'set_choice':
                            nodeData.category = node.properties.category;
                            nodeData.value = node.properties.value;
                            break;
                        case 'branch_choice':
                            nodeData.category = node.properties.category;
                            break;
                    }
                    output.nodes.push(nodeData);
                });

                state.graph._nodes.forEach(fromNode => {
                    if (!fromNode.outputs) return;

                    fromNode.outputs.forEach((outputSlot, outputIndex) => {
                        if (!outputSlot.links || outputSlot.links.length === 0) return;

                        const linkId = outputSlot.links[0];
                        const link = state.graph.links[linkId];
                        
                        if (link) {
                            const toNode = nodeMap.get(link.target_id);
                            if (toNode) {
                                output.edges.push({
                                    fromNodeGuid: fromNode.id,
                                    fromChoiceIndex: outputIndex,
                                    toNodeGuid: toNode.id,
                                    toNodeSlotIndex: link.target_slot
                                });

                                const nodeJson = output.nodes.find(n => n.guid === fromNode.id);
                                if (nodeJson && nodeJson.type === 'dialogue' && nodeJson.choices[outputIndex]) {
                                    nodeJson.choices[outputIndex].toNodeGuid = toNode.id;
                                }
                            }
                        }
                    });
                });

                return output;
            }
            `;

        const codeLoad = `
            export function loadGraphFromJSON(json) {
                state.graph.clear();

                if (json.settings) {
                    state.setLanguages(json.settings.languages || ['tr']);
                    state.setAttributes(json.settings.attributes || ['love', 'hate']);
                    state.setChoices(json.settings.choices || {});
                    
                    updateSettingsUI();
                    updateChoicesUI();
                }

                const nodeMap = new Map();

                json.nodes.forEach(nodeData => {
                    const nodeType = \`dialogue/\${nodeData.type}\`;
                    const node = LiteGraph.createNode(nodeType);
                    
                    if (node) {
                        node.pos = [nodeData.position.x, nodeData.position.y];
                        node.id = nodeData.guid;
                        
                        switch(nodeData.type) {
                            case 'start':
                                setTimeout(() => {
                                    const w = node.widgets.find(w => w.name === "NPC Name");
                                    if(w && json.settings.npcName) w.value = json.settings.npcName;
                                }, 10);
                                break;
                            case 'dialogue':
                                node.properties.npcText = nodeData.npcText || {};
                                node.properties.textImage = nodeData.textImage || "";
                                if (nodeData.choices) {
                                    node.properties.choices = [];
                                    nodeData.choices.forEach(c => node.addChoice(c));
                                }
                                node.onSettingsChange(); 
                                break;
                            case 'branch':
                                if (nodeData.branch) {
                                    node.properties.attribute = nodeData.branch.attributeKey;
                                    node.properties.op = nodeData.branch.op;
                                    node.properties.value = nodeData.branch.value;
                                    node.onSettingsChange();
                                }
                                break;
                            case 'set_choice':
                                node.properties.category = nodeData.category;
                                node.properties.value = nodeData.value;
                                node.onSettingsChange();
                                break;
                            case 'branch_choice':
                                node.properties.category = nodeData.category;
                                node.onSettingsChange();
                                break;
                            case 'merge':
                                break;
                        }

                        state.graph.add(node);
                        nodeMap.set(node.id, node);
                    }
                });

                if (json.edges) {
                    json.edges.forEach(edge => {
                        const fromNode = nodeMap.get(edge.fromNodeGuid);
                        const toNode = nodeMap.get(edge.toNodeGuid);

                        if (fromNode && toNode) {
                            if (toNode.type === "dialogue/merge") {
                                while (toNode.inputs.length <= edge.toNodeSlotIndex) {
                                    toNode.addInputPin();
                                }
                            }
                            
                            fromNode.connect(edge.fromChoiceIndex, toNode, edge.toNodeSlotIndex);
                        }
                    });
                }
                
                state.previewUpdater.update();
            }
            `;

        // --- HTML RENDER ---

        container.innerHTML = `
            <h1 data-lang-key="sites.dialogue_doc_io_title" style="color: #fff; border-bottom: 2px solid #007acc; padding-bottom: 10px;">IO.js</h1>
            <p data-lang-key="sites.dialogue_doc_io_intro" style="color: #ccc; margin-bottom: 30px;"></p>

            <div class="code-block" style="margin-bottom: 30px;">${h(codeImports)}</div>

            <div class="doc-section">
                <div class="doc-info">
                    <h3 class="doc-title" data-lang-key="sites.dialogue_doc_func_export_title">exportGraphToJSON</h3>
                    <p class="doc-desc" data-lang-key="sites.dialogue_doc_func_export_desc"></p>
                    <div class="code-block">${h(codeExport)}</div>
                </div>
            </div>

            <div class="doc-section" style="border-bottom: none;">
                <div class="doc-info">
                    <h3 class="doc-title" data-lang-key="sites.dialogue_doc_func_load_title">loadGraphFromJSON</h3>
                    <p class="doc-desc" data-lang-key="sites.dialogue_doc_func_load_desc"></p>
                    <div class="code-block">${h(codeLoad)}</div>
                </div>
            </div>
        `;
    }

    _renderDialogueState(container) {
        const h = (code) => {
            let safeCode = code
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");

            safeCode = safeCode.replace(/(".*?")/g, '<span class="code-string">$1</span>');
            safeCode = safeCode.replace(/\/\/.*$/gm, '<span class="code-comment">$&</span>');
            safeCode = safeCode.replace(/\/\*\*[\s\S]*?\*\//g, '<span class="code-comment">$&</span>');
            safeCode = safeCode.replace(/\b(function|var|let|const|this|return|if|else|new|import|export|delete|for|in|Object|assign)\b/g, '<span class="code-keyword">$1</span>');
            safeCode = safeCode.replace(/\b([A-Z][a-zA-Z0-9_]*)(?=\.)/g, '<span class="code-function">$1</span>');
            safeCode = safeCode.replace(/\b(LGraph|LGraphCanvas|console)\b/g, '<span class="code-function">$1</span>');

            return safeCode;
        };

        const codeGraph = `
            export const graph = new LGraph();
            export const canvas = new LGraphCanvas("#dialogue-canvas", graph);
            `;

                    const codeData = `
            export const languages = ['tr', 'en'];
            export const attributes = ['love', 'hate'];
            export const choices = {
            };
            `;

                    const codeSetters = `
            /**.
             * @param {Array} newLangs
             */
            export function setLanguages(newLangs) {
                languages.length = 0;
                languages.push(...newLangs);
            }

            /**
             * @param {Array} newAttrs
             */
            export function setAttributes(newAttrs) {
                attributes.length = 0;
                attributes.push(...newAttrs);
            }

            /**
             * @param {Object} newChoices
             */
            export function setChoices(newChoices) {
                for (const key in choices) delete choices[key];
                Object.assign(choices, newChoices);
            }
            `;

        const codePreview = `
            export const previewUpdater = {
                update: () => console.log("Preview updater not initialized yet.")
            };
            `;

        // --- HTML RENDER ---

        container.innerHTML = `
            <h1 data-lang-key="sites.dialogue_doc_state_title" style="color: #fff; border-bottom: 2px solid #007acc; padding-bottom: 10px;">State.js</h1>
            <p data-lang-key="sites.dialogue_doc_state_intro" style="color: #ccc; margin-bottom: 30px;"></p>

            <div class="doc-section">
                <div class="doc-info">
                    <h3 class="doc-title" data-lang-key="sites.dialogue_doc_state_graph_title">Graph Initialization</h3>
                    <p class="doc-desc" data-lang-key="sites.dialogue_doc_state_graph_desc"></p>
                    <div class="code-block">${h(codeGraph)}</div>
                </div>
            </div>

            <div class="doc-section">
                <div class="doc-info">
                    <h3 class="doc-title" data-lang-key="sites.dialogue_doc_state_data_title">Global Data Structures</h3>
                    <p class="doc-desc" data-lang-key="sites.dialogue_doc_state_data_desc"></p>
                    <div class="code-block">${h(codeData)}</div>
                </div>
            </div>

            <div class="doc-section">
                <div class="doc-info">
                    <h3 class="doc-title" data-lang-key="sites.dialogue_doc_state_funcs_title">State Modifiers</h3>
                    <p class="doc-desc" data-lang-key="sites.dialogue_doc_state_funcs_desc"></p>
                    <div class="code-block">${h(codeSetters)}</div>
                </div>
            </div>

            <div class="doc-section" style="border-bottom: none;">
                <div class="doc-info">
                    <h3 class="doc-title" data-lang-key="sites.dialogue_doc_state_preview_title">Preview Updater</h3>
                    <p class="doc-desc" data-lang-key="sites.dialogue_doc_state_preview_desc"></p>
                    <div class="code-block">${h(codePreview)}</div>
                </div>
            </div>
        `;
    }
}