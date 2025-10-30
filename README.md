# PropertyPro - Professional Apartment Management System

## Overview

PropertyPro is a comprehensive B2B SaaS apartment and property management system designed for professional property managers and administrators. Built with modern web technologies and a focus on efficiency, it provides all the tools needed to manage properties, tenants, maintenance, finances, and communications in one integrated platform.

## Key Features

### 🏢 **Property Management**
- Manage multiple properties with unit tracking
- Automatic unit generation based on property size
- Track amenities, locations, and property details
- Visual property cards with quick statistics

### 👥 **Tenant & Owner Management (Masterlist)**
- Comprehensive owner and tenant database
- Track lease agreements and ownership status
- Manage unit assignments and parking slots
- Handle deemed owners and sublease arrangements

### 🔧 **Maintenance System**
- Category-based maintenance request tracking (Civil, Plumbing, Electrical, HVAC, etc.)
- Priority and status management
- Utility reading tracking (water and electricity)
- Preventive maintenance scheduling

### 💰 **Financial Management**
- Revenue tracking and visualization
- Delinquent account monitoring
- Account payables management
- Payment processing and tracking
- Automated billing reports

### 📬 **Communications Hub**
- Threaded conversation system
- Support ticket management
- Advisory and announcement broadcasting
- Owner-Admin-Tenant communication channels

### 📊 **Reporting Engine**
- Engineering reports
- Billing reports
- Statement of Account (SOA) generation
- Occupancy analysis
- Financial summaries
- Export capabilities

## Authentication & Role System

### Three-Tier Role Hierarchy

1. **IT Role (Highest Access)**
   - Manages Admin accounts across different properties
   - Full system access and configuration
   - Can create and manage Admin accounts
   - Cannot be created via the application

2. **Admin Role (Property Manager)**
   - Full access to assigned property
   - Manages Tenant accounts
   - Access to all property management features
   - Can create and manage Tenant accounts

3. **Tenant Role (Limited Access)**
   - Limited dashboard view
   - Can view own information
   - Submit maintenance requests
   - View communications and announcements

### Default IT Account

```
Username: APTITMANAGER
Password: M3OM3OT
```

**Note:** There is no public registration. Only IT users can create Admin accounts, and only Admin users can create Tenant accounts.

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for development and build
- **Wouter** for routing
- **TanStack Query** for data fetching and caching
- **Radix UI** with shadcn/ui for components
- **Tailwind CSS** for styling
- **Recharts** for data visualization

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **PostgreSQL** (Neon) for database
- **Drizzle ORM** for database operations
- **bcrypt** for password hashing
- **Express Session** for authentication

### Design System
- **Theme:** Xero-inspired B2B SaaS interface
- **Typography:** Inter for UI, JetBrains Mono for financial data
- **Colors:** Deep blue primary (#214DFF)
- **Dark/Light mode** support
- **Responsive design** for all screen sizes

## Installation & Setup

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (or Neon account)
- Environment variables configured

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_session_secret_key
PORT=5000
NODE_ENV=development
```

### Installation Steps

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/propertypro.git
cd propertypro
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up the database**
```bash
npm run db:push
```

4. **Seed the IT account**
```bash
cd server && npx tsx seed.ts
```

5. **Start the development server**
```bash
npm run dev
```

6. **Access the application**
```
Open browser to http://localhost:5000
Login with IT credentials: APTITMANAGER / M3OM3OT
```

## Project Structure

```
propertypro/
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── lib/         # Utilities and configurations
│   │   └── hooks/       # Custom React hooks
│   └── public/          # Static assets
├── server/              # Backend Express application
│   ├── index.ts        # Server entry point
│   ├── routes.ts       # API routes
│   ├── db-storage.ts   # Database operations
│   ├── seed.ts         # Database seeding
│   └── types/          # TypeScript type definitions
├── shared/              # Shared types and schemas
│   └── schema.ts       # Database schema definitions
└── migrations/          # Database migrations
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### User Management
- `POST /api/users` - Create new user (IT/Admin only)
- `GET /api/users` - Get users list (IT/Admin only)
- `PATCH /api/users/:id` - Update user (IT/Admin only)
- `DELETE /api/users/:id` - Deactivate user (IT/Admin only)

### Properties
- `GET /api/properties` - Get all properties
- `POST /api/properties` - Create property
- `GET /api/properties/:id` - Get single property
- `PATCH /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Owners/Tenants
- `GET /api/owners` - Get all owners/tenants
- `POST /api/owners` - Create owner/tenant
- `GET /api/tenants` - Get tenants list
- `POST /api/tenants` - Create tenant

### Maintenance
- `GET /api/maintenance-requests` - Get maintenance requests
- `POST /api/maintenance-requests` - Create request
- `PATCH /api/maintenance-requests/:id` - Update request

### Communications
- `GET /api/communications` - Get communications
- `POST /api/communications` - Create communication

### Financial
- `GET /api/transactions` - Get transactions
- `POST /api/transactions` - Create transaction
- `GET /api/account-payables` - Get payables

## Database Schema

The system uses 13 main tables:
- `users` - Authentication and user management
- `properties` - Property information
- `units` - Individual units within properties
- `owners` - Owner records
- `tenants` - Tenant records
- `owner_units` - Many-to-many relationship
- `parking_slots` - Parking assignments
- `maintenance_requests` - Maintenance tracking
- `utility_readings` - Utility consumption
- `transactions` - Financial transactions
- `communications` - Message threads
- `announcements` - System announcements
- `account_payables` - Vendor payments

## Security Features

### Implemented
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Session-based authentication
- ✅ Role-based access control (RBAC)
- ✅ HTTP-only secure cookies
- ✅ CSRF protection via SameSite cookies
- ✅ Input validation with Zod schemas
- ✅ SQL injection prevention (parameterized queries)

### Recommendations for Production
- [ ] Add rate limiting for API endpoints
- [ ] Implement audit logging for sensitive operations
- [ ] Add two-factor authentication (2FA)
- [ ] Set up SSL/TLS certificates
- [ ] Implement password complexity requirements
- [ ] Add session timeout policies
- [ ] Enable CORS with specific origins
- [ ] Implement backup and recovery procedures

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run database migrations
npm run db:push

# Generate database migrations
npm run db:generate

# Seed database
cd server && npx tsx seed.ts

# Type checking
npm run type-check
```

## Deployment

### Replit Deployment
The application is configured for easy deployment on Replit:

1. The application runs on port 5000 (configured via PORT env variable)
2. Database connection uses DATABASE_URL
3. Session management configured for production
4. Auto-restart on file changes in development

### Production Deployment Checklist
- [ ] Set NODE_ENV=production
- [ ] Configure production database
- [ ] Set strong SESSION_SECRET
- [ ] Enable HTTPS
- [ ] Configure proper CORS headers
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline

## Future Enhancements

### Planned Features
- Mobile responsive improvements
- Email notification system
- Document management system
- Automated late fee calculations
- Integration with payment gateways
- Advanced analytics dashboard
- Tenant portal mobile app
- Automated lease renewal reminders
- Vendor management system
- Budget planning tools

### Technical Improvements
- GraphQL API implementation
- Real-time updates with WebSockets
- Microservices architecture
- Redis caching layer
- Elasticsearch for advanced search
- Docker containerization
- Kubernetes orchestration
- Performance monitoring

## Support & Contributing

### Bug Reports
Please report bugs through the issue tracker with:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser and OS information

### Feature Requests
We welcome feature requests! Please provide:
- Use case description
- Business value explanation
- Proposed implementation (if any)

### Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

© 2024 PropertyPro. All rights reserved.

---

**Built with dedication for property management professionals.**

For more information or support, contact the development team.