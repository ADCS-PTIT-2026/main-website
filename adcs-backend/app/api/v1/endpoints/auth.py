from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.auth import LoginRequest, LoginResponse, RegisterRequest, RegisterResponse
from app.services.auth_service import login, register
from app.db.session import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/login", response_model=LoginResponse)
def login_api(request: LoginRequest, db: Session = Depends(get_db)):
    return login(db, request.email, request.password)

@router.post("/register", response_model=RegisterResponse)
def register_api(request: RegisterRequest, db: Session = Depends(get_db)):
    return register(db, request.name, request.email, request.password)