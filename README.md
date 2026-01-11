MERN Authentication System with Docker

A full-stack MERN (MongoDB, Express, React, Node.js) application implementing secure authentication, including email-based OTP verification and forgot password functionality, with the backend containerized using Docker.

Features--
Authentication & Security:
User Sign Up & Login
Two-Step Authentication (2FA) using Email OTP
OTP is sent to the registered email address
Login completes only after OTP verification
Forgot Password
Secure password reset link sent to email
User can set a new password using the link
Passwords stored securely using hashing
JWT-based authentication

Docker Support:
Backend fully containerized using Docker
docker-compose.yml for simplified setup
Ensures consistent environment across systems

Tech Stack--
Frontend:
React.js
CSS
Axios

Backend:
Node.js
Express.js
MongoDB
JWT (Authentication)
Nodemailer (Email & OTP service)
DevOps
Docker
Docker Compose

Environment Variables:

Create a .env file inside the backend folder:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password


Running the Project
Option 1: Run Backend using Docker (Recommended)
cd backend
docker-compose up --build

Option 2: Run Locally (Without Docker)
Backend
cd backend
npm install
npm start

Frontend
cd sstudize_task
npm install
npm start


Frontend runs at:
http://localhost:3000

Authentication Flow:
User registers with email and password
On login:
OTP is sent to the registered email
User verifies OTP to complete login

Forgot Password:
Reset link is sent to email
User sets a new password securely

Security Practices Followed:
Environment variables hidden using .gitignore
Password hashing
Token-based authentication
Email-based verification
Dockerized backend for isolated execution
