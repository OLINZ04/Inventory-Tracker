# 🚀 QUICK START GUIDE

## Installation in 3 Easy Steps

### Step 1: Setup Web Server
Place all files in your web server directory:

**For XAMPP:**
```
C:\xampp\htdocs\inventory-system\
```

**For MAMP:**
```
/Applications/MAMP/htdocs/inventory-system/
```

**For WAMP:**
```
C:\wamp64\www\inventory-system\
```

**For Linux/Apache:**
```
/var/www/html/inventory-system/
```

### Step 2: Run Database Setup
1. Start your web server (Apache) and MySQL
2. Open your browser and navigate to:
   ```
   http://localhost/inventory-system/setup.html
   ```
3. Enter your database credentials (default: root / no password)
4. Click "Create Database & Tables"
5. Wait for success message

### Step 3: Start Using
You'll be automatically redirected to the dashboard at:
```
http://localhost/inventory-system/
```

## Alternative: Manual Setup

If the automatic setup doesn't work:

1. **Create Database Manually:**
   - Open phpMyAdmin (http://localhost/phpmyadmin)
   - Create a new database named `inventory_system`
   - Import the `database.sql` file

2. **Update Configuration:**
   - Open `config/database.php`
   - Update the credentials to match your MySQL setup

3. **Access the Dashboard:**
   - Navigate to `http://localhost/inventory-system/`

## Default Login
No login required - this is a simple inventory system.

## Sample Data Included
The system comes with 8 sample items to help you get started.

## Need Help?
Check the full README.md for detailed documentation and troubleshooting.

---

**System Requirements:**
- PHP 7.4+
- MySQL 5.7+
- Modern web browser
- Web server (Apache/Nginx) or PHP built-in server

**Test Mode (No installation needed):**
```bash
php -S localhost:8000
```
Then visit: http://localhost:8000/setup.html
