CREATE DATABASE IF NOT EXISTS revista_academica;
USE revista_academica;

CREATE TABLE IF NOT EXISTS articulos (
    id VARCHAR(36) PRIMARY KEY,
    codigo_local VARCHAR(50),
    autor VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    institucion VARCHAR(200),
    titulo VARCHAR(200) NOT NULL,
    area VARCHAR(50) NOT NULL,
    resumen TEXT NOT NULL,
    fecha_envio DATE NOT NULL,
    estado VARCHAR(20) DEFAULT 'Pendiente',
    archivo_nombre VARCHAR(255),
    sincronizado BOOLEAN DEFAULT FALSE,
    fecha_sincronizacion TIMESTAMP NULL,
    version INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_estado (estado),
    INDEX idx_fecha (fecha_envio)
);

CREATE TABLE IF NOT EXISTS sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    articulo_id VARCHAR(36),
    operacion ENUM('INSERT', 'UPDATE', 'DELETE'),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (articulo_id) REFERENCES articulos(id) ON DELETE CASCADE
);