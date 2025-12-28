from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
import json

# Configuração padrão (Seg-Sex 09-18, Sab 09-14, Dom Fechado)
DEFAULT_HOURS = json.dumps({
    "monday": {"open": "09:00", "close": "18:00", "active": True},
    "tuesday": {"open": "09:00", "close": "18:00", "active": True},
    "wednesday": {"open": "09:00", "close": "18:00", "active": True},
    "thursday": {"open": "09:00", "close": "18:00", "active": True},
    "friday": {"open": "09:00", "close": "18:00", "active": True},
    "saturday": {"open": "09:00", "close": "14:00", "active": True},
    "sunday": {"open": "00:00", "close": "00:00", "active": False},
})

# --- BARBEARIA ---
class Barbershop(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    slug: str = Field(unique=True, index=True)
    address: Optional[str] = None

    # NOVOS CAMPOS DE SEGURANÇA
    email: str = Field(unique=True, index=True) # Login
    password: str  # Senha (num app real, usaríamos hash, mas faremos simples pro MVP)
    is_active: bool = Field(default=True) # Se False, o login é bloqueado (falta de pagamento)

    # --- CAMPOS DE FUNCIONAMENTO ---
    hours_config: str = Field(default=DEFAULT_HOURS) # Formato JSON

    # --- IMAGEM ---
    logo_url: Optional[str] = None
    
    services: List["Service"] = Relationship(back_populates="barbershop")
    bookings: List["Booking"] = Relationship(back_populates="barbershop") # <--- Nova relação

# --- SERVIÇOS ---
class ServiceBase(SQLModel):
    name: str
    price: float
    duration: int
    barbershop_id: int = Field(foreign_key="barbershop.id")
    image_url: Optional[str] = None

class Service(ServiceBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    barbershop: Optional[Barbershop] = Relationship(back_populates="services")

class ServiceCreate(ServiceBase):
    pass

# --- AGENDAMENTOS (NOVO!) ---
class BookingBase(SQLModel):
    customer_name: str  # Nome do cliente
    customer_phone: str # Telefone (WhatsApp)
    date_time: str      # Data e Hora (ex: "2023-10-25T14:00")
    
    barbershop_id: int = Field(foreign_key="barbershop.id")
    service_id: int = Field(foreign_key="service.id") # Qual serviço ele escolheu

class Booking(BookingBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    barbershop: Optional[Barbershop] = Relationship(back_populates="bookings")

class BookingCreate(BookingBase):
    pass