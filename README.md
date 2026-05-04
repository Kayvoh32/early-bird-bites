# Early Bird Bites 🐦

A modern restaurant management system built with Node.js, Express, and SQLite. Designed for efficient order placement, menu management, and sales reporting.

## Features

- **Cashier Interface**: Fast order placement with real-time menu access
- **Customer Menu**: Browse available items by category with pricing
- **Manager Dashboard**: Monitor orders, manage menu items, and view sales reports
- **Employee Management**: Add and manage cashiers and managers with secure authentication
- **Order Tracking**: View order history with timestamps and totals
- **Sales Analytics**: Daily sales summaries and item breakdown reports
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: SQLite3 (better-sqlite3)
- **Authentication**: bcryptjs for password hashing
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Session Management**: express-session

## Quick Start

### Prerequisites
- Node.js 14+ installed
- npm package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/kevin-mwaura/early-bird-bites.git
cd early-bird-bites
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The app will run at `http://localhost:3000`

### Development Mode (with auto-reload)
```bash
npm run dev
```

## Default Login Credentials

### Manager Account
- **Username**: `admin`
- **Password**: `admin123`

### Cashier Account
- **Username**: `cashier1`
- **Password**: `cashier123`

## Project Structure

```
early-bird-bites/
├── server.js              # Express backend & API routes
├── database.js            # SQLite schema & seed data
├── index.html             # Landing page with role selection
├── login.html             # Authentication page
├── cashier.html           # Cashier order placement interface
├── customer-menu.html     # Menu browsing page
├── manager.html           # Manager order/sales dashboard
├── menu-management.html   # Add/delete menu items
├── scripts.js             # Frontend JavaScript utilities
├── styles.css             # Global styles
├── package.json           # Dependencies
├── images/                # Food item images
└── earlybird.db          # SQLite database (auto-created)
```

## API Endpoints

### Authentication
- `POST /LoginServlet` - Login with username/password
- `POST /logout` - Logout current session
- `GET /session` - Check active session

### Menu Management
- `GET /menuItems` - Get all available menu items
- `GET /menu` - Alias for menu items
- `GET /categories` - Get all food categories
- `POST /add-menu` - Add new menu item (manager only)
- `DELETE /menuItems/:id` - Delete menu item (manager only)

### Orders
- `POST /PlaceOrderServlet` - Submit new order
- `GET /orders` - Get all orders (manager only)

### Employees
- `GET /employees` - List all employees (manager only)
- `POST /employees` - Add new employee (manager only)

### Reports
- `GET /sales-report` - Daily sales and item breakdown (manager only)

## Usage

### For Customers/Cashiers
1. Browse the **Customer Menu** to view all available items
2. Log in as a **Cashier** to place orders
3. Select items, quantities, and proceed to checkout

### For Managers
1. Log in with manager credentials
2. **Order Dashboard**: Monitor incoming orders and status
3. **Menu Management**: Add/remove items from the system
4. **Employee Management**: Add new cashiers or managers
5. **Sales Reports**: View daily sales totals and item performance metrics

## Database Schema

### Tables
- **employees** - Cashiers and managers with hashed passwords
- **categories** - Food item categories
- **menu_items** - Individual food items with pricing
- **orders** - Customer orders with timestamps
- **order_items** - Line items for each order

## Security Features

- Password hashing with bcryptjs (10 salt rounds)
- Session-based authentication (8-hour timeout)
- Role-based access control (cashier/manager)
- SQL injection protection via parameterized queries
- Foreign key constraints for data integrity

## Customization

### Change Secret Key
Edit `server.js` line 22:
```javascript
secret: 'your-new-secret-key-here'
```

### Add Menu Items
Use the Manager Dashboard → Menu Management panel or seed data in `database.js`

### Modify Pricing
Update in database directly or through the menu management interface

## Known Limitations

- Single-device session per user
- No payment processing integration
- No email notifications
- Database reset required for fresh install

## Future Enhancements

- Multi-table order management
- Kitchen display system (KDS)
- Email receipt delivery
- Inventory tracking
- SMS notifications
- Payment gateway integration
- User activity audit logs

## Support & Contribution

For issues or feature requests, please contact the development team or open an issue on GitHub.

## License

UNLICENSED - All rights reserved.

---

**Early Bird Bites** - Making restaurant management efficient since 2026 🍽️
