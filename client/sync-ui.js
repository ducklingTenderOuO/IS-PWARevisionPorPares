// UI simplificada para sincronización
class SyncUI {
    constructor(syncManager) {
        this.syncManager = syncManager;
        this.createIndicator();
        this.bindEvents();
    }

    createIndicator() {
        // Crear badge de pendientes
        const badge = document.createElement('span');
        badge.id = 'pendingBadge';
        badge.style.cssText = `
            background: #ff9800;
            color: white;
            padding: 2px 8px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 10px;
            display: none;
        `;
        
        // Agregar al lado del título
        const h1 = document.querySelector('h1');
        if (h1) {
            h1.appendChild(badge);
        }

        // Crear indicador de sincronización
        const indicator = document.createElement('div');
        indicator.id = 'syncIndicator';
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #667eea;
            color: white;
            padding: 10px 20px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1001;
            display: none;
            align-items: center;
            gap: 8px;
            cursor: pointer;
        `;
        
        indicator.innerHTML = `
            <span>🔄</span>
            <span>Sincronizando...</span>
        `;
        
        indicator.onclick = () => this.syncManager.sync();
        document.body.appendChild(indicator);
        this.indicator = indicator;
    }

    bindEvents() {
        // Eventos de conexión
        window.addEventListener('online', () => {
            this.showMessage('🟢 Conectado', '#38a169');
            this.syncManager.sync();
        });
        
        window.addEventListener('offline', () => {
            this.showMessage('📴 Modo offline', '#ff9800');
        });

        // Eventos de sincronización
        window.addEventListener('sync-started', () => {
            this.indicator.style.display = 'flex';
        });

        window.addEventListener('sync-completed', (e) => {
            this.indicator.style.display = 'none';
            const count = e.detail?.count || 0;
            if (count > 0) {
                this.showMessage(`✅ ${count} artículos sincronizados`, '#38a169');
            }
            this.syncManager.updateUI();
        });
    }

    showMessage(text, color) {
        const msg = document.createElement('div');
        msg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${color};
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 1002;
            animation: fadeOut 3s forwards;
        `;
        msg.textContent = text;
        document.body.appendChild(msg);
        
        setTimeout(() => msg.remove(), 3000);
    }
}