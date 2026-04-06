from fastapi import FastAPI
from app.api.v1.endpoints import auth, system_parameter, users, documents, role_permission, department
from fastapi.middleware.cors import CORSMiddleware

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(role_permission.router, prefix="/api/role-permissions", tags=["Role-Permissions"])
app.include_router(department.router, prefix="/api/departments", tags=["Departments"])
app.include_router(system_parameter.router, prefix="/api/system-parameters", tags="AI_Config")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print(f"Lỗi Validation: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )