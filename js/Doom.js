DisportOS.DoomApp = {
    currentCI: null,

    init(container) {
        this.container = container;
        this.canvas = container.querySelector('#doom-canvas');
        this.loadingText = container.querySelector('#doom-loading');
        this.originalPageTitle = document.title;

        if (typeof Dos === 'undefined') {
            this._loadScript('https://js-dos.com/6.22/current/js-dos.js', () => {
                this._startGame();
            });
        } else {
            this._startGame();
        }
    },

    _loadScript(url, callback) {
        const script = document.createElement('script');
        script.src = url;
        script.onload = callback;
        document.head.appendChild(script);
    },

    _startGame() {
        this.canvas.width = 640;
        this.canvas.height = 400;

        const dosBox = Dos(this.canvas, {
            wdosboxUrl: "https://js-dos.com/6.22/current/wdosbox.js",
            cycles: "max",
            autolock: false,
        });

        dosBox.ready((fs, main) => {
            fs.extract("assets/games/doom.zip").then(() => {
                if (this.loadingText) this.loadingText.style.display = 'none';
                
                setTimeout(() => { document.title = this.originalPageTitle; }, 500);

                main(["-c", "INSTALL.BAT"]).then((ci) => {
                    this.currentCI = ci;
                    
                    document.title = this.originalPageTitle;
                }).catch((err) => {
                    console.error("Oyun çalışırken hata oluştu:", err);
                });

            }).catch((err) => {
                console.error("Yerel Doom dosyası bulunamadı:", err);
                if (this.loadingText) {
                    this.loadingText.innerHTML = "HATA: assets/games/doom.zip dosyası bulunamadı.<br>Lütfen dosyanın doğru yerde olduğundan emin olun.";
                }
            });
        });
    },

    destroy() {
        if (this.currentCI) {
            try {
                this.currentCI.exit();
            } catch (e) {
                console.warn("Doom kapatılırken hata:", e);
            }
            this.currentCI = null;
        }
        if(this.originalPageTitle) document.title = this.originalPageTitle;
    }
};