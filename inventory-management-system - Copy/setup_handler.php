<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$host = $_POST['host'] ?? 'localhost';
$username = $_POST['username'] ?? 'root';
$password = $_POST['password'] ?? '';
$database = $_POST['database'] ?? 'inventory_system';

try {
    // First, connect without database to create it
    $conn = new PDO("mysql:host=$host", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create database
    $conn->exec("CREATE DATABASE IF NOT EXISTS `$database` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    
    // Connect to the new database
    $conn->exec("USE `$database`");
    
    // Create items table
    $conn->exec("
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    
    // Create transactions table
    $conn->exec("
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    
    // Check if sample data already exists
    $stmt = $conn->query("SELECT COUNT(*) FROM items");
    $count = $stmt->fetchColumn();
    
    // Insert sample data only if table is empty
    if ($count == 0) {
        $conn->exec("
            INSERT INTO items (item_name, category, boxes, pieces, total_pieces, pieces_per_box) VALUES
            ('Standard Widget A', 'Hardware', 6, 4, 148, 24),
            ('Premium Bolt XL', 'Fasteners', 0, 25, 25, 24),
            ('Electronic Component Z', 'Electronics', 12, 50, 1250, 100),
            ('Blueberry - 1pc & 5 boxes', 'Hardware', 0, 0, 0, 24),
            ('Brown Sugar - 6pc & 2 boxes', 'Hardware', 0, 0, 0, 24),
            ('Butterscotch - 6pc & 2 boxes', 'Hardware', 0, 0, 0, 24),
            ('Caramel - 3pc & 3 boxes', 'Hardware', 0, 0, 0, 24),
            ('Green Apple - 4pc & 5 boxes', 'Hardware', 0, 0, 0, 24)
        ");
    }
    
    // Update config/database.php with new credentials
    $configContent = "<?php
// Database Configuration
class Database {
    private \$host = \"$host\";
    private \$db_name = \"$database\";
    private \$username = \"$username\";
    private \$password = \"$password\";
    public \$conn;

    public function getConnection() {
        \$this->conn = null;
        try {
            \$this->conn = new PDO(
                \"mysql:host=\" . \$this->host . \";dbname=\" . \$this->db_name,
                \$this->username,
                \$this->password
            );
            \$this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            \$this->conn->exec(\"set names utf8\");
        } catch(PDOException \$exception) {
            echo \"Connection error: \" . \$exception->getMessage();
        }
        return \$this->conn;
    }
}
?>";
    
    file_put_contents('config/database.php', $configContent);
    
    echo json_encode([
        'success' => true,
        'message' => 'Database created successfully with sample data!'
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>
