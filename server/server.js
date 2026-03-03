require('dotenv').config();
const express = require('express');
const mariadb = require('mariadb');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Pool de conexiones a MariaDB
const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5
});

// ========== ENDPOINTS ==========

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Obtener todos los artículos (con filtro opcional por email)
app.get('/api/articulos', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { email, since } = req.query;
        
        let query = 'SELECT * FROM articulos WHERE 1=1';
        const params = [];
        
        if (email) {
            query += ' AND email = ?';
            params.push(email);
        }
        
        if (since) {
            query += ' AND updated_at > ?';
            params.push(since);
        }
        
        query += ' ORDER BY fecha_envio DESC LIMIT 100';
        
        const rows = await conn.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    } finally {
        if (conn) conn.release();
    }
});

// Sincronizar artículos (endpoint principal)
app.post('/api/sync', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { articulos, lastSync } = req.body;
        
        const resultados = [];
        
        // 1. Procesar artículos recibidos del cliente
        if (articulos && articulos.length > 0) {
            for (const art of articulos) {
                // Verificar si ya existe por código_local o email+título
                const existing = await conn.query(
                    'SELECT * FROM articulos WHERE codigo_local = ? OR (email = ? AND titulo = ?)',
                    [art.codigo, art.email, art.titulo]
                );
                
                if (existing.length > 0) {
                    // Actualizar existente
                    await conn.query(
                        `UPDATE articulos SET 
                         autor = ?, institucion = ?, resumen = ?, 
                         estado = ?, sincronizado = TRUE, version = version + 1
                         WHERE id = ?`,
                        [art.autor, art.institucion || '', art.resumen, 
                         art.estado || 'Pendiente', existing[0].id]
                    );
                    resultados.push({ ...art, id: existing[0].id, status: 'updated' });
                } else {
                    // Insertar nuevo
                    const id = uuidv4();
                    await conn.query(
                        `INSERT INTO articulos 
                         (id, codigo_local, autor, email, institucion, titulo, area, resumen, fecha_envio, estado, archivo_nombre, sincronizado)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
                        [id, art.codigo, art.autor, art.email, art.institucion || '', 
                         art.titulo, art.area, art.resumen, art.fecha, 
                         art.estado || 'Pendiente', art.archivo || null]
                    );
                    resultados.push({ ...art, id, status: 'inserted' });
                }
            }
        }
        
        // 2. Obtener cambios desde el servidor (para enviar al cliente)
        const cambiosServidor = await conn.query(
            `SELECT * FROM articulos 
             WHERE updated_at > ? 
             ORDER BY updated_at DESC 
             LIMIT 50`,
            [lastSync || '2000-01-01']
        );
        
        res.json({
            success: true,
            resultados: resultados,
            cambios: cambiosServidor,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Error en sync:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (conn) conn.release();
    }
});

// Obtener un artículo específico
app.get('/api/articulos/:id', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT * FROM articulos WHERE id = ?', [req.params.id]);
        
        if (rows.length === 0) {
            res.status(404).json({ error: 'Artículo no encontrado' });
        } else {
            res.json(rows[0]);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (conn) conn.release();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📚 Base de datos: ${process.env.DB_NAME}`);
});