DisportOS.Clock = {
    tooltipElement: null,
    currentDateString: '',
    uiInterval: null,

    init() {
        const clockArea = document.getElementById('clock-area');
        
        if (clockArea && !this.tooltipElement) {
            this.tooltipElement = document.createElement('div');
            this.tooltipElement.id = 'clock-tooltip';
            document.body.appendChild(this.tooltipElement);

            clockArea.addEventListener('mouseover', () => {
                this.tooltipElement.textContent = this.currentDateString;
                this.tooltipElement.style.visibility = 'visible';
                
                const clockRect = clockArea.getBoundingClientRect();
                const tooltipRect = this.tooltipElement.getBoundingClientRect();
                const screenWidth = window.innerWidth;

                let leftPos = clockRect.left + (clockRect.width / 2) - (tooltipRect.width / 2);

                if (leftPos + tooltipRect.width > screenWidth) {
                    leftPos = screenWidth - tooltipRect.width - 5;
                }

                if (leftPos < 5) {
                    leftPos = 5;
                }

                let topPos = clockRect.top - tooltipRect.height - 5;

                this.tooltipElement.style.left = `${leftPos}px`;
                this.tooltipElement.style.top = `${topPos}px`;
                
                this.tooltipElement.style.opacity = '1';
            });

            clockArea.addEventListener('mouseout', () => {
                this.tooltipElement.style.visibility = 'hidden';
                this.tooltipElement.style.opacity = '0';
            });
        }

        if (clockArea) {
            this.updateUI(clockArea);
            this.uiInterval = setInterval(() => this.updateUI(clockArea), 1000);
        }
    },

    updateUI(clockArea) {
        const now = new Date();

        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        clockArea.textContent = `${hours}:${minutes}`;

        const currentLang = DisportOS.state.currentLanguage === 'en' ? 'en-US' : 'tr-TR';
        
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        
        this.currentDateString = now.toLocaleDateString(currentLang, options);
    }
};