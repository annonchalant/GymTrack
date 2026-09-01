from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import DuplicateKeyError
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta, timezone
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT config
JWT_SECRET = os.environ['JWT_SECRET']  # fail fast rather than falling back to a known default
JWT_ALGORITHM = 'HS256'
JWT_EXPIRE_DAYS = 30

# Security scheme
security = HTTPBearer(auto_error=False)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ─── Auth helpers ─────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


# ─── Auth dependency ──────────────────────────────────────────────────────────

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
):
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    username = payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    user = await db.users.find_one({"username": username})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


# ─── Pydantic Models ──────────────────────────────────────────────────────────

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class StorageItem(BaseModel):
    key: str
    value: str

class RegisterRequest(BaseModel):
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


# ─── Auth routes ──────────────────────────────────────────────────────────────

@api_router.post("/auth/register", status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest):
    username = body.username.strip().lower()
    if not username or len(username) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be at least 3 characters",
        )
    if not body.password or len(body.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters",
        )
    hashed = hash_password(body.password)
    try:
        await db.users.insert_one({
            "username": username,
            "password_hash": hashed,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    except DuplicateKeyError:
        # Unique index on username is the source of truth — this also covers
        # the race where two requests pass a find_one-style check concurrently.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        )
    return {"status": "created", "username": username}


@api_router.post("/auth/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    username = body.username.strip().lower()
    user = await db.users.find_one({"username": username})
    if user is None or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    token = create_access_token({"sub": username})
    return AuthResponse(access_token=token, username=username)


# ─── Original status routes (public) ─────────────────────────────────────────

@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]


# ─── Storage routes (authenticated + user-scoped) ────────────────────────────

@api_router.get("/storage")
async def get_all_storage(current_user: dict = Depends(get_current_user)):
    user_id = current_user["username"]
    items = await db.storage.find({"user_id": user_id}).to_list(1000)
    return [{"key": item["key"], "value": item["value"]} for item in items]

@api_router.post("/storage")
async def set_storage_item(
    item: StorageItem,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["username"]
    try:
        await db.storage.update_one(
            {"user_id": user_id, "key": item.key},
            {"$set": {"value": item.value}},
            upsert=True,
        )
    except DuplicateKeyError:
        # Two concurrent upserts raced past the initial match — the doc now
        # exists, so a plain update (no upsert) will land on the winner.
        await db.storage.update_one(
            {"user_id": user_id, "key": item.key},
            {"$set": {"value": item.value}},
        )
    return {"status": "success"}

@api_router.delete("/storage/{key}")
async def delete_storage_item(
    key: str,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["username"]
    await db.storage.delete_one({"user_id": user_id, "key": key})
    return {"status": "success"}


# ─── App assembly ─────────────────────────────────────────────────────────────

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    # Auth is via Bearer token (Authorization header), not cookies, so
    # allow_credentials is unnecessary — and combining it with a wildcard
    # origin is invalid per the fetch/CORS spec.
    allow_credentials=False,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def create_indexes():
    await db.users.create_index("username", unique=True)
    await db.storage.create_index([("user_id", 1), ("key", 1)], unique=True)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
