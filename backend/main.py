from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import select
import shutil
import os
import uuid
import datetime

# Importações dos seus arquivos locais
from database import engine, get_db, Base
from models import Barbershop, Barber, Service, Appointment, Transaction

app = FastAPI(title="SaaS Barbearia API - Sistema Completo")

# --- 1. SEGURANÇA E COMUNICAÇÃO ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "SaaS Barbearia API rodando com sucesso!",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# --- 2. AUTENTICAÇÃO ---

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
    pin = str(data.get("pin"))
    slug = data.get("slug")
    shop = db.query(Barbershop).filter(Barbershop.slug == slug).first()
    if not shop: raise HTTPException(status_code=404)
    
    barber = db.query(Barber).filter(Barber.pin == pin, Barber.barbershop_id == shop.id).first()
    if not barber: raise HTTPException(status_code=401, detail="PIN inválido")
    
    return {"user": {"id": barber.id, "name": barber.name, "role": barber.role}, "slug": shop.slug}

# --- 3. SUPER ADMIN (CONTROLE DO SAAS) ---

@app.get("/super/barbershops")
def list_shops(db: Session = Depends(get_db)):
    return db.query(Barbershop).filter(Barbershop.is_superadmin == False).all()

@app.post("/super/barbershops")
def create_shop(data: dict, db: Session = Depends(get_db)):
    # Validação de Unicidade
    if db.query(Barbershop).filter(Barbershop.slug == data.get("slug")).first():
        raise HTTPException(status_code=400, detail="Slug já existe")

    try:
        new_shop = Barbershop(
            name=data.get("name"),
            slug=data.get("slug"),
            owner_email=data.get("owner_email"),
            password_hash=data.get("password_hash"),
            description=data.get("description", ""),
            address=data.get("address", ""),
            is_active=True
        )
        db.add(new_shop)
        db.flush() 

        # Integração: Cria o CEO automaticamente para o modal de equipe não vir vazio
        new_ceo = Barber(
            name=f"Admin {new_shop.name}",
            role="OWNER",
            pin=data.get("initial_pin", "1234"),
            barbershop_id=new_shop.id
        )
        db.add(new_ceo)
        
        db.commit()
        db.refresh(new_shop)
        return new_shop
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/super/barbershops/{shop_id}")
@app.patch("/super/barbershops/{shop_id}")
def update_barbershop(shop_id: int, data: dict, db: Session = Depends(get_db)):
    """Rota unificada para editar Nome, Email, Slug e Status da barbearia"""
    shop = db.query(Barbershop).get(shop_id)
    if not shop: raise HTTPException(status_code=404)

    for key, value in data.items():
        if hasattr(shop, key):
            setattr(shop, key, value)
    
    db.commit()
    db.refresh(shop)
    return shop

@app.delete("/super/barbershops/{shop_id}")
def delete_shop(shop_id: int, db: Session = Depends(get_db)):
    shop = db.query(Barbershop).get(shop_id)
    if not shop: raise HTTPException(status_code=404)
    db.delete(shop)
    db.commit()
    return {"ok": True}

# --- 4. GESTÃO DE EQUIPE (BARBEIROS) ---

@app.get("/barbershops/{slug}/barbers")
def list_barbers(slug: str, db: Session = Depends(get_db)):
    shop = db.query(Barbershop).filter(Barbershop.slug == slug).first()
    if not shop: raise HTTPException(status_code=404)
    return shop.barbers

@app.post("/admin/barbers/")
def add_barber(data: dict, db: Session = Depends(get_db)):
    # Validação de PIN Único por barbearia
    shop_id = data.get("barbershop_id")
    pin = str(data.get("pin"))
    exists = db.query(Barber).filter(Barber.barbershop_id == shop_id, Barber.pin == pin).first()
    if exists:
        raise HTTPException(status_code=400, detail="PIN já em uso nesta barbearia.")

    new_barber = Barber(
        name=data.get("name"),
        role=data.get("role", "BARBER"),
        pin=pin,
        barbershop_id=shop_id
    )
    db.add(new_barber)
    db.commit()
    return new_barber

@app.put("/admin/barbers/{barber_id}")
def update_barber(barber_id: int, data: dict, db: Session = Depends(get_db)):
    barber = db.query(Barber).get(barber_id)
    if not barber: raise HTTPException(status_code=404)
    
    for key, value in data.items():
        if hasattr(barber, key):
            setattr(barber, key, value)
    
    db.commit()
    db.refresh(barber)
    return barber

@app.delete("/admin/barbers/{barber_id}")
def remove_barber(barber_id: int, db: Session = Depends(get_db)):
    barber = db.query(Barber).get(barber_id)
    if not barber: raise HTTPException(status_code=404)
    db.delete(barber)
    db.commit()
    return {"ok": True}

# --- 5. SERVIÇOS, AGENDAMENTOS E CAIXA ---

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

@app.post("/services")
def add_service(data: dict, db: Session = Depends(get_db)):
    new_service = Service(
        name=data.get("name"),
        price=float(data.get("price")),
        duration=int(data.get("duration")),
        barbershop_id=data.get("barbershop_id")
    )
    db.add(new_service)
    db.commit()
    return new_service

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

# --- 6. UPLOAD E PÚBLICO ---

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

@app.get("/barbershops/{slug}/public")
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