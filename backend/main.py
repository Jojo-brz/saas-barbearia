from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
import shutil
import os
import uuid

# Importações dos seus arquivos locais
from database import engine, get_db, Base
from models import Barbershop, Barber, Service, Appointment, Transaction

app = FastAPI(title="SaaS Barbearia API - Completa")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "SaaS Barbearia API rodando com sucesso!",
        "version": "1.0.0",
        "docs": "/docs" # Atalho para você lembrar onde está a documentação automática
    }

@app.get("/health")
def health_check():
    """Rota técnica para serviços de hospedagem verificarem se o app está vivo"""
    return {"status": "healthy"}

# --- SEGURANÇA E COMUNICAÇÃO ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir arquivos estáticos (Logos e Fotos) para que o Frontend consiga exibir
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Cria as tabelas
Base.metadata.create_all(bind=engine)

# --- 1. AUTENTICAÇÃO ---

@app.post("/auth/login-admin")
def login_admin(data: dict, db: Session = Depends(get_db)):
    email = data.get("email")
    password = data.get("password")
    shop = db.query(Barbershop).filter(Barbershop.owner_email == email).first()
    
    if not shop or shop.password_hash != password:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    role = "SUPER_ADMIN" if shop.is_superadmin else "OWNER"
    return {"user": {"id": shop.id, "name": shop.name, "role": role}, "slug": shop.slug}

@app.post("/auth/verify-pin")
def verify_pin(data: dict, db: Session = Depends(get_db)):
    pin = data.get("pin")
    slug = data.get("slug")
    shop = db.query(Barbershop).filter(Barbershop.slug == slug).first()
    if not shop: raise HTTPException(status_code=404)
    
    barber = db.query(Barber).filter(Barber.pin == pin, Barber.barbershop_id == shop.id).first()
    if not barber: raise HTTPException(status_code=401, detail="PIN inválido")
    
    return {"user": {"id": barber.id, "name": barber.name, "role": barber.role}, "slug": shop.slug}

# --- 2. SUPER ADMIN (Controle do SaaS) ---

@app.get("/super/barbershops")
def list_shops(db: Session = Depends(get_db)):
    return db.query(Barbershop).filter(Barbershop.is_superadmin == False).all()

@app.post("/super/barbershops")
def create_shop(data: dict, db: Session = Depends(get_db)):
    new_shop = Barbershop(**data)
    db.add(new_shop)
    db.commit()
    db.refresh(new_shop)
    return new_shop

@app.delete("/super/barbershops/{shop_id}")
def delete_shop(shop_id: int, db: Session = Depends(get_db)):
    shop = db.query(Barbershop).get(shop_id)
    db.delete(shop)
    db.commit()
    return {"ok": True}

# --- 3. GESTÃO DA BARBEARIA (CEO) ---

@app.get("/admin/{slug}/dashboard")
def get_dashboard(slug: str, db: Session = Depends(get_db)):
    shop = db.query(Barbershop).filter(Barbershop.slug == slug).first()
    if not shop: raise HTTPException(status_code=404)
    return {
        "appointments": shop.appointments,
        "transactions": shop.transactions,
        "barbers": shop.barbers,
        "services": shop.services,
        "shop_id": shop.id
    }

# Rotas de Equipe (Barbeiros)
@app.post("/barbers")
def add_barber(data: dict, db: Session = Depends(get_db)):
    new_barber = Barber(**data)
    db.add(new_barber)
    db.commit()
    return new_barber

@app.delete("/barbers/{barber_id}")
def remove_barber(barber_id: int, db: Session = Depends(get_db)):
    barber = db.query(Barber).get(barber_id)
    db.delete(barber)
    db.commit()
    return {"ok": True}

# Rotas de Serviços
@app.post("/services")
def add_service(data: dict, db: Session = Depends(get_db)):
    new_service = Service(**data)
    db.add(new_service)
    db.commit()
    return new_service

# --- 4. FLUXO DE CAIXA E AGENDAMENTOS ---

@app.post("/appointments")
def create_appointment(data: dict, db: Session = Depends(get_db)):
    new_appo = Appointment(**data)
    db.add(new_appo)
    db.commit()
    return {"status": "success"}

@app.post("/cash-entries")
def add_cash(data: dict, db: Session = Depends(get_db)):
    new_entry = Transaction(**data)
    db.add(new_entry)
    db.commit()
    return {"status": "success"}

# --- 5. UPLOAD DE LOGO ---

@app.post("/upload-logo/{shop_id}")
async def upload_logo(shop_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    shop = db.query(Barbershop).get(shop_id)
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    shop.logo_url = f"http://localhost:8000/uploads/{filename}"
    db.commit()
    return {"url": shop.logo_url}

# --- 6. ROTA PÚBLICA (CLIENTE) ---
@app.get("/barbershops/{slug}")
def get_public_data(slug: str, db: Session = Depends(get_db)):
    shop = db.query(Barbershop).filter(Barbershop.slug == slug).first()
    if not shop: raise HTTPException(status_code=404)
    return {
        "name": shop.name,
        "description": shop.description,
        "address": shop.address,
        "logo_url": shop.logo_url,
        "services": shop.services,
        "barbers": [{"id": b.id, "name": b.name} for b in shop.barbers]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)