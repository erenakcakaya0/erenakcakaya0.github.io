DisportOS.Notepad = {
    state: {
        container: null,
        notes: [],
        activeNoteId: null
    },

    init(contentContainer) {
        this.state.container = contentContainer;
        this.loadContent();
        this.render();
        this.attachEventListeners();
    },

    loadContent() {
        const currentLang = DisportOS.state.currentLanguage;
        const langData = DisportOS.state.languageData[currentLang];
        
        this.state.notes = langData.portfolio_content || [];
        
        if (!this.state.activeNoteId && this.state.notes.length > 0) {
            this.state.activeNoteId = this.state.notes[0].id;
        }
    },

    render() {
        if (!this.state.container) return;

        const listEl = this.state.container.querySelector('#notepad-list');
        listEl.innerHTML = '';

        this.state.notes.forEach(note => {
            const li = document.createElement('li');
            li.textContent = note.title;
            li.dataset.id = note.id;
            
            const icon = document.createElement('img');
            icon.src = 'assets/icons/document.png';
            icon.style.width = '16px';
            icon.style.height = '16px';
            icon.style.marginRight = '5px';
            
            li.prepend(icon);

            if (note.id === this.state.activeNoteId) {
                li.classList.add('active');
            }
            listEl.appendChild(li);
        });

        const editor = this.state.container.querySelector('#notepad-editor');
        const activeNote = this.state.notes.find(n => n.id === this.state.activeNoteId);
        const status = this.state.container.querySelector('#char-count');

        if (activeNote) {
            editor.innerHTML = activeNote.content; 
            
            status.textContent = `${editor.textContent.length} bayt`; 
        } else {
            editor.innerHTML = "";
            status.textContent = "0 bayt";
        }
    },

    refresh() {
        this.loadContent();
        this.render();
    },

    attachEventListeners() {
        const listEl = this.state.container.querySelector('#notepad-list');
        const editorEl = this.state.container.querySelector('#notepad-editor');

        listEl.addEventListener('click', (e) => {
            const li = e.target.closest('li');
            if (li) {
                this.state.activeNoteId = li.dataset.id;
                this.render();
            }
        });

        editorEl.addEventListener('click', (e) => {
            const link = e.target.closest('.project-link');
            
            if (link) {
                const rawQuery = link.dataset.query;
                
                const formattedQuery = rawQuery
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');

                console.log("Proje açılıyor:", formattedQuery);
                
                const targetUrl = `http://www.boogle.com/search?q=${encodeURIComponent(formattedQuery)}`;
                
                DisportOS.state.pendingOpenUrl = targetUrl;
                DisportOS.apps.launch('app_internet_explorer');
            }
        });
    }
};