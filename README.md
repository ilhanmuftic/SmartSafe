# Smart&Safe - Vehicle Access Control System

A comprehensive digital vehicle management system with ESP-based physical lockbox access control. Features role-based authentication, real-time security monitoring, and automated PIN code generation for secure vehicle access.

## 🚗 System Overview

Smart&Safe is designed for companies that need secure vehicle access control with physical lockboxes. The system manages vehicle requests from employees, admin approvals, and tracks physical access events through ESP-connected lockboxes with one-time PIN codes.

### Key Features

- **Physical Access Control**: ESP device integration with lockbox PIN verification
- **One-Time PIN Codes**: 4-digit codes valid only once per approval
- **Real-time Security Logs**: Track every safe opening with timestamps and employee identification
- **Role-Based Access**: Admin and Employee dashboards with appropriate permissions
- **Mobile Responsive**: Fully functional on all device sizes
- **Comprehensive Reporting**: Security analytics with CSV export capabilities

## 🏗️ Architecture

```
Frontend (React + TypeScript)
├── Admin Dashboard (Vehicle CRUD, Request Approvals)
├── Employee Dashboard (Vehicle Requests, My Bookings)
├── Security Reports (Access Logs, Usage Analytics)
└── Real-time Notifications

Backend (Express + Node.js)
├── Authentication & Authorization
├── Vehicle Management API
├── Request Processing
├── Access Log Recording
└── ESP Device Integration

Physical Layer
├── ESP Device Controller
├── Digital Lockbox/Safe
├── PIN Verification System
└── Access Event Logging
```

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **TanStack Query** for data fetching
- **Recharts** for analytics visualization
- **Wouter** for routing

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Drizzle ORM** with PostgreSQL schema
- **Zod** for data validation
- **Express Session** for authentication

### Database
- **PostgreSQL** (Supabase compatible)
- **In-memory storage** for development/demo

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Supabase)

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd smart-safe
   npm install
   ```

2. **Database Setup**
   ```bash
   # Set your database URL
   echo "DATABASE_URL=your_database_url" > .env
   
   # Push schema to database
   npm run db:push
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - Open http://localhost:5000
   - Admin: `admin@company.com` / `password`
   - Employee: `employee@company.com` / `password`

## 📱 User Roles & Features

### 👨‍💼 Admin Dashboard
- **Vehicle Management**: Add, edit, delete company vehicles
- **Request Processing**: Approve/reject employee vehicle requests
- **Security Monitoring**: View access logs and usage analytics
- **Report Generation**: Export security data and usage statistics
- **System Overview**: Dashboard with key metrics and pending requests

### 👤 Employee Dashboard  
- **Vehicle Browsing**: View available vehicles with photos and specifications
- **Request Submission**: Submit vehicle requests with date/time requirements
- **My Bookings**: View active bookings with 4-digit access codes
- **Request History**: Track past requests with status and access codes
- **Notifications**: Real-time updates on request approvals/rejections

## 🔐 ESP Device Integration

### Physical Access Flow
1. **Request Approval**: Admin approves employee vehicle request
2. **PIN Generation**: System generates unique 4-digit access code
3. **Employee Access**: Employee uses PIN code at vehicle lockbox
4. **ESP Verification**: ESP device validates code and unlocks safe
5. **Security Logging**: Access event recorded with timestamp and employee ID
6. **Code Expiration**: PIN becomes invalid after single use
# ESP32 Keypad-Controlled Lock with OLED Display and Web PIN Management

This project implements a secure keypad-based lock system using an ESP32, OLED display, servo motor, and a web interface to remotely manage the PIN code.

## Features

- 4x4 Matrix Keypad for PIN entry
- OLED Display (SSD1306) shows prompts and status messages
- Servo Motor controls a lock mechanism (locked/unlocked positions)
- EEPROM Emulation on ESP32 flash to securely store a 4-digit PIN
- WiFi-enabled Web Server allows remote PIN change via a simple web form
- PIN Validation on keypad entry with feedback on OLED and serial monitor
- Default PIN is set to `1234` if none is stored

## Hardware Requirements

- ESP32 development board
- 4x4 Matrix Keypad
- OLED Display (SSD1306, I2C)
- Servo motor (e.g., SG90) connected to GPIO 15
- Power supply and wiring as needed

## Wiring Summary

| Component       | ESP32 Pin         |
| --------------- | ----------------- |
| Keypad Rows     | 32, 33, 25, 26    |
| Keypad Columns  | 27, 14, 12, 13    |
| OLED SDA        | GPIO 21 (I2C SDA) |
| OLED SCL        | GPIO 22 (I2C SCL) |
| Servo Signal    | GPIO 15           |
| 5V and GND      | As required       |

*Adjust pins as needed to fit your hardware.*

## Software Setup

1. Install the following Arduino libraries:
   - Keypad
   - Adafruit SSD1306
   - Adafruit GFX
   - ESP32Servo
   - WiFi
   - WebServer
   - EEPROM (built-in for ESP32)

2. Replace the WiFi credentials (`ssid` and `password`) in the code with your own.

3. Upload the code to your ESP32 board.

## Usage

- On startup, the OLED displays: **Enter PIN:**
- Use the keypad to enter the 4-digit PIN.
- If correct, the servo unlocks for 3 seconds and then locks again.
- If incorrect, **Wrong PIN** is displayed for 3 seconds.
- Press `*` to clear the current input.
- Press `D` to manually reset/lock the servo.
- Connect to the ESP32’s IP address shown in Serial Monitor.
- Access `http://<ESP32_IP>/` in a browser to view or change the PIN remotely.

## 📊 Security Reports

### Access Analytics
- **Total Safe Opens**: Count of physical access events
- **Monthly Trends**: Usage patterns over time
- **Employee Usage**: Top users and access frequency
- **Time Patterns**: 24-hour access distribution for security monitoring
- **Vehicle Usage**: Which vehicles are accessed most frequently

### Security Log Format
```
SAFE OPENED
PIN: 7834 • Employee ID: 2 • Vehicle ID: 1
Date: 06/08/2025 8:12 PM
```

### CSV Export Fields
- Access Time
- Access Code (PIN)
- Employee ID  
- Vehicle ID
- Action (SAFE_OPENED)
- Success Status
- Location

## 🛡️ Security Features

### Authentication
- Session-based authentication
- Role-based access control (Admin/Employee)
- Protected API endpoints
- Secure password handling

### Physical Security
- One-time PIN codes only
- ESP device verification required
- Complete access audit trail
- Real-time monitoring and alerts
- Tamper-resistant logging

### Data Protection
- Input validation with Zod schemas
- SQL injection prevention
- XSS protection
- CSRF tokens for forms

## 🔧 API Documentation

### Core Endpoints

**Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

**Vehicles**
- `GET /api/vehicles` - List all vehicles
- `POST /api/vehicles` - Create vehicle (admin)
- `PATCH /api/vehicles/:id` - Update vehicle (admin)
- `DELETE /api/vehicles/:id` - Delete vehicle (admin)

**Requests**
- `GET /api/requests` - List requests (filtered by role)
- `POST /api/requests` - Create vehicle request
- `PATCH /api/requests/:id/status` - Approve/reject request (admin)

**Security**
- `GET /api/access-logs` - Get access logs (admin)
- `POST /api/access-logs` - Record access event (ESP device)

**Analytics**
- `GET /api/stats/vehicles` - Vehicle statistics
- `GET /api/requests/pending` - Pending request count

## 📋 Database Schema

### Key Tables
- **users**: Employee and admin accounts
- **vehicles**: Company vehicle inventory
- **vehicle_requests**: Employee access requests
- **vehicle_access**: ESP device access logs
- **notifications**: System notifications

### Important Fields
```sql
vehicle_access (
  id SERIAL PRIMARY KEY,
  request_id INTEGER REFERENCES vehicle_requests(id),
  employee_id INTEGER REFERENCES users(id),
  vehicle_id INTEGER REFERENCES vehicles(id),
  access_time TIMESTAMP DEFAULT NOW(),
  access_code TEXT NOT NULL,
  action TEXT DEFAULT 'SAFE_OPENED',
  successful BOOLEAN DEFAULT true,
  location TEXT
)
```

## 🔄 Development Workflow

### Database Migrations
```bash
# Push schema changes
npm run db:push

# Generate migrations (if using migration files)
npm run db:generate
```

### Code Structure
```
client/src/
├── components/         # Reusable UI components
├── pages/             # Main application pages
├── hooks/             # Custom React hooks
└── lib/               # Utilities and configurations

server/
├── index.ts           # Express server setup
├── routes.ts          # API route definitions
├── storage.ts         # Data access layer
└── vite.ts            # Development server integration

shared/
└── schema.ts          # Database schema and types
```

## 🚢 Deployment

### Environment Variables
```env
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=production
SESSION_SECRET=your-session-secret
```

### Production Build
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Replit Deployment
The application is configured for one-click deployment on Replit:
1. Connect to your database
2. Set environment variables
3. Deploy using the "Deploy" button

## 🔌 ESP Device Integration Guide

### Hardware Requirements
- ESP32 or ESP8266 microcontroller
- Digital lock mechanism (servo/solenoid)
- WiFi connectivity
- Optional: OLED display for status

### ESP Code Structure
```cpp
#include <WiFi.h>
#include <HTTPClient.h>

// Validate PIN with server
bool validatePIN(String pin) {
  // POST request to /api/access-logs
  // Return true if valid, false if invalid/used
}

// Unlock mechanism
void unlockSafe() {
  // Control servo/solenoid
  // Log access event
}
```

### Integration Steps
1. Connect ESP to company WiFi
2. Configure API endpoint URLs
3. Implement PIN validation logic
4. Add physical lock control
5. Test with approved request codes

## 📞 Support & Maintenance

### Monitoring
- Access logs for security auditing
- Error tracking and notifications
- Performance metrics and alerts
- Database backup verification

### Common Issues
- **PIN Not Working**: Check if code was already used (one-time only)
- **Access Denied**: Verify employee has approved request
- **ESP Offline**: Check WiFi connection and power supply
- **Database Errors**: Verify connection string and credentials

## 📄 License

This project is proprietary software for company vehicle access control systems.

## 🤝 Contributing

1. Follow TypeScript strict mode
2. Use Prettier for code formatting
3. Add proper error handling
4. Include security considerations
5. Test ESP device integration thoroughly

---

**Smart&Safe** - Secure Vehicle Access Management System
*Powered by ESP Device Technology*
