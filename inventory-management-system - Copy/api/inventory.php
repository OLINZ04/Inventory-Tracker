<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config/database.php';
$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$request = isset($_GET['action']) ? $_GET['action'] : '';

// Decode JSON for POST/PUT
$inputData = null;
if (in_array($method, ['POST', 'PUT'])) {
    $inputData = json_decode(file_get_contents("php://input"));
}

// -------------------- ROUTING -------------------- //
switch($method) {
    case 'GET':
        if($request === 'items') getItems($db);
        elseif($request === 'item' && isset($_GET['id'])) getItem($db, $_GET['id']);
        elseif($request === 'transactions' && isset($_GET['item_id'])) getTransactions($db, $_GET['item_id']);
        break;

    case 'POST':
        if($request === 'add_item') addItem($db, $inputData);
        elseif($request === 'pull_in') pullInStock($db, $inputData);
        elseif($request === 'pull_out') pullOutStock($db, $inputData);
        elseif($request === 'bulk_add') bulkAddItems($db, $inputData);
        elseif($request === 'delete_multiple') deleteMultipleItems($db, $inputData);
        break;

    case 'PUT':
        if($request === 'update_item') updateItem($db, $inputData);
        break;

    case 'DELETE':
        if($request === 'delete_item' && isset($_GET['id'])) deleteItem($db, $_GET['id']);
        break;
}

// ===================== FUNCTIONS ===================== //

function getItems($db) {
    $stmt = $db->prepare("SELECT * FROM items ORDER BY created_at DESC");
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

function getItem($db, $id) {
    $stmt = $db->prepare("SELECT * FROM items WHERE id = :id");
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
}

function addItem($db, $data) {
    $pieces_per_box = isset($data->pieces_per_box) ? intval($data->pieces_per_box) : 24;
    $stmt = $db->prepare("INSERT INTO items (item_name, category, boxes, pieces, total_pieces, pieces_per_box) 
                          VALUES (:item_name, :category, 0, 0, 0, :pieces_per_box)");
    $stmt->bindParam(':item_name', $data->item_name);
    $stmt->bindParam(':category', $data->category);
    $stmt->bindParam(':pieces_per_box', $pieces_per_box);

    if($stmt->execute()) {
        $id = $db->lastInsertId();
        echo json_encode([
            "message" => "Item added successfully",
            "item" => [
                "id"=>$id,
                "item_name"=>$data->item_name,
                "category"=>$data->category,
                "boxes"=>0,
                "pieces"=>0,
                "total_pieces"=>0,
                "pieces_per_box"=>$pieces_per_box
            ]
        ]);
    } else echo json_encode(["message" => "Failed to add item"]);
}

function bulkAddItems($db, $data) {
    try {
        $db->beginTransaction();
        $stmt = $db->prepare("INSERT INTO items (item_name, category, boxes, pieces, total_pieces, pieces_per_box) 
                              VALUES (:item_name, :category, 0, 0, 0, :pieces_per_box)");
        $addedItems = [];
        foreach($data->items as $item){
            $pieces_per_box = isset($item->pieces_per_box) ? intval($item->pieces_per_box) : 24;
            $stmt->bindParam(':item_name', $item->item_name);
            $stmt->bindParam(':category', $item->category);
            $stmt->bindParam(':pieces_per_box', $pieces_per_box);
            $stmt->execute();
            $id = $db->lastInsertId();
            $addedItems[] = [
                "id"=>$id,
                "item_name"=>$item->item_name,
                "category"=>$item->category,
                "boxes"=>0,
                "pieces"=>0,
                "total_pieces"=>0,
                "pieces_per_box"=>$pieces_per_box
            ];
        }
        $db->commit();
        echo json_encode(["message"=>"Bulk items added successfully","items"=>$addedItems]);
    } catch(Exception $e){
        $db->rollBack();
        echo json_encode(["message"=>"Failed to bulk add items: ".$e->getMessage()]);
    }
}

function updateItem($db, $data) {
    $stmt = $db->prepare("UPDATE items SET item_name = :item_name, category = :category WHERE id = :id");
    $stmt->bindParam(':id', $data->id, PDO::PARAM_INT);
    $stmt->bindParam(':item_name', $data->item_name);
    $stmt->bindParam(':category', $data->category);
    echo $stmt->execute() ? json_encode(["message"=>"Item updated successfully"]) : json_encode(["message"=>"Failed to update item"]);
}

function deleteItem($db, $id) {
    $stmt = $db->prepare("DELETE FROM items WHERE id = :id");
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    echo $stmt->execute() ? json_encode(["message"=>"Item deleted successfully"]) : json_encode(["message"=>"Failed to delete item"]);
}

function deleteMultipleItems($db, $data){
    if(!isset($data->ids) || !is_array($data->ids) || count($data->ids)===0){
        echo json_encode(["message"=>"No item IDs provided"]); return;
    }
    try{
        $placeholders = implode(',', array_fill(0,count($data->ids),'?'));
        $stmt = $db->prepare("DELETE FROM items WHERE id IN ($placeholders)");
        foreach($data->ids as $i=>$id) $stmt->bindValue($i+1,intval($id),PDO::PARAM_INT);
        echo $stmt->execute() ? json_encode(["message"=>"Selected items deleted successfully"]) : json_encode(["message"=>"Failed to delete selected items"]);
    }catch(Exception $e){ echo json_encode(["message"=>"Error deleting items: ".$e->getMessage()]); }
}

// ------------------- STOCK FUNCTIONS ------------------- //

function pullInStock($db, $data){
    if(!isset($data->boxes)) $data->boxes = 0;
    if(!isset($data->pieces)) $data->pieces = 0;

    $stmt = $db->prepare("SELECT * FROM items WHERE id=:id");
    $stmt->bindParam(':id',$data->item_id, PDO::PARAM_INT);
    $stmt->execute();
    $item = $stmt->fetch(PDO::FETCH_ASSOC);
    if(!$item) { echo json_encode(["message"=>"Item not found"]); return; }

    $boxes = intval($item['boxes']) + intval($data->boxes);
    $pieces = intval($item['pieces']) + intval($data->pieces);
    $total = intval($item['total_pieces']) + intval($data->boxes)*intval($item['pieces_per_box']) + intval($data->pieces);

    $update = $db->prepare("UPDATE items SET boxes=:boxes, pieces=:pieces, total_pieces=:total WHERE id=:id");
    $update->bindParam(':boxes',$boxes);
    $update->bindParam(':pieces',$pieces);
    $update->bindParam(':total',$total);
    $update->bindParam(':id',$data->item_id, PDO::PARAM_INT);

    echo $update->execute() ? json_encode(["message"=>"Pull in successful"]) : json_encode(["message"=>"Failed to pull in"]);
}

function pullOutStock($db, $data){
    if(!isset($data->boxes)) $data->boxes = 0;
    if(!isset($data->pieces)) $data->pieces = 0;

    $stmt = $db->prepare("SELECT * FROM items WHERE id=:id");
    $stmt->bindParam(':id',$data->item_id, PDO::PARAM_INT);
    $stmt->execute();
    $item = $stmt->fetch(PDO::FETCH_ASSOC);
    if(!$item) { echo json_encode(["message"=>"Item not found"]); return; }

    $boxes = max(0,intval($item['boxes']) - intval($data->boxes));
    $pieces = max(0,intval($item['pieces']) - intval($data->pieces));
    $total = max(0,intval($item['total_pieces']) - (intval($data->boxes)*intval($item['pieces_per_box'])) - intval($data->pieces));

    $update = $db->prepare("UPDATE items SET boxes=:boxes, pieces=:pieces, total_pieces=:total WHERE id=:id");
    $update->bindParam(':boxes',$boxes);
    $update->bindParam(':pieces',$pieces);
    $update->bindParam(':total',$total);
    $update->bindParam(':id',$data->item_id, PDO::PARAM_INT);

    echo $update->execute() ? json_encode(["message"=>"Pull out successful"]) : json_encode(["message"=>"Failed to pull out"]);
}

// ------------------- TRANSACTIONS ------------------- //
function getTransactions($db,$item_id){
    $stmt = $db->prepare("SELECT * FROM transactions WHERE item_id=:item_id ORDER BY transaction_date DESC");
    $stmt->bindParam(':item_id',$item_id, PDO::PARAM_INT);
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}
?>
