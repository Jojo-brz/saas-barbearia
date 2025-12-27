from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship

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
    
    services: List["Service"] = Relationship(back_populates="barbershop")
    bookings: List["Booking"] = Relationship(back_populates="barbershop") # <--- Nova relação

# --- SERVIÇOS ---
class ServiceBase(SQLModel):
    name: str
    price: float
    duration: int
    barbershop_id: int = Field(foreign_key="barbershop.id")

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