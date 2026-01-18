# 🌿 Mind Detox - Backend (AI-Powered Wellness)

Mind Detox is a mental wellness platform designed to help users track their thoughts and emotions. This repository contains the backend built with a focus on security, testing, and clean architecture.

## 🚀 Key Features (Currently Implemented)
- Secure Authentication: Signup with Bcrypt password hashing (72-byte limit handled).
- Data Validation: Robust input validation using Pydantic V2.
- Automated Testing Suite: High-quality tests for authentication flows.
- Database Isolation: Dedicated PostgreSQL test database for reliable testing.

## 🛠️ Tech Stack
- Framework: FastAPI
- ORM: SQLAlchemy 2.0 (Latest)
- Database: PostgreSQL
- Testing: Pytest & HTTPX

## 🧪 How to Run Tests
To verify the authentication logic, run the following command in the backend folder:
```bash
python -m pytest
