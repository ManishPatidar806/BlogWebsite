# Makefile for Blog Website

.PHONY: help install dev build start stop logs clean

help:
	@echo "Available commands:"
	@echo "  make install    - Install all dependencies"
	@echo "  make dev        - Start development servers"
	@echo "  make build      - Build for production"
	@echo "  make start      - Start production with Docker"
	@echo "  make stop       - Stop Docker containers"
	@echo "  make logs       - View Docker logs"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make db-migrate - Run database migrations"
	@echo "  make db-reset   - Reset database"

# Install dependencies
install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

# Development
dev:
	@echo "Starting development servers..."
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:5173"
	@echo ""
	@trap 'kill 0' SIGINT; \
	(cd backend && uvicorn app.main:app --reload --port 8000) & \
	(cd frontend && npm run dev) & \
	wait

dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

# Build
build:
	cd frontend && npm run build
	@echo "Frontend built successfully!"

# Docker commands
start:
	docker-compose up -d
	@echo "Services started:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8000"

stop:
	docker-compose down

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

# Database
db-migrate:
	cd backend && alembic upgrade head

db-downgrade:
	cd backend && alembic downgrade -1

db-reset:
	cd backend && alembic downgrade base && alembic upgrade head

# Clean
clean:
	rm -rf frontend/dist
	rm -rf frontend/node_modules
	rm -rf backend/__pycache__
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true

# Docker clean
docker-clean:
	docker-compose down -v --rmi local

# Production with SSL
start-prod:
	docker-compose --profile production up -d

# Testing
test-backend:
	cd backend && pytest

test-frontend:
	cd frontend && npm test

lint:
	cd frontend && npm run lint
	cd backend && ruff check .
