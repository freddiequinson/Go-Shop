# GoShopGhana Backend API

A FastAPI-based backend for the GoShopGhana social commerce platform, designed specifically for the Ghanaian market with unique features like bubble networking and quantified sales.

## 🎯 Features

### Core Features
- **User Management**: Registration, authentication, profiles
- **Product Management**: CRUD with quantified sales (kg, gram, piece, liter)
- **Order Management**: Complete order lifecycle
- **Bubble System**: Social groups for buyers/sellers (planned)
- **Fund Transfers**: Between bubble members (planned)
- **Payment Integration**: Paystack for Ghana market (planned)

### Ghana Market Specific
- **Currency**: Ghana Cedis (GHS)
- **Products**: Local produce (plantain, yam, cassava, palm oil, etc.)
- **Markets**: Traditional markets, roadside vendors, farm gates
- **Payment**: Mobile Money integration (MTN, Vodafone, AirtelTigo)

## 🛠️ Tech Stack

- **Framework**: FastAPI 0.104+
- **Database**: PostgreSQL 15+
- **ORM**: SQLAlchemy 2.0+
- **Migrations**: Alembic
- **Authentication**: JWT tokens
- **Validation**: Pydantic v2

## 🚀 Quick Start

### Prerequisites
1. **Python 3.8+** installed
2. **PostgreSQL 15+** installed and running
3. **Git** (optional but recommended)

### Installation Steps

1. **Install PostgreSQL**
   ```bash
   # Download from: https://www.postgresql.org/download/windows/
   # Follow the PostgreSQL setup guide in POSTGRESQL_SETUP_GUIDE.md
   ```

2. **Create Database**
   ```sql
   -- Using psql or pgAdmin
   CREATE DATABASE goshopghana;
   CREATE USER goshop_user WITH PASSWORD 'goshop_password_2024';
   GRANT ALL PRIVILEGES ON DATABASE goshopghana TO goshop_user;
   ```

3. **Setup Backend**
   ```bash
   cd backend
   python setup_backend.py
   ```

4. **Manual Setup (if script fails)**
   ```bash
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # Linux/Mac
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Test database connection
   python test_db_connection.py
   
   # Create and apply migrations
   alembic revision --autogenerate -m "Initial migration"
   alembic upgrade head
   
   # Start the server
   python main.py
   ```

5. **Verify Installation**
   - Visit: http://localhost:8000/docs
   - Check: http://localhost:8000/health

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── api_v1/
│   │       ├── endpoints/
│   │       │   ├── auth.py          # Authentication endpoints
│   │       │   ├── users.py         # User management
│   │       │   ├── products.py      # Product CRUD
│   │       │   └── orders.py        # Order management
│   │       └── api.py               # API router
│   ├── core/
│   │   └── config.py                # Application settings
│   ├── db/
│   │   └── database.py              # Database connection
│   └── models/
│       ├── user.py                  # User model
│       ├── product.py               # Product & Category models
│       └── order.py                 # Order & OrderItem models
├── alembic/                         # Database migrations
├── .env                             # Environment variables
├── .env.example                     # Environment template
├── main.py                          # Application entry point
├── requirements.txt                 # Python dependencies
└── test_db_connection.py            # Database test script
```

## 🔧 Configuration

### Environment Variables (.env)
```env
# Application
PROJECT_NAME="GoShopGhana API"
VERSION="1.0.0"
SECRET_KEY="your-secret-key"

# Database
DATABASE_URL="postgresql://localhost:5432/goshopghana"

# CORS (for frontend integration)
BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://localhost:5500"]

# JWT
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALGORITHM="HS256"
```

## 🗄️ Database Models

### User Model
- **Types**: Buyer, Seller, Admin
- **Verification**: Pending, Verified, Rejected
- **Premium Tiers**: Basic, Silver, Gold, Platinum
- **Ghana Context**: Location field for Ghanaian cities/regions

### Product Model (Quantified Sales)
- **Unit Types**: kg, gram, piece, liter, pack
- **Pricing**: Price per unit (not total price)
- **Inventory**: Stock quantity tracking
- **Categories**: Hierarchical category system

### Order Model
- **Status**: Pending → Confirmed → Preparing → Dispatched → Delivered
- **Pricing**: Stored in cents (Ghana pesewas) for accuracy
- **Delivery**: JSON address storage for flexible addressing

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user

### Products
- `GET /api/v1/products/` - List products (with filtering)
- `POST /api/v1/products/` - Create product
- `GET /api/v1/products/{id}` - Get product details
- `PUT /api/v1/products/{id}` - Update product
- `DELETE /api/v1/products/{id}` - Delete product

### Orders
- `GET /api/v1/orders/` - Get user orders
- `POST /api/v1/orders/` - Create order
- `GET /api/v1/orders/{id}` - Get order details
- `PUT /api/v1/orders/{id}/status` - Update order status

## 🧪 Testing

### Database Connection Test
```bash
python test_db_connection.py
```

### API Testing
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Postman**: Import OpenAPI spec from `/openapi.json`

## 🔍 Database Management

### Using pgAdmin 4
1. Connect to localhost:5432
2. Username: `goshop_user` / Password: `goshop_password_2024`
3. Database: `goshopghana`

### Using Command Line (psql)
```bash
# Connect to database
psql -U goshop_user -d goshopghana -h localhost

# List tables
\dt

# Describe table
\d users

# Query data
SELECT * FROM users LIMIT 5;
```

### Common Alembic Commands
```bash
# Create migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# View migration history
alembic history

# Rollback migration
alembic downgrade -1
```

## 🚨 Troubleshooting

### Common Issues

**"Connection refused"**
- Check if PostgreSQL service is running
- Verify connection details in .env file

**"Database does not exist"**
- Create database using pgAdmin or psql
- Check database name in .env file

**"Authentication failed"**
- Verify username/password in .env file
- Check user permissions in PostgreSQL

**"Module not found"**
- Activate virtual environment: `venv\Scripts\activate`
- Install dependencies: `pip install -r requirements.txt`

### Getting Help
1. Check the setup guides in the backend directory
2. Review the error logs
3. Test database connection with `test_db_connection.py`
4. Verify all environment variables are set correctly

## 📋 Development Workflow

### Daily Development
1. Activate virtual environment
2. Start PostgreSQL service
3. Run the FastAPI server: `python main.py`
4. Make changes to models/endpoints
5. Create migrations: `alembic revision --autogenerate -m "Description"`
6. Apply migrations: `alembic upgrade head`
7. Test endpoints at http://localhost:8000/docs

### Adding New Features
1. Create/modify models in `app/models/`
2. Create migration with Alembic
3. Add API endpoints in `app/api/api_v1/endpoints/`
4. Update API router in `app/api/api_v1/api.py`
5. Test with Swagger UI or Postman

## 🎯 Next Steps

### Week 1-2 Goals
- [x] Project structure created
- [x] Database models defined
- [x] PostgreSQL connection established
- [ ] Authentication endpoints implemented
- [ ] Basic CRUD operations working
- [ ] Frontend integration started

### Upcoming Features
- User authentication with JWT
- Product CRUD with quantified sales
- Shopping cart API
- Order management system
- Bubble system for social commerce
- Fund transfer capabilities
- Payment integration (Paystack)

---

**Ready to start building the GoShopGhana API! 🚀**
