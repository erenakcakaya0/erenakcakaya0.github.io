DisportOS.Dialog = {
    confirm({ titleKey, messageKey, onConfirm, onCancel }) {
        this.close();

        const overlay = document.createElement('div');
        overlay.id = 'dialog-overlay';

        const dialog = document.createElement('div');
        dialog.className = 'dialog-box';
        
        const titleText = DisportOS.helpers.getText(titleKey);
        const messageText = DisportOS.helpers.getText(messageKey);
        const okText = DisportOS.helpers.getText('dialog.ok_button');
        const cancelText = DisportOS.helpers.getText('dialog.cancel_button');

        dialog.innerHTML = `
            <div class="dialog-title-bar">${titleText}</div>
            <div class="dialog-content">
                <img class="dialog-icon" src="assets/icons/dialog-warning.png" alt="Warning">
                <span>${messageText}</span>
            </div>
            <div class="dialog-buttons">
                <button id="dialog-ok-btn">${okText}</button>
                <button id="dialog-cancel-btn">${cancelText}</button>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(dialog);

        const okBtn = document.getElementById('dialog-ok-btn');
        const cancelBtn = document.getElementById('dialog-cancel-btn');

        okBtn.addEventListener('click', () => {
            if (onConfirm) onConfirm();
            this.close();
        });

        cancelBtn.addEventListener('click', () => {
            if (onCancel) onCancel();
            this.close();
        });

        cancelBtn.focus();
    },

    close() {
        document.getElementById('dialog-overlay')?.remove();
        document.querySelector('.dialog-box')?.remove();
    }
};