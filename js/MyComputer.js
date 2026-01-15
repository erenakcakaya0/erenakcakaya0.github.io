DisportOS.MyComputer = {
    container: null,
    drives: [],

    async init(contentContainer) {
        this.container = contentContainer;
        this.renderLoading();
        
        await this.scanDrives();
        this.renderDrives();
        this.attachEventListeners();
    },

    renderLoading() {
        const list = this.container.querySelector('#mc-drives-list');
        if(list) list.innerHTML = '<div style="padding:20px">Sürücüler taranıyor...</div>';
    },

    async scanDrives() {
        this.drives = [];

        let cTotal = 256;
        let cUsed = 45;

        if (navigator.storage && navigator.storage.estimate) {
            try {
                const estimate = await navigator.storage.estimate();
                if (estimate.quota) {
                    const realQuotaGB = estimate.quota / (1024 * 1024 * 1024);
                    const realUsageGB = estimate.usage / (1024 * 1024 * 1024);
                    
                    if (realQuotaGB > 1) {
                        cTotal = Math.floor(realQuotaGB * 10);
                        cUsed = Math.floor(realUsageGB * 10) + (cTotal * 0.2);
                    }
                }
            } catch (e) {
                console.warn("Storage API erişilemedi, varsayılan değerler kullanılıyor.");
            }
        }

        this.drives.push({
            id: 'drive_c',
            letter: 'C',
            name: DisportOS.helpers.getText('my_computer.local_disk'),
            type: 'local_disk',
            totalGB: Math.max(cTotal, 64).toFixed(1),
            usedGB: Math.max(cUsed, 10).toFixed(1),
            icon: 'assets/icons/my_computer.png'
        });

        this.drives.push({
            id: 'drive_d',
            letter: 'D',
            name: 'Data',
            type: 'local_disk',
            totalGB: '512.0',
            usedGB: '120.5',
            icon: 'assets/icons/my_computer.png'
        });

        this.drives.push({
            id: 'drive_a',
            letter: 'A',
            name: 'Floppy',
            type: 'floppy',
            totalGB: '0.00144',
            usedGB: '0',
            icon: 'assets/icons/my_computer.png'
        });
    },

    renderDrives() {
        const list = this.container.querySelector('#mc-drives-list');
        const status = this.container.querySelector('#mc-status-text');
        if (!list) return;

        list.innerHTML = '';
        
        this.drives.forEach(drive => {
            const item = document.createElement('div');
            item.className = 'mc-drive-item';
            item.dataset.driveId = drive.id;
            
            item.innerHTML = `
                <img src="${drive.icon}" alt="${drive.letter}">
                <span>${drive.name} (${drive.letter}:)</span>
            `;
            
            item.addEventListener('click', (e) => {
                this.selectDrive(item, drive);
                e.stopPropagation();
            });

            item.addEventListener('dblclick', () => {
                this.openDrive(drive);
            });

            list.appendChild(item);
        });

        if(status) status.textContent = `${this.drives.length} ${DisportOS.helpers.getText('my_computer.objects_count')}`;
    },

    selectDrive(element, drive) {
        this.container.querySelectorAll('.mc-drive-item').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');

        const details = this.container.querySelector('#mc-details-panel');
        const free = (drive.totalGB - drive.usedGB).toFixed(1);
        const percentUsed = (drive.usedGB / drive.totalGB) * 100;
        
        const pieStyle = `--usage-percent: ${percentUsed}%;`;

        if(drive.type === 'floppy') {
             details.innerHTML = `
                <span class="mc-sidebar-detail-title">3½ Disket (${drive.letter}:)</span>
                <br>
                <p>Çıkarılabilir Disk</p>
            `;
        } else {
            details.innerHTML = `
                <span class="mc-sidebar-detail-title">${drive.name} (${drive.letter}:)</span>
                <p>${DisportOS.helpers.getText('my_computer.type_local')}</p>
                <br>
                <p>${DisportOS.helpers.getText('my_computer.total_size')}: ${drive.totalGB} GB</p>
                <p>${DisportOS.helpers.getText('my_computer.free_space')}: ${free} GB</p>
                
                <div class="mc-graph-container">
                    <div class="pie-chart" style="${pieStyle}"></div>
                </div>
                <p style="text-align:center; font-size:10px; margin-top:5px;">
                    Kullanılan: %${Math.round(percentUsed)}
                </p>
            `;
        }
    },

    openDrive(drive) {
        if (drive.type === 'floppy') {
            DisportOS.Dialog.confirm({
                titleKey: 'window_titles.error',
                messageKey: 'my_computer.insert_disk_error',
                onConfirm: () => {},
                onCancel: null
            });
        } else {
            DisportOS.Dialog.confirm({
                titleKey: 'window_titles.error',
                messageKey: 'my_computer.access_denied',
                onConfirm: () => {},
                onCancel: null
            });
        }
    },

    attachEventListeners() {
        const contentArea = this.container.querySelector('#mc-drives-list');
        contentArea.addEventListener('click', () => {
            this.container.querySelectorAll('.mc-drive-item').forEach(el => el.classList.remove('selected'));
            const details = this.container.querySelector('#mc-details-panel');
            details.innerHTML = `<p>${DisportOS.helpers.getText('my_computer.select_item_desc')}</p>`;
        });
    }
};