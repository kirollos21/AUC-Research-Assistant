"""
Test cases for the main FastAPI application
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

# Mock the imports that might not be available during testing
with patch.dict('sys.modules', {
    'app.core.config': type(sys.modules.get('types')),
    'app.core.logging': type(sys.modules.get('types')),
    'app.api.v1.router': type(sys.modules.get('types'))
}):
    from main import app


client = TestClient(app)


def test_read_root():
    """Test the root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data
    assert "timestamp" in data
    assert data["message"] == "Welcome to AUC Research Assistant API"


def test_health_check():
    """Test the health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data
    assert "version" in data
    assert "environment" in data


def test_detailed_health_check():
    """Test the detailed health check endpoint"""
    response = client.get("/health/detailed")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "services" in data
    assert "api" in data["services"]
    assert data["services"]["api"] == "healthy"


def test_api_ping():
    """Test the API ping endpoint"""
    response = client.get("/api/v1/ping")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "pong"
    assert data["status"] == "ok"


def test_not_found():
    """Test 404 handling"""
    response = client.get("/nonexistent-endpoint")
    assert response.status_code == 404
    data = response.json()
    assert data["error"] == "Not Found"
    assert "path" in data 