from sqlalchemy import Column, Integer, String, DateTime, Text
from database import Base
from datetime import datetime

class Patient(Base):
    __tablename__ = "patients"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String, nullable=False)
    phone         = Column(String)
    condition     = Column(String)       # e.g. "Diabetes", "Hypertension"
    notes         = Column(Text)
    created_at    = Column(DateTime, default=datetime.utcnow)

class Appointment(Base):
    __tablename__ = "appointments"

    id            = Column(Integer, primary_key=True, index=True)
    patient_id    = Column(Integer, nullable=False)
    patient_name  = Column(String, nullable=False)
    date          = Column(String, nullable=False)   # "2026-05-10"
    start_time    = Column(String, nullable=False)   # "09:00"
    end_time      = Column(String, nullable=False)   # "09:30"
    condition     = Column(String)
    status        = Column(String, default="scheduled")  # scheduled, done, cancelled
    notes         = Column(Text)
    color         = Column(String, default="#5A53DC") # for calendar display