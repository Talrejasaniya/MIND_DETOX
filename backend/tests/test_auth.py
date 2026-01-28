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
    
def test_get_user_me_success(client):
    # 1. Pehle ek user create karo (Signup)
    user_data = {"email": "me_test@gmail.com", "password": "password123"}
    client.post("/signup", json=user_data)

    # 2. Login karke token lo
    login_res = client.post("/login", json=user_data)
    token = login_res.json()["access_token"]

    # 3. /users/me par token bhejkar request karo
    # Yahan 'Authorization' header sabse important hai
    response = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["email"] == user_data["email"]
    
def test_get_user_me_invalid_token(client):
    # Galat token bhej kar dekho
    response = client.get("/users/me", headers={"Authorization": "Bearer fake_token_value"})
    
    assert response.status_code == 401
    assert response.json()["detail"] == "Could not validate credentials"