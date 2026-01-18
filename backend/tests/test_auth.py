def test_signup_success(client):
    """Testing successful signup."""
    payload = {"email": "test_senior@gmail.com", "password": "strongpassword123"}
    response = client.post("/signup", json=payload)
    assert response.status_code == 201
    assert response.json()["email"] == payload["email"]

def test_signup_duplicate_email(client):
    """Testing duplicate email handling."""
    payload = {"email": "duplicate@test.com", "password": "password123"}
    client.post("/signup", json=payload)
    response = client.post("/signup", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

def test_signup_weak_password(client):
    """Testing weak password rejection (Pydantic Validation)."""
    payload = {"email": "weak@test.com", "password": "short"}
    response = client.post("/signup", json=payload)
    
    assert response.status_code == 422
    # Professional way to check list-based errors:
    errors = response.json()["detail"]
    assert errors[0]["msg"] == "String should have at least 8 characters" # For Pydantic V2

def test_signup_invalid_email(client): # Fixed indentation
    """Testing invalid email format rejection."""
    payload = {"email": "invalid-email-format", "password": "validpassword123"}
    response = client.post("/signup", json=payload)
    
    assert response.status_code == 422
    errors = response.json()["detail"]
    # Check if the error message mentions invalid email
    assert "value is not a valid email address" in errors[0]["msg"]