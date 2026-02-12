-- Inventory Management System Database Schema

CREATE DATABASE IF NOT EXISTS inventory_system;
USE inventory_system;

-- Items table
CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    boxes INT DEFAULT 0,
    pieces INT DEFAULT 0,
    total_pieces INT DEFAULT 0,
    pieces_per_box INT DEFAULT 24,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_item_name (item_name)
);

-- Inventory transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    transaction_type ENUM('pull_in', 'pull_out') NOT NULL,
    quantity INT NOT NULL,
    unit_type ENUM('boxes', 'pieces') NOT NULL,
    pieces_affected INT NOT NULL,
    previous_stock VARCHAR(50),
    new_stock VARCHAR(50),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    INDEX idx_item_date (item_id, transaction_date),
    INDEX idx_transaction_type (transaction_type)
);

-- Insert sample data
INSERT INTO items (item_name, category, boxes, pieces, total_pieces, pieces_per_box) VALUES
('Standard Widget A', 'Hardware', 6, 4, 148, 24),
('Premium Bolt XL', 'Fasteners', 0, 25, 25, 24),
('Electronic Component Z', 'Electronics', 12, 50, 1250, 100),
('lueberry - 1pc & 5 boxes', 'Hardware', 0, 0, 0, 24),
('Brown Sugar - 6pc & 2 boxes', 'Hardware', 0, 0, 0, 24),
('Butterscotch - 6pc & 2 boxes', 'Hardware', 0, 0, 0, 24),
('Caramel - 3pc & 3 boxes', 'Hardware', 0, 0, 0, 24),
('Green Apple - 4pc & 5 boxes', 'Hardware', 0, 0, 0, 24);
