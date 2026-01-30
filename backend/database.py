import os
from sqlmodel import SQLModel, create_engine, Session

# 1. Tenta pegar a URL do banco das variáveis de ambiente (Nuvem)
# O Render fornece 'postgres://', mas o SQLAlchemy precisa de 'postgresql://'
DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 2. Se não tiver URL (estamos local), usa o SQLite
if not DATABASE_URL:
    sqlite_file_name = "database.db"
    DATABASE_URL = f"sqlite:///{sqlite_file_name}"
    connect_args = {"check_same_thread": False} # Apenas para SQLite
else:
    connect_args = {} # PostgreSQL não precisa disso

# 3. Cria a Engine
engine = create_engine(DATABASE_URL, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session