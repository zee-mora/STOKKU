# STOKKU - Full Stack Application

Modern full-stack web application built with **Laravel** backend and **React** frontend with **Vite**.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) - comes with Node.js
- **PHP** (v8.2 or higher) - [Download](https://www.php.net/downloads)
- **Composer** - [Download](https://getcomposer.io/)
- **Git** - [Download](https://git-scm.com/)

## 🚀 Quick Start

### User to login

- SuperAdmin For RBAC Setting
email: superadmin@example.com
password: password

- Admin For Manage Barang and Approval
email: admin@example.com
password: password

- Staff for Request barang
email: staff@example.com
password: password

*note its available after php artisan migrate or npm run setup in root project

### 1. Clone the Repository

```bash
git clone https://github.com/zee-mora/STOKKU
cd STOKKU
```

### 2. Setup Everything in One Command

```bash
npm run setup
```

This single command will automatically:
- Install root dependencies
- Setup backend (copy `.env`, install Composer packages, generate keys)
- Setup frontend (copy `.env`, install npm packages)

> **Note:** The `setup:backend` script creates `.env` file from `.env.example` and generates JWT secret. Make sure to review and update database credentials in `backend/.env` if needed.

### 3. Start Development Servers

```bash
npm run all
```

This will start both servers concurrently:
- **Backend** (Laravel): `http://localhost:8000`
- **Frontend** (Vite Dev Server): `http://localhost:5173`

---

## 📁 Project Structure

```
STOKKU/
├── backend/          # Laravel API server
│   ├── app/         # Application code
│   ├── config/      # Configuration files
│   ├── database/    # Migrations & seeders
│   ├── routes/      # API routes
│   └── .env         # Environment variables
├── frontend/        # React VIte SPA
│   ├── src/        # Source code
│   ├── public/     # Static assets
│   └── .env        # Environment variables
└── package.json    # Root npm scripts
```

---

## 📦 Available Commands

### Setup Commands

```bash
# Complete setup (recommended for first-time setup)
npm run setup

# Setup only backend
npm run setup:backend

# Setup only frontend
npm run setup:frontend
```

### Development Commands

```bash
# Start both backend and frontend servers
npm run all

# Or start them separately:
cd backend && php artisan serve
cd frontend && npm run dev
```

### Build Commands

```bash
# Build frontend for production
cd frontend && npm run build

# Build backend (no build needed, Laravel is ready for deployment)
```

---

## 🛠️ Backend Configuration

The backend is built with **Laravel 11** and includes:

- REST API with JWT authentication
- Database migrations and seeders
- Eloquent ORM
- Service providers and middleware

### Backend Setup Details

When you run `npm run setup:backend`, it:
1. Copies `.env.example` to `.env`
2. Installs Composer dependencies
3. Generates Laravel application key
4. Generates JWT secret

### Database Configuration

Update your database credentials in `backend/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=STOKKU
DB_USERNAME=root
DB_PASSWORD=
```

Then run migrations:

```bash
cd backend
php artisan migrate
```

---

## 🎨 Frontend Configuration

The frontend is built with:

- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls

### Frontend Build

```bash
cd frontend
npm run build
```

Output will be in `frontend/dist/`

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

Key variables to configure:
- `APP_URL` - Backend application URL
- `DB_*` - Database connection details
- `JWT_SECRET` - Auto-generated during setup

### Frontend (`frontend/.env`)

Example:
```env
VITE_API_URL=http://localhost:8000/api
```

---

## 📚 API Documentation

API routes are defined in `backend/routes/api.php`. The backend runs on:

```
http://localhost:8000/api
```

---

## 🐛 Troubleshooting

### Issue: `composer: command not found`

**Solution:** Install Composer globally or use `php composer.phar`

### Issue: `php: command not found`

**Solution:** Install PHP and add it to your system PATH

### Issue: Port 8000 or 5173 already in use

**Solution:** Specify different ports:

```bash
# Backend on different port
cd backend && php artisan serve --port=8001

# Frontend on different port
cd frontend && npm run dev -- --port=5174
```

### Issue: Database connection error

**Solution:** Verify database credentials in `backend/.env` and ensure database server is running

---

## 📝 Additional Resources

- [Laravel Documentation](https://laravel.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)