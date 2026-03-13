import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Barbershop, Base
from database import SessionLocal, engine, Base

# Carrega as variáveis do arquivo .env
load_dotenv()

def create_super_from_env():
    # Cria as tabelas se não existirem
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Pega os dados do seu .env
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")
    admin_name = os.getenv("ADMIN_NAME")

    # Verifica se o Super Admin já existe para não duplicar
    existing = db.query(Barbershop).filter(Barbershop.owner_email == admin_email).first()
    
    if not existing:
        super_admin = Barbershop(
            name=admin_name,
            slug="master-admin",
            owner_email=admin_email,
            password_hash=admin_password, # A senha vira 'Whisky*412'
            is_superadmin=True,
            description="Administrador Geral do Sistema"
        )
        db.add(super_admin)
        db.commit()
        print(f"✅ Super Admin criado com sucesso: {admin_email}")
    else:
        print(f"ℹ️ O Super Admin {admin_email} já existe no banco de dados.")
    
    db.close()

if __name__ == "__main__":
    create_super_from_env()