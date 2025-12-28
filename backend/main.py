import json
import shutil
import os
import uuid
from fastapi import UploadFile, File
from fastapi.staticfiles import StaticFiles
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from database import create_db_and_tables, get_session
# Import único e consolidado
from models import Barbershop, BookingBase, Service, ServiceCreate, Booking, BookingCreate

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

# Configuração do CORS
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURAÇÃO DE ARQUIVOS ESTÁTICOS ---
# Isso permite acessar a imagem via http://localhost:8000/images/nome-do-arquivo.jpg
os.makedirs("uploads", exist_ok=True) # Cria a pasta se não existir
app.mount("/images", StaticFiles(directory="uploads"), name="images")


@app.get("/")
def read_root():
    return {"mensagem": "API SaaS Barbearia Online"}

# --- ROTAS BARBEARIA ---

@app.post("/barbershops/", response_model=Barbershop)
def create_barbershop(barbershop: Barbershop, session: Session = Depends(get_session)):
    session.add(barbershop)
    session.commit()
    session.refresh(barbershop)
    return barbershop

@app.get("/barbershops/", response_model=list[Barbershop])
def read_barbershops(session: Session = Depends(get_session)):
    barbershops = session.exec(select(Barbershop)).all()
    return barbershops

@app.get("/barbershops/{slug}", response_model=Barbershop)
def read_barbershop_by_slug(slug: str, session: Session = Depends(get_session)):
    statement = select(Barbershop).where(Barbershop.slug == slug)
    barbershop = session.exec(statement).first()
    if not barbershop:
        raise HTTPException(status_code=404, detail="Barbearia não encontrada")
    return barbershop

# --- ROTA PARA O BARBEIRO ATUALIZAR OS HORÁRIOS ---
class HoursUpdate(BaseModel):
    hours_config: str # Recebe o JSON como string

@app.put("/barbershops/{barbershop_id}/hours")
def update_hours(barbershop_id: int, data: HoursUpdate, session: Session = Depends(get_session)):
    shop = session.get(Barbershop, barbershop_id)
    if not shop:
        raise HTTPException(status_code=404, detail="Barbearia não encontrada")
    
    shop.hours_config = data.hours_config
    session.add(shop)
    session.commit()
    return {"ok": True}

# --- ROTA DE UPLOAD DE LOGO ---
class LogoUpdate(BaseModel):
    logo_url: str

@app.put("/barbershops/{barbershop_id}/logo")
def update_logo(barbershop_id: int, data: LogoUpdate, session: Session = Depends(get_session)):
    shop = session.get(Barbershop, barbershop_id)
    if not shop: raise HTTPException(status_code=404, detail="Barbearia não encontrada")
    shop.logo_url = data.logo_url
    session.add(shop)
    session.commit()
    return {"ok": True}

# --- ROTA DE UPLOAD DE ARQUIVOS ---
@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    # Gera um nome único para não substituir arquivos iguais
    file_extension = file.filename.split(".")[-1]
    new_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = f"uploads/{new_filename}"
    
    # Salva no disco
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Retorna a URL completa para o frontend salvar no banco
    return {"url": f"http://127.0.0.1:8000/images/{new_filename}"}

# --ROTAS PARA MUDAR SENHA E EMAIL--

class BarbershopUpdateAuth(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None

@app.put("/admin/update_barbershop/{barbershop_id}")
def update_barbershop_auth(barbershop_id: int, data: BarbershopUpdateAuth, session: Session = Depends(get_session)):
    shop = session.get(Barbershop, barbershop_id)
    if not shop:
        raise HTTPException(status_code=404, detail="Barbearia não encontrada")
    
    if data.email:
        shop.email = data.email
    if data.password:
        shop.password = data.password
        
    session.add(shop)
    session.commit()
    session.refresh(shop)
    return shop

# Rota para EXCLUIR Barbearia (SOMENTE SUPER ADMIN)
@app.delete("/admin/barbershops/{barbershop_id}")
def delete_barbershop(barbershop_id: int, session: Session = Depends(get_session)):
    shop = session.get(Barbershop, barbershop_id)
    if not shop:
        raise HTTPException(status_code=404, detail="Barbearia não encontrada")
    
    # 1. Apagar todos os agendamentos dessa barbearia
    for booking in shop.bookings:
        session.delete(booking)
        
    # 2. Apagar todos os serviços dessa barbearia
    for service in shop.services:
        session.delete(service)
        
    # 3. Finalmente, apagar a barbearia
    session.delete(shop)
    
    session.commit()
    return {"ok": True}

# --- ROTAS SERVIÇOS ---

@app.post("/services/", response_model=Service)
def create_service(service_data: ServiceCreate, session: Session = Depends(get_session)):
    service = Service.model_validate(service_data)
    session.add(service)
    session.commit()
    session.refresh(service)
    return service

@app.get("/barbershops/{slug_url}/services", response_model=list[Service])
def read_barbershop_services(slug_url: str, session: Session = Depends(get_session)):
    statement = select(Barbershop).where(Barbershop.slug == slug_url)
    barbershop = session.exec(statement).first()
    if not barbershop:
        raise HTTPException(status_code=404, detail="Barbearia não encontrada")
    return barbershop.services

@app.delete("/services/{service_id}")
def delete_service(service_id: int, session: Session = Depends(get_session)):
    service = session.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    session.delete(service)
    session.commit()
    return {"ok": True}

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    duration: Optional[int] = None
    image_url: Optional[str] = None

@app.put("/services/{service_id}", response_model=Service)
def update_service(service_id: int, service_data: ServiceUpdate, session: Session = Depends(get_session)):
    service = session.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    
    if service_data.name: service.name = service_data.name
    if service_data.price: service.price = service_data.price
    if service_data.duration: service.duration = service_data.duration
    
    session.add(service)
    session.commit()
    session.refresh(service)
    return service

# --- ROTAS DE AGENDAMENTO (BOOKINGS) ---

# Modelo de leitura que inclui DURAÇÃO (IMPORTANTE: Manter este)
class BookingRead(BookingBase):
    id: int
    service_duration: int

@app.get("/barbershops/{slug_url}/bookings", response_model=list[BookingRead])
def read_barbershop_bookings(slug_url: str, session: Session = Depends(get_session)):
    statement = select(Barbershop).where(Barbershop.slug == slug_url)
    barbershop = session.exec(statement).first()
    
    if not barbershop:
        raise HTTPException(status_code=404, detail="Barbearia não encontrada")
    
    results = []
    for booking in barbershop.bookings:
        service = session.get(Service, booking.service_id)
        duration = service.duration if service else 30
        
        results.append(BookingRead(
            id=booking.id,
            customer_name=booking.customer_name,
            customer_phone=booking.customer_phone,
            date_time=booking.date_time,
            barbershop_id=booking.barbershop_id,
            service_id=booking.service_id,
            service_duration=duration
        ))
        
    return results

# Criação de agendamento COM VALIDAÇÃO DE HORÁRIO (IMPORTANTE: Manter este)
@app.post("/bookings/", response_model=Booking)
def create_booking(booking_data: BookingCreate, session: Session = Depends(get_session)):
    shop = session.get(Barbershop, booking_data.barbershop_id)
    if not shop:
        raise HTTPException(status_code=404, detail="Barbearia não encontrada")

    # 1. Descobrir qual dia da semana é o agendamento
    booking_dt = datetime.fromisoformat(booking_data.date_time)
    day_name = booking_dt.strftime("%A").lower() 
    booking_time = booking_dt.strftime("%H:%M")

    # 2. Ler a configuração daquele dia
    try:
        config = json.loads(shop.hours_config)
        day_config = config.get(day_name)
    except:
        day_config = {"open": "09:00", "close": "18:00", "active": True}

    # 3. Validar
    dias_pt = {"monday": "Segunda", "tuesday": "Terça", "wednesday": "Quarta", "thursday": "Quinta", "friday": "Sexta", "saturday": "Sábado", "sunday": "Domingo"}
    nome_dia = dias_pt.get(day_name, day_name)

    if not day_config or not day_config.get("active"):
        raise HTTPException(status_code=400, detail=f"A barbearia não abre aos {nome_dia}s.")

    if booking_time < day_config["open"] or booking_time >= day_config["close"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Fechado. Aos {nome_dia}s funcionamos das {day_config['open']} às {day_config['close']}"
        )

    # 4. Salvar
    booking = Booking.model_validate(booking_data)
    session.add(booking)
    session.commit()
    session.refresh(booking)
    return booking

# --- AUTH / LOGIN ---

class LoginData(BaseModel):
    email: str
    password: str

@app.post("/login")
def login(data: LoginData, session: Session = Depends(get_session)):
    statement = select(Barbershop).where(Barbershop.email == data.email)
    shop = session.exec(statement).first()

    if not shop or shop.password != data.password:
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    
    if not shop.is_active:
        raise HTTPException(status_code=403, detail="Conta suspensa. Contate o suporte financeiro.")

    return {"slug": shop.slug, "name": shop.name}

@app.post("/admin/toggle_status/{barbershop_id}")
def toggle_status(barbershop_id: int, session: Session = Depends(get_session)):
    shop = session.get(Barbershop, barbershop_id)
    if not shop:
        raise HTTPException(status_code=404, detail="Barbearia não encontrada")
    
    shop.is_active = not shop.is_active
    session.add(shop)
    session.commit()
    return {"status": "Updated", "is_active": shop.is_active}
