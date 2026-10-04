from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.utils.security import create_access_token
from app.schemas.schemas import Token, TokenData
from app.dependencies.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication & Security"])

@router.post("/token", response_model=Token, summary="Obtain JWT Access Token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    valid_roles = {
        "admin": "ADMIN",
        "officer": "TRAFFIC_OFFICER",
        "analyst": "ANALYST",
        "operator": "PAYMENT_OPERATOR"
    }
    user_key = form_data.username.lower()
    if user_key in valid_roles:
        role_name = valid_roles[user_key]
        token = create_access_token(data={"sub": form_data.username, "role": role_name})
        return {"access_token": token, "token_type": "bearer"}
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

@router.get("/me", response_model=TokenData, summary="Get Authenticated User Profile")
def read_current_user(current_user: TokenData = Depends(get_current_user)):
    return current_user

