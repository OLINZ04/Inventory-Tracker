// API Configuration
const API_BASE_URL = 'api/inventory.php';

// Global state
let currentItem = null;
let allItems = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadInventory();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    document.getElementById('searchInput').addEventListener('input', function(e) {
        filterInventory(e.target.value);
    });

    // Close modals on background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.classList.remove('active');
        });
    });
}

// Load inventory data
async function loadInventory() {
    try {
        const response = await fetch(`${API_BASE_URL}?action=items`);
        const items = await response.json();
        allItems = sortItemsAlphabetically(items);
        renderInventory(allItems);
    } catch (error) {
        console.error('Error loading inventory:', error);
        showToast('Failed to load inventory', 'error');
    }
}

// Sort items alphabetically
function sortItemsAlphabetically(items) {
    return items.sort((a, b) => a.item_name.toLowerCase().localeCompare(b.item_name.toLowerCase()));
}

// Render inventory table
function renderInventory(items) {
    const tbody = document.getElementById('inventoryTableBody');
    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state"><h3>No items found</h3><p>Add your first item to get started</p></td></tr>`;
        return;
    }

    tbody.innerHTML = items.map(item => {
        const isLowStock = parseInt(item.boxes) === 0 && parseInt(item.pieces) < 30;
        const stockClass = isLowStock ? 'low-stock' : '';
        const lowStockIndicator = isLowStock ? '<span class="low-stock-indicator"></span>' : '';

        return `
            <tr>
                <td><input type="checkbox" class="select-item" value="${item.id}"></td>
                <td><div class="item-name">${escapeHtml(item.item_name)}</div></td>
                <td><span class="category-badge">${escapeHtml(item.category)}</span></td>
                <td>
                    <div class="stock-info">
                        <span class="stock-main ${stockClass}">
                            ${item.boxes} Boxes & ${item.pieces} Pcs ${lowStockIndicator}
                        </span>
                        <span class="stock-total">${item.total_pieces} total pcs</span>
                    </div>
                </td>
                <td>
                    <div class="actions-group">
                        <button class="btn btn-success" onclick="openPullInModal(${item.id})">Pull In</button>
                        <button class="btn btn-danger" onclick="openPullOutModal(${item.id})">Pull Out</button>
                        <button class="btn-icon" onclick="openEditItemModal(${item.id})" title="Edit">Edit</button>
                        <button class="btn-icon" onclick="deleteItem(${item.id})" title="Delete">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Filter inventory
function filterInventory(searchTerm) {
    const filtered = allItems.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        return item.item_name.toLowerCase().includes(searchLower) || item.category.toLowerCase().includes(searchLower);
    });
    renderInventory(sortItemsAlphabetically(filtered));
}

// -------------------- Pull In --------------------
async function openPullInModal(itemId) {
    const item = allItems.find(i => i.id === itemId);
    currentItem = { ...item };

    document.getElementById('pullInItemName').textContent = currentItem.item_name;
    document.getElementById('pullInCurrentStock').textContent = `${currentItem.boxes} Boxes & ${currentItem.pieces} Pcs`;
    document.getElementById('pullInBoxes').value = 0;
    document.getElementById('pullInPieces').value = 0;

    document.getElementById('pullInModal').classList.add('active');
}

async function confirmPullIn() {
    const boxes = parseInt(document.getElementById('pullInBoxes').value) || 0;
    const pieces = parseInt(document.getElementById('pullInPieces').value) || 0;

    if (boxes <= 0 && pieces <= 0) {
        showToast('Please enter boxes or pieces to add', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}?action=pull_in`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_id: currentItem.id, boxes, pieces })
        });
        const result = await response.json();

        if (result.message.includes('success')) {
            showToast('Stock pulled in successfully', 'success');

            const index = allItems.findIndex(i => i.id === currentItem.id);
            allItems[index].boxes += boxes;
            allItems[index].pieces += pieces;
            allItems[index].total_pieces += boxes + pieces; // update total as desired

            renderInventory(sortItemsAlphabetically(allItems));
            closePullInModal();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error pulling in stock:', error);
        showToast('Failed to pull in stock', 'error');
    }
}

function closePullInModal() {
    document.getElementById('pullInModal').classList.remove('active');
    currentItem = null;
}

// -------------------- Pull Out --------------------
async function openPullOutModal(itemId) {
    const item = allItems.find(i => i.id === itemId);
    currentItem = { ...item };

    document.getElementById('pullOutItemName').textContent = currentItem.item_name;
    document.getElementById('pullOutCurrentStock').textContent = `${currentItem.boxes} Boxes & ${currentItem.pieces} Pcs`;
    document.getElementById('pullOutBoxes').value = 0;
    document.getElementById('pullOutPieces').value = 0;

    document.getElementById('pullOutModal').classList.add('active');
}

async function confirmPullOut() {
    const boxes = parseInt(document.getElementById('pullOutBoxes').value) || 0;
    const pieces = parseInt(document.getElementById('pullOutPieces').value) || 0;

    if (boxes <= 0 && pieces <= 0) {
        showToast('Please enter boxes or pieces to remove', 'error');
        return;
    }

    if (boxes > currentItem.boxes || pieces > currentItem.pieces) {
        showToast('Cannot withdraw more than current stock', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}?action=pull_out`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_id: currentItem.id, boxes, pieces })
        });
        const result = await response.json();

        if (result.message.includes('success')) {
            showToast('Stock pulled out successfully', 'success');

            const index = allItems.findIndex(i => i.id === currentItem.id);
            allItems[index].boxes -= boxes;
            allItems[index].pieces -= pieces;
            allItems[index].total_pieces -= boxes + pieces;

            renderInventory(sortItemsAlphabetically(allItems));
            closePullOutModal();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error pulling out stock:', error);
        showToast('Failed to pull out stock', 'error');
    }
}

function closePullOutModal() {
    document.getElementById('pullOutModal').classList.remove('active');
    currentItem = null;
}

// -------------------- Add Item --------------------
function openAddItemModal() {
    document.getElementById('addItemName').value = '';
    document.getElementById('addItemCategory').value = 'Hardware';
    showSingleTab();
    document.getElementById('addItemModal').classList.add('active');
}

function closeAddItemModal() {
    document.getElementById('addItemModal').classList.remove('active');
}

async function confirmAddItem() {
    const itemName = document.getElementById('addItemName').value.trim();
    const category = document.getElementById('addItemCategory').value;

    if (!itemName) return showToast('Please enter an item name', 'error');

    try {
        const response = await fetch(`${API_BASE_URL}?action=add_item`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_name: itemName, category })
        });
        const result = await response.json();

        if (result.message.includes('success')) {
            allItems.push(result.item);
            renderInventory(sortItemsAlphabetically(allItems));
            showToast('Item added successfully', 'success');
            closeAddItemModal();
        } else {
            showToast(result.message, 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Failed to add item', 'error');
    }
}

// -------------------- Edit Item --------------------
async function openEditItemModal(itemId) {
    const item = allItems.find(i => i.id === itemId);
    currentItem = { ...item };

    document.getElementById('editItemName').value = currentItem.item_name;
    document.getElementById('editItemCategory').value = currentItem.category;

    document.getElementById('editItemModal').classList.add('active');
}

function closeEditItemModal() {
    document.getElementById('editItemModal').classList.remove('active');
    currentItem = null;
}

async function confirmEditItem() {
    const itemName = document.getElementById('editItemName').value.trim();
    const category = document.getElementById('editItemCategory').value;
    if (!itemName) return showToast('Please enter an item name', 'error');

    try {
        const response = await fetch(`${API_BASE_URL}?action=update_item`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: currentItem.id, item_name: itemName, category })
        });
        const result = await response.json();

        if (result.message.includes('success')) {
            const index = allItems.findIndex(i => i.id === currentItem.id);
            allItems[index].item_name = itemName;
            allItems[index].category = category;
            renderInventory(sortItemsAlphabetically(allItems));
            showToast('Item updated successfully', 'success');
            closeEditItemModal();
        } else {
            showToast(result.message, 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Failed to update item', 'error');
    }
}

// -------------------- Delete Item --------------------
async function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}?action=delete_item&id=${itemId}`, { method: 'DELETE' });
        const result = await response.json();

        if (result.message.includes('success')) {
            allItems = allItems.filter(i => i.id !== itemId);
            renderInventory(allItems);
            showToast('Item deleted successfully', 'success');
        } else {
            showToast(result.message, 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Failed to delete item', 'error');
    }
}

// -------------------- Bulk Delete --------------------
function toggleSelectAll(masterCheckbox) {
    document.querySelectorAll('.select-item').forEach(cb => cb.checked = masterCheckbox.checked);
}

async function deleteSelectedItems() {
    const selected = Array.from(document.querySelectorAll('.select-item:checked')).map(cb => parseInt(cb.value));
    if (selected.length === 0) return showToast('No items selected', 'error');
    if (!confirm(`Are you sure you want to delete ${selected.length} item(s)?`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}?action=delete_multiple`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: selected })
        });
        const result = await response.json();

        if (result.message.includes('success')) {
            allItems = allItems.filter(item => !selected.includes(item.id));
            renderInventory(allItems);
            showToast(`${selected.length} items deleted`, 'success');
        } else {
            showToast(result.message, 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Failed to delete selected items', 'error');
    }
}

// -------------------- Toast --------------------
function showToast(message, type = 'success') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// -------------------- Utilities --------------------
function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// -------------------- Tabs --------------------
function showSingleTab() {
    document.getElementById('singleTab').style.display = 'block';
    document.getElementById('bulkTab').style.display = 'none';
    document.getElementById('tabSingle').classList.add('active');
    document.getElementById('tabBulk').classList.remove('active');
}

function showBulkTab() {
    document.getElementById('singleTab').style.display = 'none';
    document.getElementById('bulkTab').style.display = 'block';
    document.getElementById('tabSingle').classList.remove('active');
    document.getElementById('tabBulk').classList.add('active');
}

// -------------------- Bulk Add --------------------
async function confirmBulkAdd() {
    const text = document.getElementById('bulkItems').value.trim();
    const defaultCategory = document.getElementById('bulkDefaultCategory').value;
    if (!text) return showToast('Please paste items', 'error');

    const lines = text.split('\n');
    const items = lines.map(line => {
        const parts = line.split(',');
        return { item_name: parts[0].trim(), category: parts[1] ? parts[1].trim() : defaultCategory };
    }).filter(i => i.item_name);

    try {
        const response = await fetch(`${API_BASE_URL}?action=bulk_add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items })
        });
        const result = await response.json();

        if (result.message.includes('success')) {
            allItems = allItems.concat(result.items);
            renderInventory(allItems);
            showToast(`${items.length} items added`, 'success');
            closeAddItemModal();
        } else {
            showToast(result.message, 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Bulk add failed', 'error');
    }
}
function printInventory() {
    // Fetch current inventory from API
    fetch('api/inventory.php?action=items')
    .then(res => res.json())
    .then(data => {
        const tbody = document.getElementById('printInventoryBody');
        tbody.innerHTML = ''; // Clear previous rows

        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.item_name}</td>
                <td>${item.category}</td>
                <td>${item.boxes}</td>
                <td>${item.pieces}</td>
                
               
            `;
            tbody.appendChild(row);
        });

        // Open print window
        const printContents = document.getElementById('printableInventory').innerHTML;
        const originalContents = document.body.innerHTML;

        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;

        // Re-initialize JS event listeners if needed
        location.reload();
    })
    .catch(err => console.error("Failed to load inventory for printing:", err));
}
function printInventory() {
    // Fetch current inventory from API
    fetch('api/inventory.php?action=items')
    .then(res => res.json())
    .then(data => {
        const tbody = document.getElementById('printInventoryBody');
        tbody.innerHTML = ''; // Clear previous rows

        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.item_name}</td>
                <td>${item.category}</td>
                <td>${item.boxes}</td>
                <td>${item.pieces}</td>
                
                
            `;
            tbody.appendChild(row);
        });

        // Open print window
        const printContents = document.getElementById('printableInventory').innerHTML;
        const originalContents = document.body.innerHTML;

        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;

        // Re-initialize JS event listeners if needed
        location.reload();
    })
    .catch(err => console.error("Failed to load inventory for printing:", err));
}

