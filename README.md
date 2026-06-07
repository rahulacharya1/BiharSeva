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
| **Auth** | Custom JWT (access + refresh tokens), Google OAuth |
| **PDF** | ReportLab |
| **Fonts** | Space Grotesk, Manrope (Google Fonts) |
| **Animations** | Framer Motion |
| **Icons** | Font Awesome 6 |

---

## 📁 Project Structure

```
BiharSeva/
├── biharseva/                  # Django backend
│   ├── biharseva/              # Django project settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── core/                   # Main Django app
│   │   ├── models.py           # Database models (12 models)
│   │   ├── serializers.py      # DRF serializers
│   │   ├── api_urls.py         # API route definitions
│   │   ├── auth_utils.py       # JWT token utilities
│   │   ├── sanitize.py         # Input sanitization
│   │   ├── admin.py            # Django admin configuration
│   │   ├── tests.py            # Test suite (600+ lines)
│   │   └── views/              # Modular API views
│   │       ├── public.py       # Unauthenticated endpoints
│   │       ├── volunteer.py    # Volunteer auth & profile
│   │       ├── events.py       # Event listing & registration
│   │       ├── admin_auth.py   # Admin login & OTP flows
│   │       ├── admin_ops.py    # Admin CRUD operations
│   │       ├── admin_college.py# College infrastructure
│   │       ├── admin_export.py # CSV data exports
│   │       ├── certificates.py # PDF certificate generation
│   │       ├── notifications.py# In-app notification system
│   │       └── helpers.py      # Shared utilities & email
│   ├── .env.example            # Environment variable template
│   └── requirements.txt        # Python dependencies
│
├── frontend/                   # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx             # Route configuration
│   │   ├── api.js              # Axios instances & interceptors
│   │   ├── context/            # React Context providers
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Page components
│   │   │   ├── public/         # Public pages (Home, About, Contact)
│   │   │   ├── volunteer/      # Volunteer pages (Register, Login, Dashboard)
│   │   │   ├── admin/          # Platform admin pages
│   │   │   ├── college/        # College admin pages
│   │   │   ├── events/         # Event pages
│   │   │   ├── reports/        # Report pages
│   │   │   └── certificates/   # Certificate pages
│   │   ├── hooks/              # Custom React hooks
│   │   └── utils/              # Utility functions
│   ├── public/                 # Static assets
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
cd biharseva

# Create and activate virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

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

Copy `biharseva/.env.example` to `biharseva/.env` and configure:

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

| Model | Purpose |
|---|---|
| `College` | Educational institutions |
| `NSSUnit` | NSS units within colleges |
| `ProgramOfficer` | NSS program officers |
| `AdminProfile` | Maps Django users to admin roles |
| `Volunteer` | Registered volunteers |
| `Report` | Citizen civic issue reports |
| `Event` | NSS events and activities |
| `EventRegistration` | Volunteer event sign-ups |
| `Certificate` | Issued certificates |
| `VolunteerHours` | Service hour records |
| `Badge` | Achievement badges (Bronze–Platinum) |
| `Notification` | In-app volunteer notifications |
| `AuditLog` | Admin action audit trail |
| `ActivityProposal` | Event proposal workflow |

---

## 🔐 Authentication

The platform uses **dual JWT authentication**:

- **Volunteers**: Custom Volunteer model with email/password + Google OAuth
- **Admins**: Django User model with username/password

Both use access + refresh token pairs with automatic refresh via Axios interceptors.

### Admin Roles

| Role | Scope |
|---|---|
| `platform_admin` | Full platform access (all colleges) |
| `college_admin` | Scoped to their assigned college |

---

## 🧪 Running Tests

```bash
cd biharseva
python manage.py test core --verbosity=2
```

---

## 📦 Production Build

```bash
# Frontend production build
cd frontend
npm run build

# Backend static files
cd ../biharseva
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
