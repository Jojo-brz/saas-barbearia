from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
import json

# Configuração Padrão
DEFAULT_HOURS = json.dumps({
    "monday": {"open": "09:00", "close": "18:00", "break_start": "", "break_end": "", "active": True},
    "tuesday": {"open": "09:00", "close": "18:00", "break_start": "", "break_end": "", "active": True},
    "wednesday": {"open": "09:00", "close": "18:00", "break_start": "", "break_end": "", "active": True},
    "thursday": {"open": "09:00", "close": "18:00", "break_start": "", "break_end": "", "active": True},
    "friday": {"open": "09:00", "close": "18:00", "break_start": "", "break_end": "", "active": True},
    "saturday": {"open": "09:00", "close": "14:00", "break_start": "", "break_end": "", "active": True},
    "sunday": {"open": "00:00", "close": "00:00", "break_start": "", "break_end": "", "active": False},
})

class SuperAdmin(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    name: str
    password: str

class Barbershop(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    slug: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    password: str
    is_active: bool = Field(default=True)
    hours_config: str = Field(default=DEFAULT_HOURS)
    logo_url: Optional[str] = None 
    address: Optional[str] = None

    services: List["Service"] = Relationship(back_populates="barbershop")
    bookings: List["Booking"] = Relationship(back_populates="barbershop")
    barbers: List["Barber"] = Relationship(back_populates="barbershop")
    cash_entries: List["CashEntry"] = Relationship(back_populates="barbershop")

class Barber(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    photo_url: Optional[str] = None
    barbershop_id: int = Field(foreign_key="barbershop.id")
    barbershop: Optional[Barbershop] = Relationship(back_populates="barbers")
    bookings: List["Booking"] = Relationship(back_populates="barber")

class ServiceBase(SQLModel):
    name: str
    price: float
    duration: int
    image_url: Optional[str] = None 
    barbershop_id: int = Field(foreign_key="barbershop.id")

class Service(ServiceBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    barbershop: Optional[Barbershop] = Relationship(back_populates="services")

class ServiceCreate(ServiceBase):
    pass

class BookingBase(SQLModel):
    customer_name: str
    customer_phone: str
    date_time: str
    barbershop_id: int = Field(foreign_key="barbershop.id")
    service_id: int = Field(foreign_key="service.id")
    barber_id: int = Field(foreign_key="barber.id")

class Booking(BookingBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    barbershop: Optional[Barbershop] = Relationship(back_populates="bookings")
    barber: Optional[Barber] = Relationship(back_populates="bookings")

class BookingCreate(BookingBase):
    pass

class CashEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    description: str
    value: float
    date: str
    barbershop_id: int = Field(foreign_key="barbershop.id")
    barbershop: Optional[Barbershop] = Relationship(back_populates="cash_entries")

class CashEntryCreate(SQLModel):
    description: str
    value: float
    date: str
    barbershop_id: int