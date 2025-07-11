# 📱 MobileApp

A cross-platform mobile application built with React Native (Expo) for the frontend and Django with SQLite3 or PostgreSQL for the backend. The app features robust media handling capabilities, allowing users to upload and manage images with support for various formats and compression. The user management system includes secure authentication, profile customization, and role-based access control. Media files are efficiently stored and retrieved through optimized backend APIs, while user data is securely managed with proper encryption and access controls.

## ✨ Key Features

### Frontend Features

- **Cross-Platform**: Built with React Native (Expo) for iOS and Android compatibility
- **Responsive UI**: Adaptive layouts for various screen sizes and orientations

- **Media Handling**: 
  - Image uploads with compression
  - Media preview and playback

- **User Management**:
  - Secure authentication with JWT tokens
  - Profile customization with photo upload
  - Role-based access control

- **Real-Time Updates**: Live updates for media and user data
- **Offline Support**: Caching for improved offline experience

### Backend Features

- **RESTful API**: Clean, well-documented endpoints for all operations
- **Media Management**:
  - Efficient storage and retrieval of media files
  - Support for multiple file formats

- **User Management**:
  - Secure password hashing and storage
  - Password recovery
  - Admin dashboard for user management

- **Database**:
  - SQLite3 for development
  - PostgreSQL support for production
  - Optimized queries for performance

- **Security**:
  - CSRF protection
  - Input validation
  - Secure file uploads

### API Features
- **Authentication**:
  - Login/Logout
  - Token-based authentication
  - Password change

- **User Management**:
  - Create/Read/Update/Delete users
  - Admin-only operations
  - Profile management

- **Media Management**:
  - Upload/Download media
  - Media metadata management
  - Search and filtering

- **Testing**:
  - Comprehensive test coverage
  - Automated API testing
  - Detailed error responses

### Development Features

- **Modular Architecture**: Clean separation of concerns
- **CI/CD Integration**: Automated testing and deployment

- **Documentation**: 
  - API documentation
  - Developer guides
  - Code comments

- **Scalability**: Designed for horizontal scaling

- **Monitoring**: 
  - Performance metrics
  - Error tracking
  - Usage analytics

## 🛠️ Technologies Used

### Frontend
- React Native
- Expo
- React Navigation
- Axios

### Backend
- Django
- Django REST Framework
- SQLite3 or PostgreSQL

## 📂 Project Structure

```
mobileapp/
├── react-native/
│   ├── .env                      # Environment variables for API URLs
│   ├── .gitignore                # Git ignore file for frontend
│   ├── App.js                    # Main application component
│   ├── app.json                  # Expo configuration
│   ├── babel.config.js           # Babel configuration with dotenv support
│   ├── index.js                  # Entry point
│   ├── package.json              # NPM dependencies and scripts
│   ├── assets/                   # Static assets (images, fonts, animations)
│   ├── navigation/               # Navigation configuration
│   │   └── MainTabs.js           # Tab navigation setup
│   ├── screens/                  # Application screens
│   │   ├── GalleryScreen.js      # Media batch upload and management
│   │   ├── LoginScreen.js        # Authentication screen
│   │   ├── ProfileScreen.js      # User profile management
│   │   ├── UserManagementScreen.js
│   └── utils/                    # Utility functions
│       ├── auth.js               # Authentication helpers
│       └── constants.js          # API URL configuration
│
├── django/
│   ├── .dockerignore             # Docker ignore file for excluding files/folders
│   ├── Dockerfile                # Docker container configuration
│   ├── docker-compose.yml        # Docker services orchestration config
│   ├── entrypoint.sh             # Docker container startup script
│   ├── .gitignore                # Git ignore file for backend
│   ├── manage.py                 # Django management script
│   ├── requirements.txt          # Python dependencies
│   ├── db.sqlite3                # SQLite database
│   ├── media/                    # Uploaded media files storage
│   ├── api/                      # Main API application
│   │   ├── __init__.py
│   │   ├── admin.py              # Django admin configuration
│   │   ├── apps.py               # App configuration
│   │   ├── models.py             # Database models (User, Media, MediaBatch)
│   │   ├── permissions.py        # Custom permission classes
│   │   ├── serializers.py        # REST framework serializers
│   │   ├── tests.py              # Test cases
│   │   ├── urls.py               # API endpoint URLs
│   │   └── views.py              # API view functions and classes
│   └── backend/                  # Django project settings
│       ├── __init__.py
│       ├── asgi.py               # ASGI configuration
│       ├── settings.py           # Django settings (DB, auth, etc.)
│       ├── urls.py               # Main URL routing
│       └── wsgi.py               # WSGI configuration
└── README.md                     # README.md file for setup both for frontend and backend
```
## 🧰 Getting Started

### Prerequisites

- **Node.js 22.14.0** and **npm 10.9.2** installed (`nvm install 22.14.0` & `nvm use 22.14.0`)

- **Python 3.13.3** and **pip 25.0.1** installed (`https://www.python.org/ftp/python/3.13.3/python-3.13.3-amd64.exe`)

- **Expo CLI** installed globally (`npm install -g expo-cli`)

- **Docker** and **Docker Compose**:
  - Docker Desktop for [Windows/Mac](https://www.docker.com/products/docker-desktop/)
  - Docker Engine 24.0.5+ for [Linux](https://docs.docker.com/engine/install/)
  - Docker Compose 2.20.2+ (`pip install docker-compose` or included with Docker Desktop)

- **Git** installed on your system.

### Clone the Repository

1. Clone the repository to your local machine:
   ```bash
   git clone https://github.com/cyberwithaman/digicon.git
   ```
### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd django
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   ```On Windows```    : venv\Scripts\activate.ps1
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Apply makemigrations & migrate:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. create superuser
   ```bash
   python manage.py createsuperuser
   ```

6. Run the development server:
   ```bash
   python manage.py runserver
   ```

The backend API will be available at `http://{IP-ADDRESS}:8000/`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd react-native
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   expo start
   ```

Use the Expo Go app on your mobile device to scan the QR code and run the application.

## 🔗 API Endpoints

### Authentication
- **Login**: `POST /api/auth/login/`
- **Logout**: `POST /api/auth/logout/`
- **Change Password**: `POST /api/auth/password/change/`

### User Management
- **Get Current User Profile**: `GET /api/users/me/`
- **Update Profile**: `PUT /api/users/me/update/`
- **Get All Users**: `GET /api/users/` (Admin only)
- **Create User**: `POST /api/users/` (Admin only)
- **Get User by ID**: `GET /api/users/<id>/`
- **Update User**: `PUT /api/users/<id>/` (Admin only)
- **Delete User**: `DELETE /api/users/<id>/` (Admin only)

### Media Management
- **Get All Media**: `GET /api/media/`
- **Upload Media**: `POST /api/media/`
- **Get Media by ID**: `GET /api/media/<id>/`
- **Update Media**: `PUT /api/media/<id>/` (Owner/Admin only)
- **Delete Media**: `DELETE /api/media/<id>/` (Owner/Admin only)

## 🛠️ Common Commands and Their Purpose

### Node.js and npm Commands

```bash
# Install Node.js using NVM (Node Version Manager)
nvm install 22.14.0
```
**Purpose**: Installs the specific version of Node.js required for this project. Using NVM ensures version compatibility across team members.

```bash
# Use the correct Node.js version
nvm use 22.14.0
```
**Purpose**: Switches to the required Node.js version for this project, preventing version conflicts.

```bash
# Install Expo CLI globally
npm install -g expo-cli
```
**Purpose**: Installs the Expo command-line interface globally, which is essential for developing, building, and testing the React Native application.

```bash
# Install project dependencies
npm install
```
**Purpose**: Installs all the JavaScript dependencies defined in package.json, including React Native, Expo, and other libraries.

```bash
# Start the Expo development server
expo start
```
**Purpose**: Launches the Expo development server, allowing you to run the app on physical devices or simulators.

```bash
# Start Expo on a specific platform
expo start --android
expo start --ios
expo start --web
```
**Purpose**: Launches the app directly on a specific platform's emulator/simulator.

```bash
# Build a production version for Android
expo build:android
```
**Purpose**: Creates a production-ready APK or AAB file for Android distribution.

```bash
# Build a production version for iOS
expo build:ios
```
**Purpose**: Creates a production-ready IPA file for iOS App Store submission.

```bash
# Eject from Expo managed workflow
expo eject
```
**Purpose**: Converts the project from Expo managed workflow to bare workflow for more customization options.

### Python and Django Commands

```bash
# Create a virtual environment
python -m venv venv
```
**Purpose**: Creates an isolated Python environment to avoid dependency conflicts with other projects.

```bash
# Activate virtual environment (Windows)
venv\Scripts\activate.ps1
```
**Purpose**: Activates the virtual environment on Windows, ensuring all Python commands use the project's environment.

```bash
# Activate virtual environment (Linux/Mac)
source venv/bin/activate
```
**Purpose**: Activates the virtual environment on Linux/Mac systems.

```bash
# Install Python dependencies
pip install -r requirements.txt
```
**Purpose**: Installs all the Python packages required for the Django backend.

```bash
# Generate database migration files
python manage.py makemigrations
```
**Purpose**: Creates migration files based on changes to your Django models, preparing database schema updates.

```bash
# Apply migrations to the database
python manage.py migrate
```
**Purpose**: Applies the migration files to the database, updating its schema to match your models.

```bash
# Create a superuser for admin access
python manage.py createsuperuser
```
**Purpose**: Creates an admin user with full access to the Django admin interface.

```bash
# Run the Django development server
python manage.py runserver
```
**Purpose**: Starts the Django development server for testing the backend API.

```bash
# Run the Django development server on a specific IP and port
python manage.py runserver 0.0.0.0:8000
```
**Purpose**: Starts the Django server accessible from other devices on the network, useful for testing with mobile devices.

```bash
# Run Django tests
python manage.py test
```
**Purpose**: Runs the automated test suite to verify backend functionality.

```bash
# Create a new Django app
python manage.py startapp new_app_name
```
**Purpose**: Creates a new Django application module within the project.

```bash
# Collect static files
python manage.py collectstatic
```
**Purpose**: Gathers all static files into a single directory for production deployment.

### Docker Commands

```bash
# Build and start Docker containers
docker-compose up
```
**Purpose**: Builds and starts all services defined in docker-compose.yml, including the Django backend and any databases.

```bash
# Build and start Docker containers in detached mode
docker-compose up -d
```
**Purpose**: Runs containers in the background, freeing up the terminal.

```bash
# Stop Docker containers
docker-compose down
```
**Purpose**: Stops and removes all running containers defined in docker-compose.yml.

```bash
# Build Docker images
docker-compose build
```
**Purpose**: Rebuilds Docker images when Dockerfile or dependencies change.

```bash
# View Docker container logs
docker-compose logs
```
**Purpose**: Displays logs from all containers for debugging.

### Git Commands

```bash
# Initialize a Git repository
git init
```
**Purpose**: Creates a new Git repository for version control.

```bash
# Clone the repository
git clone https://github.com/username/mobileapp.git
```
**Purpose**: Downloads a copy of the repository to your local machine.

```bash
# Add all changes to staging
git add .
```
**Purpose**: Stages all modified and new files for the next commit.

```bash
# Commit changes
git commit -m "Descriptive message"
```
**Purpose**: Records the staged changes to the repository with a message.

```bash
# Push changes to remote repository
git push origin main
```
**Purpose**: Uploads local commits to the remote repository.

```bash
# Pull latest changes
git pull origin main
```
**Purpose**: Downloads and integrates changes from the remote repository.

```bash
# Create and switch to a new branch
git checkout -b feature/new-feature
```
**Purpose**: Creates a new branch for developing features without affecting the main codebase.

## 📌 Notes

- The frontend communicates with the backend using Axios. Update the base URL in the Axios configuration to match your backend server's address.
- SQLite3 is used for local development. For production, consider switching to a more robust database like PostgreSQL.
