class Taskbar {
    static container = document.getElementById('taskbar-items');

    static add(appConfig) {
        const btn = document.createElement('button');
        btn.className = 'taskbar-item active';
        btn.id = `taskbar-${appConfig.id}`;
        btn.innerHTML = `
            <img src="${appConfig.icon}" width="16">
            <b>${appConfig.title}</b>
        `;
        
        btn.onclick = () => {
            const win = document.getElementById(`win-${appConfig.id}`);
            if (win.style.display === 'none') {
                WindowManager.bringToFront(appConfig.id);
            } else if (WindowManager.activeWindowId === appConfig.id) {
                WindowManager.minimize(appConfig.id);
            } else {
                WindowManager.bringToFront(appConfig.id);
            }
        };

        this.container.appendChild(btn);
        this.setActive(appConfig.id);
    }

    static remove(id) {
        const btn = document.getElementById(`taskbar-${id}`);
        if (btn) btn.remove();
    }

    static setActive(id) {
        document.querySelectorAll('.taskbar-item').forEach(btn => btn.classList.remove('active'));
        if (id) {
            const btn = document.getElementById(`taskbar-${id}`);
            if (btn) btn.classList.add('active');
        }
    }
}