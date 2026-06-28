<div align="center">

# 🌿 BiharSeva

**Bihar's Civic Engagement & NSS Volunteer Management Platform**

*Citizen reporting aur volunteer coordination ka ek digital ecosystem*

[![Django](https://img.shields.io/badge/Django-6.0-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 📋 Overview

BiharSeva is a **full-stack civic engagement platform** built for Bihar's NSS (National Service Scheme) ecosystem. It bridges citizens, NSS volunteers, and college institutions by providing:

- 📸 **Citizen Issue Reporting** — Report civic issues with photo evidence
- 👥 **Volunteer Management** — Registration, verification, and tracking pipeline
- 📅 **Event Management** — Create events with attendance tracking and service hour logging
- 🏅 **Gamification** — Automatic badge awards (Bronze → Platinum) based on service hours
- 📜 **Certificate Generation** — PDF certificates with email delivery
- 🏫 **Multi-College Hierarchy** — Scoped admin system with college isolation
- 📊 **Analytics Dashboard** — Impact metrics, district breakdowns, and leaderboards
- 🔔 **In-App Notifications** — Real-time notifications for volunteers

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Django 6.0, Django REST Framework |
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Auth** | Custom JWT (access + refresh tokens), Google OAuth, TOTP MFA |
| **PDF** | ReportLab |
| **Fonts** | Space Grotesk, Manrope (Google Fonts) |
| **Animations** | Framer Motion |
| **Icons** | Font Awesome 6 |
| **API Docs** | drf-spectacular (OpenAPI 3 / Swagger) |

---

## 📁 Project Structure

```
BiharSeva/
├── backend/                        # Django backend
│   ├── config/                     # Django project settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   │
│   ├── common/                     # Shared utilities & infrastructure
│   │   ├── api_urls.py             # Central API route definitions (all apps)
│   │   ├── auth_utils.py           # JWT token utilities
│   │   ├── constants.py            # Shared choice tuples (districts, activities)
│   │   ├── exception_handler.py    # Custom DRF exception handler
│   │   ├── renderers.py            # Standardized API response envelope
│   │   ├── sanitize.py             # Input sanitization
│   │   ├── totp.py                 # TOTP/MFA utilities
│   │   ├── models.py               # AuditLog model
│   │   └── views/
│   │       ├── public.py           # Home stats, about, contact, health check
│   │       └── helpers.py          # Admin auth, scoped queries, email senders
│   │
│   ├── authentication/             # Volunteer & admin auth
│   │   ├── models.py               # Volunteer, AdminProfile, BlacklistedToken
│   │   ├── serializers.py          # Auth serializers
│   │   ├── views.py                # Signup, login, OTP, MFA, profile, volunteer mgmt
│   │   └── filters.py              # Volunteer filters
│   │
│   ├── colleges/                   # Institutional registry
│   │   ├── models.py               # College, NSSUnit, ProgramOfficer
│   │   ├── serializers.py          # College serializers
│   │   └── views.py                # College/unit/officer CRUD + public listing
│   │
│   ├── events/                     # Events & certificates
│   │   ├── models.py               # Event, EventRegistration, Certificate, VolunteerHours, Badge
│   │   ├── serializers.py          # Event serializers
│   │   ├── views.py                # Events, attendance, certificates, PDF gen, dashboard, exports
│   │   └── filters.py              # Event filters
│   │
│   ├── reports/                    # Civic issue reporting
│   │   ├── models.py               # Report
│   │   ├── serializers.py          # Report serializers
│   │   ├── views.py                # Report CRUD, assignment, gallery, export
│   │   └── filters.py              # Report filters
│   │
│   ├── notifications/              # In-app notifications
│   │   ├── models.py               # Notification
│   │   └── views.py                # List, mark-read, mark-all-read
│   │
│   ├── .env                        # Environment variables
│   ├── requirements.txt            # Python dependencies
│   ├── manage.py
│   └── server/                     # Python virtual environment
│
├── frontend/                       # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx                 # Route configuration
│   │   ├── api.js                  # Axios instances & interceptors
│   │   ├── context/                # React Context providers
│   │   ├── components/             # Reusable components
│   │   ├── pages/                  # Page components
│   │   │   ├── public/             # Public pages (Home, About, Contact)
│   │   │   ├── volunteer/          # Volunteer pages (Register, Login, Dashboard)
│   │   │   ├── admin/              # Platform admin pages
│   │   │   ├── college/            # College admin pages
│   │   │   ├── events/             # Event pages
│   │   │   ├── reports/            # Report pages
│   │   │   └── certificates/       # Certificate pages
│   │   ├── hooks/                  # Custom React hooks
│   │   └── utils/                  # Utility functions
│   ├── public/                     # Static assets
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- **npm** 9+

### 1. Clone the Repository

```bash
git clone https://github.com/rahulacharya1/BiharSeva.git
cd BiharSeva
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv server
# Windows
server\Scripts\activate
# macOS/Linux
source server/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your actual values (SECRET_KEY, email, Google OAuth)

# Run migrations
python manage.py migrate

# Create a superuser (platform admin)
python manage.py createsuperuser

# Start the backend server
python manage.py runserver
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run at `http://localhost:5173` and the backend API at `http://localhost:8000/api/`.

---

## 🔑 Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

| Variable | Description | Required |
|---|---|---|
| `SECRET_KEY` | Django secret key (50+ random chars) | ✅ |
| `DEBUG` | Enable debug mode (`True`/`False`) | ✅ |
| `ALLOWED_HOSTS` | Comma-separated allowed hostnames | ✅ |
| `EMAIL_HOST_USER` | Gmail address for sending emails | ✅ |
| `EMAIL_HOST_PASSWORD` | Gmail app password | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | For Google login |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend origins | Production |

---

## 🏗️ Data Models

The backend is organized into **6 domain-specific Django apps**:

| App | Models | Purpose |
|---|---|---|
| **common** | `AuditLog` | Admin action audit trail |
| **authentication** | `Volunteer`, `AdminProfile`, `BlacklistedToken` | User accounts and auth tokens |
| **colleges** | `College`, `NSSUnit`, `ProgramOfficer` | Institutional hierarchy |
| **events** | `Event`, `EventRegistration`, `Certificate`, `VolunteerHours`, `Badge` | Event lifecycle & gamification |
| **reports** | `Report` | Citizen civic issue reports |
| **notifications** | `Notification` | In-app volunteer notifications |

---

## 🔐 Authentication

The platform uses **dual JWT authentication**:

- **Volunteers**: Custom Volunteer model with email/password + Google OAuth
- **Admins**: Django User model with username/password + optional TOTP MFA

Both use access + refresh token pairs with automatic refresh via Axios interceptors.

### Admin Roles

| Role | Scope |
|---|---|
| `platform_admin` | Full platform access (all colleges) |
| `college_admin` | Scoped to their assigned college |

---

## 📡 API Documentation

Once the server is running, interactive API docs are available at:

| Format | URL |
|---|---|
| **Swagger UI** | `http://localhost:8000/api/schema/swagger-ui/` |
| **ReDoc** | `http://localhost:8000/api/schema/redoc/` |
| **OpenAPI JSON** | `http://localhost:8000/api/schema/` |

---

## 🧪 Running Tests

```bash
cd backend
python manage.py test --verbosity=2
```

---

## 📦 Production Build

```bash
# Frontend production build
cd frontend
npm run build

# Backend static files
cd ../backend
python manage.py collectstatic --no-input
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ for Bihar**

*Swaach Bihar, Shrestha Bihar*

</div>
