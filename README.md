# Inventory Management System

A comprehensive web-based inventory management system with multi-tier user access control, featuring modern dashboard design with sidebar navigation, colorful stat cards, charts, and detailed sections.

## Features

### 🔐 Multi-Tier Authentication System
- **Admin**: Complete system control, user management, activity monitoring
- **Manager**: Sales analytics, inventory management, reporting
- **Cashier**: Sales processing, product search, transaction management

### 📊 Dashboard Features
- **Professional Design**: Modern UI with Tailwind CSS
- **Real-time Analytics**: Sales trends, inventory status, performance metrics
- **Interactive Charts**: Line charts, bar charts, pie charts using Recharts
- **Responsive Layout**: Works on desktop, tablet, and mobile devices

### 🛒 Cashier Dashboard
- **Product Search**: Real-time search by name, SKU, or barcode
- **Shopping Cart**: Add/remove items, quantity management
- **Transaction Processing**: Complete sales with automatic stock updates
- **Today's Performance**: Revenue, transactions, and recent sales

### 📈 Manager Dashboard
- **Sales Analytics**: Daily/weekly/monthly trends
- **Inventory Monitoring**: Stock levels, low stock alerts, out-of-stock items
- **Product Performance**: Top sellers, category analysis
- **Visual Charts**: Sales trends, category distribution, hourly patterns

### 👥 Admin Dashboard
- **User Management**: Create, edit, delete users with role-based permissions
- **Activity Monitoring**: Track all system activities and user actions
- **System Overview**: Complete system statistics and health monitoring
- **Advanced Analytics**: Comprehensive reporting and insights

## Technology Stack

### Backend
- **Node.js** with Express.js
- **SQLite** database with comprehensive schema
- **JWT** authentication with role-based access control
- **bcryptjs** for password hashing
- **Helmet** and **CORS** for security

### Frontend
- **React 18** with functional components and hooks
- **React Router** for navigation
- **Tailwind CSS** for modern styling
- **Recharts** for data visualization
- **Axios** for API communication
- **React Hot Toast** for notifications
- **Lucide React** for icons

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd inventory
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all dependencies (root, server, and client)
npm run install-all
```

### 3. Environment Setup
Create a `.env` file in the server directory:
```bash
cd server
cp config.env .env
```

Edit the `.env` file with your configuration:
```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CLIENT_URL=http://localhost:3000
```

### 4. Database Setup
The SQLite database will be automatically created and initialized when you start the server for the first time. The schema includes:
- Users table with role-based permissions
- Products table with inventory tracking
- Sales and sale_items tables for transaction management
- Stock_movements table for inventory changes
- Activity_logs table for system monitoring

### 5. Start the Application
```bash
# Start both frontend and backend in development mode
npm run dev

# Or start them separately:
# Backend only
npm run server

# Frontend only
npm run client
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## Default Login Credentials

The system comes with a default admin account:

- **Username**: admin
- **Password**: admin123
- **Role**: Administrator

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Create new user (admin only)
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

### Users (Admin/Manager)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)
- `GET /api/users/:id/activity` - Get user activity logs

### Products (Manager/Cashier)
- `GET /api/products` - Get products with search/filter
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/lookup/:identifier` - Get product by SKU/barcode
- `POST /api/products` - Create product (manager/admin)
- `PUT /api/products/:id` - Update product (manager/admin)
- `DELETE /api/products/:id` - Delete product (manager/admin)
- `GET /api/products/alerts/low-stock` - Get stock alerts
- `GET /api/products/categories/list` - Get categories

### Sales (Cashier/Manager)
- `POST /api/sales` - Create new sale
- `GET /api/sales` - Get sales with filtering
- `GET /api/sales/:id` - Get sale details
- `GET /api/sales/dashboard/today` - Today's sales summary
- `GET /api/sales/dashboard/recent` - Recent transactions

### Analytics (Manager/Admin)
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/sales-trends` - Sales trends over time
- `GET /api/analytics/top-products` - Top performing products
- `GET /api/analytics/sales-by-category` - Sales by category
- `GET /api/analytics/cashier-performance` - Cashier performance
- `GET /api/analytics/hourly-pattern` - Hourly sales pattern
- `GET /api/analytics/inventory-valuation` - Inventory valuation

## Project Structure

```
inventory/
├── server/                 # Backend API
│   ├── database/          # Database configuration and schema
│   ├── middleware/        # Authentication middleware
│   ├── routes/           # API routes
│   └── index.js          # Server entry point
├── client/               # Frontend React app
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── contexts/     # React contexts (Auth)
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── App.js        # Main app component
│   └── public/           # Static assets
├── package.json          # Root package.json
└── README.md            # This file
```

## Key Features Implemented

### ✅ Complete Authentication System
- JWT-based authentication
- Role-based access control (Admin, Manager, Cashier)
- Protected routes and middleware
- User session management

### ✅ Professional Dashboard Design
- Modern sidebar navigation
- Colorful stat cards with metrics
- Interactive charts and graphs
- Responsive design for all devices

### ✅ Cashier Interface
- Real-time product search
- Shopping cart functionality
- Transaction processing
- Stock level validation

### ✅ Manager Dashboard
- Sales analytics and trends
- Inventory monitoring
- Product performance tracking
- Visual data representation

### ✅ Admin Controls
- User management system
- Activity monitoring
- System statistics
- Complete administrative access

### ✅ Database Schema
- Comprehensive table structure
- Proper relationships and constraints
- Activity logging
- Stock movement tracking

## Development

### Adding New Features
1. Create API endpoints in `server/routes/`
2. Add frontend components in `client/src/pages/`
3. Update navigation in `client/src/components/layout/Sidebar.js`
4. Add routes in `client/src/App.js`

### Database Migrations
The current setup uses SQLite for simplicity. For production, consider:
- PostgreSQL or MySQL for better performance
- Database migration system
- Connection pooling
- Backup strategies

### Security Considerations
- Change default JWT secret in production
- Implement rate limiting
- Add input validation
- Use HTTPS in production
- Regular security updates

## Production Deployment

### Backend Deployment
1. Set `NODE_ENV=production`
2. Use a production database (PostgreSQL/MySQL)
3. Configure proper JWT secrets
4. Set up SSL certificates
5. Use PM2 or similar for process management

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy to CDN or static hosting
3. Configure API endpoints for production
4. Set up proper caching headers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please create an issue in the repository or contact the development team.

---

**Built with ❤️ using React, Node.js, and modern web technologies.**
