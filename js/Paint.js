DisportOS.Paint = {
    palette: [
        '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#808040', '#004040', '#0080ff', '#004080', '#8000ff', '#804000',
        '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffff80', '#00ff80', '#80ffff', '#8080ff', '#ff80ff', '#ff8040'
    ],

    toolCursors: {
        'select-free': 'crosshair',
        'select': 'crosshair',
        'eraser': 'cell', 
        'bucket': 'alias', 
        'eyedropper': 'crosshair',
        'zoom': 'zoom-in',
        'pencil': 'crosshair',
        'brush': 'crosshair',
        'spray': 'crosshair',
        'text': 'text',
        'line': 'crosshair',
        'curve': 'crosshair',
        'rectangle': 'crosshair',
        'polygon': 'crosshair',
        'ellipse': 'crosshair',
        'roundrect': 'crosshair'
    },

    init(container) {
        this.container = container;
        this.canvas = container.querySelector('#paint-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.history = [];
        this.historyIndex = -1;

        this.isDrawing = false;
        this.currentTool = 'brush';
        this.primaryColor = '#000000';
        this.secondaryColor = '#ffffff';
        this.lineWidth = 3;
        this.snapshot = null;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this._saveState();

        this._renderPalette();
        
        if (this._globalKeyHandler) document.removeEventListener('keydown', this._globalKeyHandler);
        if (this._globalMouseUpHandler) window.removeEventListener('mouseup', this._globalMouseUpHandler);

        this._attachEventListeners();
        this._updateCursor();
    },

    _saveState() {
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
        this.historyIndex++;

        if (this.history.length > 20) {
            this.history.shift();
            this.historyIndex--;
        }
    },

    _undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.ctx.putImageData(this.history[this.historyIndex], 0, 0);
        }
    },

    _renderPalette() {
        const paletteContainer = this.container.querySelector('.color-palette');
        let html = '';
        this.palette.forEach(color => {
            html += `<div class="paint-color-swatch" data-color="${color}" style="background-color: ${color};"></div>`;
        });
        paletteContainer.innerHTML = html;
    },

    _getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    },

    _updateCursor() {
        const cursorStyle = this.toolCursors[this.currentTool] || 'default';
        this.canvas.style.cursor = cursorStyle;
    },

    _attachEventListeners() {
        const canvas = this.canvas;
        
        this._globalMouseUpHandler = () => {
            if (this.isDrawing) {
                this.isDrawing = false;
                this.snapshot = null;
                this.ctx.beginPath();
                this._saveState();
            }
        };
        window.addEventListener('mouseup', this._globalMouseUpHandler);

        this._globalKeyHandler = (e) => {
            const myWindow = this.container.closest('.window');
            if (myWindow && myWindow.classList.contains('active')) {
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                    e.preventDefault();
                    this._undo();
                }
            }
        };
        document.addEventListener('keydown', this._globalKeyHandler);


        canvas.addEventListener('mousedown', (e) => {
            const isRightClick = e.button === 2;
            this.isDrawing = true;
            const pos = this._getMousePos(e);
            this.startX = pos.x;
            this.startY = pos.y;
            
            if (this.currentTool === 'eyedropper') {
                this._pickColor(pos, e.button);
                this.isDrawing = false;
                return;
            }

            if (this.currentTool === 'bucket') {
                const colorToFill = isRightClick ? this.secondaryColor : this.primaryColor;
                this._floodFill(pos.x, pos.y, colorToFill);
                this._saveState(); 
                this.isDrawing = false;
                return;
            }

            if (['line', 'rectangle', 'ellipse', 'roundrect'].includes(this.currentTool)) {
                this.snapshot = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
            }

            if (['pencil', 'brush', 'eraser', 'spray'].includes(this.currentTool)) {
                this.ctx.beginPath();
                this.ctx.moveTo(this.startX, this.startY);
                this._draw(e, isRightClick);
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!this.isDrawing) return;
            
            if (this.snapshot) {
                this.ctx.putImageData(this.snapshot, 0, 0);
            }
            this._draw(e, e.buttons === 2);
        });
        
        const toolsContainer = this.container.querySelector('.paint-toolbar-grid');
        toolsContainer.addEventListener('click', (e) => {
            const targetBtn = e.target.closest('.paint-tool');
            if (!targetBtn) return;

            this.container.querySelectorAll('.paint-tool').forEach(t => t.classList.remove('active'));
            targetBtn.classList.add('active');
            
            this.currentTool = targetBtn.dataset.tool;
            this._updateCursor();
        });

        const palette = this.container.querySelector('.color-palette');
        palette.addEventListener('mousedown', (e) => {
            if(e.target.classList.contains('paint-color-swatch')) {
                const color = e.target.dataset.color;
                if (e.button === 0) {
                    this.primaryColor = color;
                    this.container.querySelector('#paint-primary-color-display').style.backgroundColor = color;
                } else if (e.button === 2) {
                    this.secondaryColor = color;
                    this.container.querySelector('#paint-secondary-color-display').style.backgroundColor = color;
                }
            }
        });
        palette.addEventListener('contextmenu', e => e.preventDefault());
        canvas.addEventListener('contextmenu', e => e.preventDefault());

        const sizeInput = this.container.querySelector('#paint-size');
        sizeInput.addEventListener('input', (e) => this.lineWidth = e.target.value);

        this.container.querySelector('#paint-clear-btn').addEventListener('click', () => {
            DisportOS.Dialog.confirm({
                titleKey: 'window_titles.paint',
                messageKey: 'paint.clear_confirm',
                onConfirm: () => {
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
                    this._saveState();
                },
                onCancel: () => {}
            });
        });
    },

    _floodFill(startX, startY, fillColorHex) {
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? [
                parseInt(result[1], 16),
                parseInt(result[2], 16),
                parseInt(result[3], 16),
                255 
            ] : [0, 0, 0, 255];
        };
        
        const fillColor = hexToRgb(fillColorHex);
        const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imgData.data;
        const width = this.canvas.width;
        const height = this.canvas.height;

        const x = Math.floor(startX);
        const y = Math.floor(startY);
        
        if(x < 0 || x >= width || y < 0 || y >= height) return;

        const startPos = (y * width + x) * 4;
        const targetColor = [data[startPos], data[startPos+1], data[startPos+2], data[startPos+3]];

        if (targetColor[0] === fillColor[0] && targetColor[1] === fillColor[1] && 
            targetColor[2] === fillColor[2] && targetColor[3] === fillColor[3]) {
            return;
        }

        const stack = [[x, y]];

        while (stack.length) {
            const [curX, curY] = stack.pop();
            const pos = (curY * width + curX) * 4;

            if (curX >= 0 && curX < width && curY >= 0 && curY < height) {
                const r = data[pos];
                const g = data[pos+1];
                const b = data[pos+2];
                const a = data[pos+3];

                if (r === targetColor[0] && g === targetColor[1] && 
                    b === targetColor[2] && a === targetColor[3]) {
                    
                    data[pos] = fillColor[0];
                    data[pos+1] = fillColor[1];
                    data[pos+2] = fillColor[2];
                    data[pos+3] = fillColor[3];

                    stack.push([curX + 1, curY]);
                    stack.push([curX - 1, curY]);
                    stack.push([curX, curY + 1]);
                    stack.push([curX, curY - 1]);
                }
            }
        }
        this.ctx.putImageData(imgData, 0, 0);
    },

    _pickColor(pos, button) {
        const pixel = this.ctx.getImageData(pos.x, pos.y, 1, 1).data;
        const hex = "#" + ((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1);
        
        if (button === 0) { 
            this.primaryColor = hex;
            this.container.querySelector('#paint-primary-color-display').style.backgroundColor = hex;
        } else if (button === 2) {
            this.secondaryColor = hex;
            this.container.querySelector('#paint-secondary-color-display').style.backgroundColor = hex;
        }
    },

    _draw(e, isRightClick) {
        const pos = this._getMousePos(e);
        const color = (this.currentTool === 'eraser' || isRightClick) ? this.secondaryColor : this.primaryColor;

        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.lineWidth = this.lineWidth;

        switch (this.currentTool) {
            case 'brush':
            case 'pencil':
            case 'eraser':
                this.ctx.lineTo(pos.x, pos.y);
                this.ctx.stroke();
                break;
            
            case 'spray':
                for (let i = 0; i < this.lineWidth * 2; i++) {
                    const offsetX = (Math.random() - 0.5) * this.lineWidth * 5;
                    const offsetY = (Math.random() - 0.5) * this.lineWidth * 5;
                    this.ctx.fillRect(pos.x + offsetX, pos.y + offsetY, 1, 1);
                }
                break;

            case 'line':
                this.ctx.beginPath();
                this.ctx.moveTo(this.startX, this.startY);
                this.ctx.lineTo(pos.x, pos.y);
                this.ctx.stroke();
                break;

            case 'rectangle':
                const w = pos.x - this.startX;
                const h = pos.y - this.startY;
                this.ctx.beginPath();
                if (isRightClick) {
                    this.ctx.fillRect(this.startX, this.startY, w, h);
                } else {
                    this.ctx.rect(this.startX, this.startY, w, h);
                    this.ctx.stroke();
                }
                break;
            
            case 'ellipse':
                const radiusX = Math.abs(pos.x - this.startX) / 2;
                const radiusY = Math.abs(pos.y - this.startY) / 2;
                const centerX = this.startX + (pos.x - this.startX) / 2;
                const centerY = this.startY + (pos.y - this.startY) / 2;
                this.ctx.beginPath();
                this.ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
                if (isRightClick) this.ctx.fill(); else this.ctx.stroke();
                break;
        }
    }
};