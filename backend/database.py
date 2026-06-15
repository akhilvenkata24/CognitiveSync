import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Retrieve connection string, defaulting to a local SQLite database if Postgres is absent
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Build path to cognitivesync.db inside workspace root
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, "cognitivesync.db")
    DATABASE_URL = f"sqlite:///{db_path.replace('\\', '/')}"

# Connection arguments for sqlite/postgres
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Create engine
engine = create_engine(DATABASE_URL, connect_args=connect_args)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base class for models
Base = declarative_base()

# DB Dependency injection helper
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
