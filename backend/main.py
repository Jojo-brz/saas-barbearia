from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from database import create_db_and_tables, get_session
from models import Barbershop, Service, ServiceCreate
from models import Barbershop, Service, ServiceCreate, Booking, BookingCreate

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

@app.get("/barbershops/{slug_url}", response_model=Barbershop)
def read_single_barbershop(slug_url: str, session: Session = Depends(get_session)):
    statement = select(Barbershop).where(Barbershop.slug == slug_url)
    barbershop = session.exec(statement).first()
    if not barbershop:
        raise HTTPException(status_code=404, detail="Barbearia não encontrada")
    return barbershop

# --- ROTAS SERVIÇOS ---

# AQUI ESTAVA O SEGREDO: Usar ServiceCreate na entrada
@app.post("/services/", response_model=Service)
def create_service(service_data: ServiceCreate, session: Session = Depends(get_session)):
    # Valida e converte
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

# --- ROTAS DE SERVIÇOS (NOVAS: UPDATE E DELETE) ---

# Rota para Deletar Serviço
@app.delete("/services/{service_id}")
def delete_service(service_id: int, session: Session = Depends(get_session)):
    service = session.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    session.delete(service)
    session.commit()
    return {"ok": True}

# Rota para Editar Serviço
class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    duration: Optional[int] = None

@app.put("/services/{service_id}", response_model=Service)
def update_service(service_id: int, service_data: ServiceUpdate, session: Session = Depends(get_session)):
    service = session.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    
    # Atualiza apenas os campos enviados
    if service_data.name: service.name = service_data.name
    if service_data.price: service.price = service_data.price
    if service_data.duration: service.duration = service_data.duration
    
    session.add(service)
    session.commit()
    session.refresh(service)
    return service

# --- ROTA DE AGENDAMENTO COM VALIDAÇÃO ---
# Substitua a rota 'create_booking' antiga por esta nova:

@app.post("/bookings/", response_model=Booking)
def create_booking(booking_data: BookingCreate, session: Session = Depends(get_session)):
    # 1. Busca a barbearia para ver os horários
    shop = session.get(Barbershop, booking_data.barbershop_id)
    if not shop:
        raise HTTPException(status_code=404, detail="Barbearia não encontrada")

    # 2. Lógica de Validação de Horário
    # O formato date_time vem como "2023-10-25T14:30"
    booking_dt = datetime.fromisoformat(booking_data.date_time)
    booking_time_str = booking_dt.strftime("%H:%M") # Pega só "14:30"

    # Compara strings: "09:00" <= "14:30" <= "18:00"
    if booking_time_str < shop.open_time or booking_time_str >= shop.close_time:
        raise HTTPException(
            status_code=400, 
            detail=f"Barbearia fechada neste horário. Funcionamento: {shop.open_time} às {shop.close_time}"
        )

    # 3. Salva
    booking = Booking.model_validate(booking_data)
    session.add(booking)
    session.commit()
    session.refresh(booking)
    return booking

# --- ROTAS DE AGENDAMENTO ---

@app.post("/bookings/", response_model=Booking)
def create_booking(booking_data: BookingCreate, session: Session = Depends(get_session)):
    # 1. Validar se a barbearia e o serviço existem
    # (Poderíamos adicionar validações extras aqui, como checar horário livre)
    
    # 2. Salvar o agendamento
    booking = Booking.model_validate(booking_data)
    session.add(booking)
    session.commit()
    session.refresh(booking)
    
    return booking

@app.get("/barbershops/{slug_url}/bookings", response_model=list[Booking])
def read_barbershop_bookings(slug_url: str, session: Session = Depends(get_session)):
    # Busca a barbearia
    statement = select(Barbershop).where(Barbershop.slug == slug_url)
    barbershop = session.exec(statement).first()
    
    if not barbershop:
        raise HTTPException(status_code=404, detail="Barbearia não encontrada")
        
    return barbershop.bookings

# Classe para receber os dados do Login
class LoginData(BaseModel):
    email: str
    password: str

# --- ROTA DE LOGIN ---
@app.post("/login")
def login(data: LoginData, session: Session = Depends(get_session)):
    # Busca a barbearia pelo e-mail
    statement = select(Barbershop).where(Barbershop.email == data.email)
    shop = session.exec(statement).first()

    # 1. Verifica se existe e se a senha bate
    if not shop or shop.password != data.password:
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    
    # 2. Verifica se você (Super Admin) bloqueou por falta de pagamento
    if not shop.is_active:
        raise HTTPException(status_code=403, detail="Conta suspensa. Contate o suporte financeiro.")

    # Se tudo ok, retorna o SLUG para o frontend redirecionar
    return {"slug": shop.slug, "name": shop.name}

# --- ROTAS DO SUPER ADMIN ---

# 1. Bloquear/Desbloquear Barbearia (Toggle)
@app.post("/admin/toggle_status/{barbershop_id}")
def toggle_status(barbershop_id: int, session: Session = Depends(get_session)):
    shop = session.get(Barbershop, barbershop_id)
    if not shop:
        raise HTTPException(status_code=404, detail="Barbearia não encontrada")
    
    # Inverte o status (Se tá ativo, bloqueia. Se tá bloqueado, ativa)
    shop.is_active = not shop.is_active
    session.add(shop)
    session.commit()
    return {"status": "Updated", "is_active": shop.is_active}