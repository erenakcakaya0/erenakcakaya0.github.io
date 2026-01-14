PortfolioOS.Clock = {
    init() {
        this.element = document.getElementById('clock-area');
        
        // Tooltip Elementini Oluştur
        this.tooltip = document.createElement('div');
        this.tooltip.id = 'clock-tooltip';
        document.body.appendChild(this.tooltip);

        this.update();
        setInterval(() => this.update(), 1000);

        // Hover Olayları
        this.element.addEventListener('mouseenter', (e) => this.showTooltip(e));
        this.element.addEventListener('mousemove', (e) => this.moveTooltip(e)); // Fareyi takip etsin veya sabit kalsın
        this.element.addEventListener('mouseleave', () => this.hideTooltip());
    },

    update() {
        if (!this.element) return;
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        this.element.textContent = `${hours}:${minutes}`;
        
        // Tooltip metnini güncelle (Örn: "Pazartesi, 13 Ocak 2026")
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        this.tooltip.textContent = now.toLocaleDateString('tr-TR', options);
    },

    showTooltip(e) {
        this.update(); // Açılmadan önce tarihi emin ol
        this.tooltip.style.display = 'block';
        this.moveTooltip(e);
    },

    moveTooltip(e) {
        // Baloncuğu farenin biraz soluna ve yukarısına koy
        const x = e.clientX - this.tooltip.offsetWidth - 10;
        const y = e.clientY - 30;
        
        // Eğer çok sola giderse sağa al
        const finalX = x < 0 ? e.clientX + 10 : x;
        
        this.tooltip.style.left = `${finalX}px`;
        this.tooltip.style.top = `${y}px`;
    },

    hideTooltip() {
        this.tooltip.style.display = 'none';
    }
};