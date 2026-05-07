from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import models, database

# Create tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Patient Calendar API 🏥")

# Allow React frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Schemas (data validation) ---
class PatientCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    condition: Optional[str] = None
    notes: Optional[str] = None

class AppointmentCreate(BaseModel):
    patient_id: int
    patient_name: str
    date: str
    start_time: str
    end_time: str
    condition: Optional[str] = None
    notes: Optional[str] = None
    color: Optional[str] = "#4F46E5"

# --- Patient Routes ---
@app.get("/patients")
def get_patients(db: Session = Depends(database.get_db)):
    return db.query(models.Patient).all()

@app.post("/patients")
def create_patient(patient: PatientCreate, db: Session = Depends(database.get_db)):
    db_patient = models.Patient(**patient.dict())
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@app.delete("/patients/{patient_id}")
def delete_patient(patient_id: int, db: Session = Depends(database.get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(patient)
    db.commit()
    return {"message": "Patient deleted"}

# --- Appointment Routes ---
@app.get("/appointments")
def get_appointments(db: Session = Depends(database.get_db)):
    return db.query(models.Appointment).all()

@app.post("/appointments")
def create_appointment(apt: AppointmentCreate, db: Session = Depends(database.get_db)):
    db_apt = models.Appointment(**apt.dict())
    db.add(db_apt)
    db.commit()
    db.refresh(db_apt)
    return db_apt

@app.delete("/appointments/{apt_id}")
def delete_appointment(apt_id: int, db: Session = Depends(database.get_db)):
    apt = db.query(models.Appointment).filter(models.Appointment.id == apt_id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    db.delete(apt)
    db.commit()
    return {"message": "Appointment deleted"}

@app.get("/")
def root():
    return {"message": "Patient Calendar API is running! 🏥"}