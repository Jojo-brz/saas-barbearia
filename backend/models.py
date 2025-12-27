from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship

# --- BARBEARIA ---
class Barbershop(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    slug: str = Field(unique=True, index=True)
    address: Optional[str] = None
    services: List["Service"] = Relationship(back_populates="barbershop")

# --- SERVIÇOS ---

# Modelo Base (Dados comuns)
class ServiceBase(SQLModel):
    name: str
    price: float
    duration: int
    barbershop_id: int = Field(foreign_key="barbershop.id")

# Modelo Tabela (O que vai pro banco - tem ID)
class Service(ServiceBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    barbershop: Optional[Barbershop] = Relationship(back_populates="services")

# Modelo Create (O que vem do Front/Swagger - NÃO tem ID)
class ServiceCreate(ServiceBase):
    pass