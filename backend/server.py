"""
E-commerce Reselling Platform Backend
Similar to Meesho - Fashion focused with guest checkout
With Admin Authentication and Image Upload
"""

from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import secrets
import shutil
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Fashion Reseller API")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Setup HTTP Basic Auth for Admin
security = HTTPBasic()

# Admin credentials (in production, use environment variables)
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')

# Directory for uploaded images
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# JSON file for product data backup
PRODUCTS_JSON_FILE = ROOT_DIR / "products_data.json"

# ============== HELPER FUNCTIONS ==============

def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify admin credentials"""
    is_username_correct = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    is_password_correct = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    
    if not (is_username_correct and is_password_correct):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

def save_products_to_json(products: List[dict]):
    """Save products to JSON file"""
    try:
        with open(PRODUCTS_JSON_FILE, 'w') as f:
            json.dump(products, f, indent=2, default=str)
    except Exception as e:
        logging.error(f"Error saving products to JSON: {e}")

def load_products_from_json() -> List[dict]:
    """Load products from JSON file"""
    try:
        if PRODUCTS_JSON_FILE.exists():
            with open(PRODUCTS_JSON_FILE, 'r') as f:
                return json.load(f)
    except Exception as e:
        logging.error(f"Error loading products from JSON: {e}")
    return []

async def sync_products_to_json():
    """Sync MongoDB products to JSON file"""
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    save_products_to_json(products)

# ============== MODELS ==============

class Product(BaseModel):
    """Product model for fashion items"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    original_price: Optional[float] = None
    category: str  # clothing, footwear, accessories
    subcategory: Optional[str] = None
    images: List[str]
    sizes: Optional[List[str]] = None
    colors: Optional[List[str]] = None
    stock: int = 100
    rating: float = 4.5
    reviews_count: int = 0
    is_featured: bool = False
    is_new_arrival: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    """Schema for creating a product"""
    name: str
    description: str
    price: float
    original_price: Optional[float] = None
    category: str
    subcategory: Optional[str] = None
    images: List[str]
    sizes: Optional[List[str]] = None
    colors: Optional[List[str]] = None
    stock: int = 100
    is_featured: bool = False
    is_new_arrival: bool = False

class ProductUpdate(BaseModel):
    """Schema for updating a product"""
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    images: Optional[List[str]] = None
    sizes: Optional[List[str]] = None
    colors: Optional[List[str]] = None
    stock: Optional[int] = None
    is_featured: Optional[bool] = None
    is_new_arrival: Optional[bool] = None

class CartItem(BaseModel):
    """Cart item model"""
    product_id: str
    quantity: int = 1
    size: Optional[str] = None
    color: Optional[str] = None

class CustomerDetails(BaseModel):
    """Customer details for checkout"""
    name: str
    phone: str
    email: Optional[str] = None
    address: str
    city: str
    state: str
    pincode: str

class OrderCreate(BaseModel):
    """Schema for creating an order"""
    items: List[CartItem]
    customer: CustomerDetails
    payment_method: str = "cod"  # Cash on delivery

class Order(BaseModel):
    """Order model"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    items: List[dict]  # Product details with quantity
    customer: dict
    subtotal: float
    shipping: float = 40.0
    total: float
    status: str = "pending"  # pending, confirmed, shipped, delivered, cancelled
    payment_method: str = "cod"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Analytics(BaseModel):
    """Analytics response model"""
    total_products: int
    total_orders: int
    total_revenue: float
    pending_orders: int
    confirmed_orders: int
    shipped_orders: int
    delivered_orders: int
    cancelled_orders: int
    orders_by_category: dict
    recent_orders: List[dict]

# ============== PRODUCT ENDPOINTS ==============

@api_router.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Fashion Reseller API is running"}

# ============== ADMIN AUTH ENDPOINTS ==============

@api_router.post("/admin/login")
async def admin_login(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify admin login and return success"""
    verify_admin(credentials)
    return {"message": "Login successful", "username": credentials.username}

@api_router.get("/admin/verify")
async def verify_admin_session(username: str = Depends(verify_admin)):
    """Verify if admin session is valid"""
    return {"authenticated": True, "username": username}

# ============== IMAGE UPLOAD ENDPOINT ==============

@api_router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    username: str = Depends(verify_admin)
):
    """Upload product image (Admin only)"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Allowed: JPEG, PNG, WebP, GIF")
    
    # Generate unique filename
    file_ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save image: {str(e)}")
    
    # Return the URL path for the uploaded image
    image_url = f"/api/uploads/{unique_filename}"
    return {"url": image_url, "filename": unique_filename}

@api_router.get("/products", response_model=List[Product])
async def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None,
    new_arrival: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None
):
    """Get all products with optional filters"""
    query = {}
    
    if category:
        query["category"] = category
    if featured:
        query["is_featured"] = featured
    if new_arrival:
        query["is_new_arrival"] = new_arrival
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        if "price" in query:
            query["price"]["$lte"] = max_price
        else:
            query["price"] = {"$lte": max_price}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    products = await db.products.find(query, {"_id": 0}).to_list(100)
    
    # Convert datetime strings back to datetime objects
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    """Get a single product by ID"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if isinstance(product.get('created_at'), str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    
    return product

@api_router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate, username: str = Depends(verify_admin)):
    """Create a new product (Admin only)"""
    product = Product(**product_data.model_dump())
    doc = product.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.products.insert_one(doc)
    
    # Sync to JSON file
    await sync_products_to_json()
    
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductUpdate, username: str = Depends(verify_admin)):
    """Update an existing product (Admin only)"""
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = {k: v for k, v in product_data.model_dump().items() if v is not None}
    
    if update_data:
        await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    
    # Sync to JSON file
    await sync_products_to_json()
    
    return updated

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, username: str = Depends(verify_admin)):
    """Delete a product (Admin only)"""
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Sync to JSON file
    await sync_products_to_json()
    
    return {"message": "Product deleted successfully"}

# ============== ORDER ENDPOINTS ==============

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate):
    """Create a new order (Guest checkout)"""
    # Fetch product details for each item
    items_with_details = []
    subtotal = 0
    
    for item in order_data.items:
        product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        
        item_total = product["price"] * item.quantity
        subtotal += item_total
        
        items_with_details.append({
            "product_id": item.product_id,
            "name": product["name"],
            "price": product["price"],
            "image": product["images"][0] if product["images"] else "",
            "quantity": item.quantity,
            "size": item.size,
            "color": item.color,
            "item_total": item_total,
            "category": product["category"]
        })
        
        # Update stock
        await db.products.update_one(
            {"id": item.product_id},
            {"$inc": {"stock": -item.quantity}}
        )
    
    shipping = 40.0 if subtotal < 500 else 0
    total = subtotal + shipping
    
    order = Order(
        items=items_with_details,
        customer=order_data.customer.model_dump(),
        subtotal=subtotal,
        shipping=shipping,
        total=total,
        payment_method=order_data.payment_method,
        status="confirmed"
    )
    
    doc = order.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.orders.insert_one(doc)
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders(status: Optional[str] = None):
    """Get all orders (Admin)"""
    query = {}
    if status:
        query["status"] = status
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    
    return orders

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    """Get a single order by ID"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if isinstance(order.get('created_at'), str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    
    return order

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str):
    """Update order status (Admin)"""
    valid_statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": f"Order status updated to {status}"}

# ============== ANALYTICS ENDPOINTS ==============

@api_router.get("/analytics", response_model=Analytics)
async def get_analytics():
    """Get dashboard analytics (Admin)"""
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    
    # Calculate total revenue
    orders = await db.orders.find({}, {"_id": 0, "total": 1, "status": 1, "items": 1, "created_at": 1, "id": 1, "customer": 1}).to_list(1000)
    total_revenue = sum(order.get("total", 0) for order in orders if order.get("status") != "cancelled")
    
    # Count orders by status
    status_counts = {
        "pending": 0,
        "confirmed": 0,
        "shipped": 0,
        "delivered": 0,
        "cancelled": 0
    }
    
    orders_by_category = {}
    
    for order in orders:
        status = order.get("status", "pending")
        if status in status_counts:
            status_counts[status] += 1
        
        # Count by category
        for item in order.get("items", []):
            cat = item.get("category", "other")
            if cat not in orders_by_category:
                orders_by_category[cat] = 0
            orders_by_category[cat] += item.get("quantity", 1)
    
    # Get recent orders (last 10)
    recent_orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(10)
    for order in recent_orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at']).isoformat()
    
    return Analytics(
        total_products=total_products,
        total_orders=total_orders,
        total_revenue=total_revenue,
        pending_orders=status_counts["pending"],
        confirmed_orders=status_counts["confirmed"],
        shipped_orders=status_counts["shipped"],
        delivered_orders=status_counts["delivered"],
        cancelled_orders=status_counts["cancelled"],
        orders_by_category=orders_by_category,
        recent_orders=recent_orders
    )

# ============== SEED DATA ENDPOINT ==============

@api_router.post("/seed")
async def seed_products():
    """Seed database with sample fashion products"""
    
    # Check if products already exist
    existing = await db.products.count_documents({})
    if existing > 0:
        return {"message": f"Database already has {existing} products. Skipping seed."}
    
    sample_products = [
        # Clothing
        {
            "id": str(uuid.uuid4()),
            "name": "Classic White Shirt",
            "description": "Premium cotton white shirt with a modern fit. Perfect for both casual and formal occasions.",
            "price": 799,
            "original_price": 1299,
            "category": "clothing",
            "subcategory": "shirts",
            "images": ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800"],
            "sizes": ["S", "M", "L", "XL"],
            "colors": ["White", "Blue", "Black"],
            "stock": 50,
            "rating": 4.6,
            "reviews_count": 128,
            "is_featured": True,
            "is_new_arrival": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Floral Summer Dress",
            "description": "Lightweight floral print dress perfect for summer outings. Made with breathable fabric.",
            "price": 1299,
            "original_price": 1999,
            "category": "clothing",
            "subcategory": "dresses",
            "images": ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800"],
            "sizes": ["XS", "S", "M", "L"],
            "colors": ["Floral Pink", "Floral Blue"],
            "stock": 35,
            "rating": 4.8,
            "reviews_count": 89,
            "is_featured": True,
            "is_new_arrival": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Slim Fit Chinos",
            "description": "Comfortable slim fit chinos with stretch fabric. Great for everyday wear.",
            "price": 999,
            "original_price": 1499,
            "category": "clothing",
            "subcategory": "pants",
            "images": ["https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800"],
            "sizes": ["28", "30", "32", "34", "36"],
            "colors": ["Khaki", "Navy", "Black"],
            "stock": 60,
            "rating": 4.5,
            "reviews_count": 234,
            "is_featured": False,
            "is_new_arrival": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Oversized Hoodie",
            "description": "Cozy oversized hoodie with kangaroo pocket. Premium fleece lining.",
            "price": 1199,
            "original_price": 1799,
            "category": "clothing",
            "subcategory": "hoodies",
            "images": ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800"],
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "colors": ["Grey", "Black", "Navy"],
            "stock": 45,
            "rating": 4.7,
            "reviews_count": 156,
            "is_featured": True,
            "is_new_arrival": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Denim Jacket",
            "description": "Classic denim jacket with vintage wash. A wardrobe essential.",
            "price": 1599,
            "original_price": 2499,
            "category": "clothing",
            "subcategory": "jackets",
            "images": ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800"],
            "sizes": ["S", "M", "L", "XL"],
            "colors": ["Light Blue", "Dark Blue"],
            "stock": 30,
            "rating": 4.6,
            "reviews_count": 98,
            "is_featured": False,
            "is_new_arrival": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Footwear
        {
            "id": str(uuid.uuid4()),
            "name": "Classic White Sneakers",
            "description": "Minimalist white leather sneakers. Comfortable and stylish for any occasion.",
            "price": 1999,
            "original_price": 2999,
            "category": "footwear",
            "subcategory": "sneakers",
            "images": ["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800"],
            "sizes": ["6", "7", "8", "9", "10", "11"],
            "colors": ["White", "Black"],
            "stock": 40,
            "rating": 4.8,
            "reviews_count": 312,
            "is_featured": True,
            "is_new_arrival": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Running Shoes Pro",
            "description": "High-performance running shoes with cushioned sole. Lightweight and breathable.",
            "price": 2499,
            "original_price": 3499,
            "category": "footwear",
            "subcategory": "sports",
            "images": ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"],
            "sizes": ["7", "8", "9", "10", "11"],
            "colors": ["Red/Black", "Blue/White"],
            "stock": 25,
            "rating": 4.7,
            "reviews_count": 189,
            "is_featured": True,
            "is_new_arrival": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Leather Loafers",
            "description": "Elegant leather loafers with cushioned insole. Perfect for formal occasions.",
            "price": 1799,
            "original_price": 2499,
            "category": "footwear",
            "subcategory": "formal",
            "images": ["https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=800"],
            "sizes": ["7", "8", "9", "10", "11"],
            "colors": ["Brown", "Black"],
            "stock": 35,
            "rating": 4.5,
            "reviews_count": 145,
            "is_featured": False,
            "is_new_arrival": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Strappy Block Heels",
            "description": "Elegant strappy heels with comfortable block heel. Perfect for parties.",
            "price": 1499,
            "original_price": 2199,
            "category": "footwear",
            "subcategory": "heels",
            "images": ["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800"],
            "sizes": ["5", "6", "7", "8", "9"],
            "colors": ["Black", "Nude", "Red"],
            "stock": 30,
            "rating": 4.4,
            "reviews_count": 78,
            "is_featured": False,
            "is_new_arrival": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Accessories
        {
            "id": str(uuid.uuid4()),
            "name": "Leather Crossbody Bag",
            "description": "Compact leather crossbody bag with adjustable strap. Multiple compartments.",
            "price": 899,
            "original_price": 1399,
            "category": "accessories",
            "subcategory": "bags",
            "images": ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800"],
            "sizes": None,
            "colors": ["Brown", "Black", "Tan"],
            "stock": 50,
            "rating": 4.6,
            "reviews_count": 203,
            "is_featured": True,
            "is_new_arrival": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Classic Aviator Sunglasses",
            "description": "Timeless aviator sunglasses with UV protection. Metal frame.",
            "price": 599,
            "original_price": 899,
            "category": "accessories",
            "subcategory": "eyewear",
            "images": ["https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800"],
            "sizes": None,
            "colors": ["Gold/Green", "Silver/Blue"],
            "stock": 70,
            "rating": 4.5,
            "reviews_count": 167,
            "is_featured": False,
            "is_new_arrival": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Minimalist Watch",
            "description": "Elegant minimalist watch with leather strap. Japanese movement.",
            "price": 1299,
            "original_price": 1999,
            "category": "accessories",
            "subcategory": "watches",
            "images": ["https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800"],
            "sizes": None,
            "colors": ["Black/Gold", "Brown/Silver"],
            "stock": 40,
            "rating": 4.7,
            "reviews_count": 234,
            "is_featured": True,
            "is_new_arrival": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Silk Scarf",
            "description": "Luxurious silk scarf with elegant print. Versatile accessory.",
            "price": 499,
            "original_price": 799,
            "category": "accessories",
            "subcategory": "scarves",
            "images": ["https://images.unsplash.com/photo-1584736286279-5d9c3d6c6f43?w=800"],
            "sizes": None,
            "colors": ["Multicolor", "Navy", "Beige"],
            "stock": 60,
            "rating": 4.4,
            "reviews_count": 89,
            "is_featured": False,
            "is_new_arrival": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Leather Belt",
            "description": "Premium leather belt with classic buckle. Adjustable size.",
            "price": 399,
            "original_price": 599,
            "category": "accessories",
            "subcategory": "belts",
            "images": ["https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800"],
            "sizes": ["S", "M", "L", "XL"],
            "colors": ["Brown", "Black"],
            "stock": 80,
            "rating": 4.3,
            "reviews_count": 145,
            "is_featured": False,
            "is_new_arrival": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.products.insert_many(sample_products)
    return {"message": f"Successfully seeded {len(sample_products)} products"}

# Include the router
app.include_router(api_router)

# Mount static files for uploaded images
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
