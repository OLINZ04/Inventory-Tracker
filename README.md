# Inventory Management System

A modern, fully-functional inventory tracking system built with PHP, MySQL, JavaScript, HTML, and CSS. Features real-time stock management with boxes and pieces tracking.

## Features

- ✅ **Real-time Inventory Tracking** - Track items by boxes and pieces
- ✅ **Pull In/Pull Out Operations** - Add or remove stock with automatic calculations
- ✅ **Low Stock Alerts** - Visual indicators for items running low
- ✅ **Search & Filter** - Quickly find items by name or category
- ✅ **CRUD Operations** - Add, edit, and delete inventory items
- ✅ **Transaction History** - Track all stock movements (database level)
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **Modern UI** - Clean, intuitive interface matching your design

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: PHP 7.4+
- **Database**: MySQL 5.7+
- **Design**: Custom CSS with modern design patterns

## Installation

### Prerequisites

- PHP 7.4 or higher
- MySQL 5.7 or higher
- Apache/Nginx web server (or use PHP built-in server for testing)
- Web browser (Chrome, Firefox, Safari, Edge)

### Setup Instructions

1. **Clone or Download the Project**
   ```bash
   # Navigate to your web server directory
   cd /var/www/html/  # For Apache
   # OR
   cd /path/to/your/htdocs/  # For XAMPP/MAMP
   ```

2. **Create Database**
   ```bash
   # Log into MySQL
   mysql -u root -p
   
   # Run the database setup script
   source database.sql
   ```

   Or import via phpMyAdmin:
   - Open phpMyAdmin
   - Create a new database named `inventory_system`
   - Import the `database.sql` file

3. **Configure Database Connection**
   
   Edit `config/database.php` and update these settings if needed:
   ```php
   private $host = "localhost";       // Your MySQL host
   private $db_name = "inventory_system";  // Database name
   private $username = "root";        // Your MySQL username
   private $password = "";            // Your MySQL password
   ```

4. **Set Permissions** (Linux/Mac only)
   ```bash
   chmod -R 755 .
   chmod -R 777 config/
   ```

5. **Start the Application**

   **Option A: Using Apache/Nginx**
   - Place files in your web root directory
   - Access via: `http://localhost/inventory-system/`

   **Option B: Using PHP Built-in Server** (for testing)
   ```bash
   php -S localhost:8000
   ```
   - Access via: `http://localhost:8000`

## Project Structure

```
inventory-system/
├── index.html              # Main dashboard page
├── database.sql            # Database schema and sample data
├── config/
│   └── database.php        # Database connection configuration
├── api/
│   └── inventory.php       # REST API endpoints
├── css/
│   └── style.css          # All styling
├── js/
│   └── app.js             # Frontend JavaScript logic
└── README.md              # This file
```

## API Endpoints

The system provides the following API endpoints:

### GET Requests
- `api/inventory.php?action=items` - Get all items
- `api/inventory.php?action=item&id={id}` - Get single item
- `api/inventory.php?action=transactions&item_id={id}` - Get item transactions

### POST Requests
- `api/inventory.php?action=add_item` - Add new item
- `api/inventory.php?action=pull_in` - Add stock
- `api/inventory.php?action=pull_out` - Remove stock

### PUT Requests
- `api/inventory.php?action=update_item` - Update item details

### DELETE Requests
- `api/inventory.php?action=delete_item&id={id}` - Delete item

## Usage Guide

### Adding New Items
1. Click the "Add Item" button in the header
2. Enter item name and select category
3. Click "Save Item"

### Managing Stock

**Pull In (Add Stock):**
1. Click the "Pull In" button for any item
2. Enter quantity and select unit (boxes or pieces)
3. Review the total pieces being added
4. Click "Confirm Entry"

**Pull Out (Remove Stock):**
1. Click the "Pull Out" button for any item
2. Enter quantity and select unit (boxes or pieces)
3. Review the total pieces being removed
4. Click "Confirm Exit"

### Editing Items
1. Click the edit icon (pencil) for any item
2. Update the item name or category
3. Click "Update Item"

### Searching
- Use the search bar to filter items by name or category
- Results update in real-time as you type

### Stock Calculations

The system automatically:
- Converts pieces to boxes when reaching the pieces-per-box threshold
- Borrows from boxes when pulling out more pieces than available
- Validates sufficient stock before completing pull-out operations
- Tracks total pieces for accurate inventory counts

## Default Configuration

- **Pieces per Box**: 24 (configurable per item in database)
- **Low Stock Threshold**: 0 boxes and less than 30 pieces
- **Categories**: Hardware, Fasteners, Electronics, Tools, Materials

## Customization

### Changing Pieces per Box
Edit the `pieces_per_box` column in the `items` table:
```sql
UPDATE items SET pieces_per_box = 50 WHERE id = 1;
```

### Adding New Categories
Simply add them to the dropdown in:
- `index.html` (lines with category select elements)

### Styling
All styles are in `css/style.css`. The design uses CSS variables for easy theming:
```css
:root {
    --primary-color: #6366F1;
    --success-color: #10B981;
    --danger-color: #EF4444;
    /* ... more variables */
}
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### "Connection error" message
- Check database credentials in `config/database.php`
- Ensure MySQL is running
- Verify database exists

### "Failed to load inventory"
- Check browser console for errors
- Verify API file permissions
- Ensure PHP is running correctly

### Styles not loading
- Clear browser cache
- Check file paths in `index.html`
- Verify CSS file exists at `css/style.css`

## Security Notes

⚠️ **Important**: This is a demo application. For production use:
- Add proper authentication and authorization
- Implement input validation and sanitization
- Use prepared statements (already implemented)
- Add CSRF protection
- Use HTTPS
- Implement rate limiting
- Add proper error logging

## Future Enhancements

Possible additions:
- User authentication system
- Barcode scanning
- CSV export/import
- Advanced reporting
- Email notifications for low stock
- Multi-location support
- Audit logs viewing interface

## License

This project is provided as-is for demonstration purposes.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the browser console for errors
3. Verify database connection
4. Check PHP error logs

---

**Made with ❤️ for inventory management**
