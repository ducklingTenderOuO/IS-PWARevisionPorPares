// SyncManager simplificado - SIN backend
class SyncManager {
    constructor(db) {
        this.db = db;
        this.pendingOps = [];
        this.loadPending();
    }

    loadPending() {
        const saved = localStorage.getItem('pendingSync');
        this.pendingOps = saved ? JSON.parse(saved) : [];
    }

    savePending() {
        localStorage.setItem('pendingSync', JSON.stringify(this.pendingOps));
    }

    async queueOperation(operation, data) {
        const op = {
            id: Date.now(),
            operation,
            data,
            timestamp: new Date().toISOString()
        };
        
        this.pendingOps.push(op);
        this.savePending();
        
        // Actualizar UI
        this.updateUI();
        
        // Intentar sincronizar si hay conexión
        if (navigator.onLine) {
            this.sync();
        }
        
        return op;
    }

    async sync() {
        if (!navigator.onLine || this.pendingOps.length === 0) return;
        
        // Disparar evento de inicio
        window.dispatchEvent(new Event('sync-started'));
        
        // Simular sincronización (1 segundo)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Marcar como sincronizados
        this.pendingOps = [];
        this.savePending();
        
        // Disparar evento completado
        window.dispatchEvent(new CustomEvent('sync-completed', {
            detail: { count: this.pendingOps.length }
        }));
        
        this.updateUI();
    }

    getPendingCount() {
        return this.pendingOps.length;
    }

    updateUI() {
        // Actualizar badge si existe
        const badge = document.getElementById('pendingBadge');
        if (badge) {
            const count = this.getPendingCount();
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline' : 'none';
        }
    }
}