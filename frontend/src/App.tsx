import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

const API = "https://patient-calendar-production.up.railway.app";

interface Patient {
  id: number;
  name: string;
  phone: string;
  condition: string;
  notes: string;
}

interface Appointment {
  id: number;
  patient_id: number;
  patient_name: string;
  date: string;
  start_time: string;
  end_time: string;
  condition: string;
  notes: string;
  color: string;
  status: string;
}

const COLORS = ["#4F46E5","#0891B2","#059669","#D97706","#DC2626","#7C3AED"];

const MOTIVATIONS = [
  "Every patient you help is a life you touch. 💙",
  "Your care makes all the difference today. 🌟",
  "One appointment at a time — you're doing great. 🏥",
  "Healing hands, organized days. ✨",
  "You chose this path because you care. Keep going. 🌿",
];

export default function App() {
  const [patients, setPatients]             = useState<Patient[]>([]);
  const [appointments, setAppointments]     = useState<Appointment[]>([]);
  const [search, setSearch]                 = useState("");
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showAddApt, setShowAddApt]         = useState(false);
  const [editApt, setEditApt]               = useState<Appointment | null>(null);
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [motivation]                        = useState(
    MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)]
  );

  // Patient form
  const [pName, setPName]           = useState("");
  const [pPhone, setPPhone]         = useState("");
  const [pCondition, setPCondition] = useState("");
  const [pNotes, setPNotes]         = useState("");

  // Appointment form
  const [aPatientId, setAPatientId] = useState<number>(0);
  const [aDate, setADate]           = useState("");
  const [aStart, setAStart]         = useState("");
  const [aEnd, setAEnd]             = useState("");
  const [aNotes, setANotes]         = useState("");
  const [aColor, setAColor]         = useState(COLORS[0]);
  const [aStatus, setAStatus]       = useState("scheduled");

  useEffect(() => { fetchPatients(); fetchAppointments(); }, []);

  const fetchPatients     = async () => { const r = await fetch(`${API}/patients`);     setPatients(await r.json()); };
  const fetchAppointments = async () => { const r = await fetch(`${API}/appointments`); setAppointments(await r.json()); };

  // --- Stats ---
  const today      = new Date().toISOString().split("T")[0];
  const todayApts  = appointments.filter(a => a.date === today).length;
  const weekApts   = appointments.filter(a => {
    const d = new Date(a.date), now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return d >= startOfWeek && d <= endOfWeek;
  }).length;
  const doneApts      = appointments.filter(a => a.status === "done").length;
  const cancelledApts = appointments.filter(a => a.status === "cancelled").length;

  // --- Patient search ---
  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.condition?.toLowerCase().includes(search.toLowerCase())
  );

  // --- Add Patient ---
  const addPatient = async () => {
    if (!pName) return;
    await fetch(`${API}/patients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: pName, phone: pPhone, condition: pCondition, notes: pNotes }),
    });
    setPName(""); setPPhone(""); setPCondition(""); setPNotes("");
    setShowAddPatient(false);
    fetchPatients();
  };

  // --- Add Appointment ---
  const addAppointment = async () => {
    if (!aPatientId || !aDate || !aStart || !aEnd) return;
    const patient = patients.find(p => p.id === aPatientId);
    await fetch(`${API}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_id: aPatientId,
        patient_name: patient?.name || "",
        date: aDate, start_time: aStart, end_time: aEnd,
        condition: patient?.condition || "",
        notes: aNotes, color: aColor, status: aStatus,
      }),
    });
    resetAptForm();
    setShowAddApt(false);
    fetchAppointments();
  };

  // --- Edit Appointment ---
  const openEdit = (apt: Appointment) => {
    setEditApt(apt);
    setAPatientId(apt.patient_id);
    setADate(apt.date);
    setAStart(apt.start_time);
    setAEnd(apt.end_time);
    setANotes(apt.notes || "");
    setAColor(apt.color);
    setAStatus(apt.status);
  };

  const saveEdit = async () => {
    if (!editApt) return;
    await fetch(`${API}/appointments/${editApt.id}`, { method: "DELETE" });
    const patient = patients.find(p => p.id === aPatientId);
    await fetch(`${API}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_id: aPatientId,
        patient_name: patient?.name || editApt.patient_name,
        date: aDate, start_time: aStart, end_time: aEnd,
        condition: patient?.condition || editApt.condition,
        notes: aNotes, color: aColor, status: aStatus,
      }),
    });
    setEditApt(null);
    resetAptForm();
    fetchAppointments();
  };

  const deleteAppointment = async (id: number) => {
    await fetch(`${API}/appointments/${id}`, { method: "DELETE" });
    fetchAppointments();
  };

  const resetAptForm = () => {
    setAPatientId(0); setADate(""); setAStart("");
    setAEnd(""); setANotes(""); setAColor(COLORS[0]); setAStatus("scheduled");
  };

  const calendarEvents = appointments.map(apt => ({
    id: String(apt.id),
    title: `${apt.patient_name}${apt.condition ? " · " + apt.condition : ""}`,
    start: `${apt.date}T${apt.start_time}`,
    end:   `${apt.date}T${apt.end_time}`,
    backgroundColor: apt.status === "cancelled" ? "#9CA3AF" : apt.color,
    borderColor:     apt.status === "cancelled" ? "#9CA3AF" : apt.color,
  }));

  const AptForm = () => (
    <div className="flex flex-col gap-3">
      <select className="border rounded-lg px-3 py-2 text-sm" value={aPatientId} onChange={e => setAPatientId(Number(e.target.value))}>
        <option value={0}>Select Patient *</option>
        {patients.map(p => <option key={p.id} value={p.id}>{p.name}{p.condition ? ` · ${p.condition}` : ""}</option>)}
      </select>
      <input type="date" className="border rounded-lg px-3 py-2 text-sm" value={aDate} onChange={e => setADate(e.target.value)} />
      <div className="flex gap-2">
        <input type="time" className="border rounded-lg px-3 py-2 text-sm flex-1" value={aStart} onChange={e => setAStart(e.target.value)} />
        <input type="time" className="border rounded-lg px-3 py-2 text-sm flex-1" value={aEnd}   onChange={e => setAEnd(e.target.value)} />
      </div>
      <select className="border rounded-lg px-3 py-2 text-sm" value={aStatus} onChange={e => setAStatus(e.target.value)}>
        <option value="scheduled">Scheduled</option>
        <option value="done">Done</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <textarea className="border rounded-lg px-3 py-2 text-sm" placeholder="Notes" value={aNotes} onChange={e => setANotes(e.target.value)} rows={2} />
      <div>
        <p className="text-xs text-slate-500 mb-1">Color:</p>
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button key={c} onClick={() => setAColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition ${aColor === c ? "border-slate-800 scale-110" : "border-transparent"}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* Header */}
      <div className="bg-indigo-600 text-white px-4 md:px-8 py-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile sidebar toggle */}
            <button className="md:hidden text-white text-xl" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">🏥 Dr. Calendar</h1>
              <p className="text-indigo-200 text-xs md:text-sm mt-0.5 hidden sm:block">{motivation}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAddPatient(true)}
              className="bg-white text-indigo-600 font-semibold px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm hover:bg-indigo-50 transition">
              + Patient
            </button>
            <button onClick={() => setShowAddApt(true)}
              className="bg-indigo-500 text-white font-semibold px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm hover:bg-indigo-400 transition border border-indigo-400">
              + Appointment
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 md:px-6 py-4">
        {[
          { label: "Today",     value: todayApts,      color: "text-indigo-600" },
          { label: "This Week", value: weekApts,        color: "text-blue-600"   },
          { label: "Completed", value: doneApts,        color: "text-green-600"  },
          { label: "Cancelled", value: cancelledApts,   color: "text-red-500"    },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4 px-4 md:px-6 pb-6 relative">

        {/* Sidebar — mobile overlay or desktop static */}
        <div className={`
          ${sidebarOpen ? "flex" : "hidden"} md:flex
          flex-col w-64 shrink-0
          md:static fixed inset-y-0 left-0 z-40
          bg-slate-50 md:bg-transparent pt-20 md:pt-0
          px-4 md:px-0 shadow-xl md:shadow-none
        `}>
          {/* Close on mobile */}
          <button className="md:hidden self-end text-slate-400 mb-4 text-sm" onClick={() => setSidebarOpen(false)}>✕ Close</button>

          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Patients ({filteredPatients.length})
          </h2>

          {/* Search */}
          <input
            className="border rounded-lg px-3 py-2 text-sm mb-3 w-full bg-white"
            placeholder="🔍 Search patient..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <div className="flex flex-col gap-2 overflow-y-auto max-h-[60vh]">
            {filteredPatients.map(p => (
              <div key={p.id} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
                <p className="font-semibold text-slate-800 text-sm">{p.name}</p>
                {p.condition && (
                  <span className="inline-block mt-1 text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                    {p.condition}
                  </span>
                )}
                {p.phone && <p className="text-xs text-slate-400 mt-1">📞 {p.phone}</p>}
              </div>
            ))}
            {filteredPatients.length === 0 && (
              <p className="text-slate-400 text-sm">No patients found.</p>
            )}
          </div>

          {/* Upcoming appointments */}
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-5 mb-2">
            Upcoming
          </h2>
          <div className="flex flex-col gap-2 overflow-y-auto max-h-40">
            {appointments
              .filter(a => a.date >= today && a.status === "scheduled")
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(0, 5)
              .map(a => (
                <div key={a.id} className="bg-white rounded-xl p-2 shadow-sm border border-slate-100 flex items-center gap-2 cursor-pointer hover:border-indigo-200"
                  onClick={() => openEdit(a)}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{a.patient_name}</p>
                    <p className="text-xs text-slate-400">{a.date} {a.start_time}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Overlay backdrop on mobile */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Calendar */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-2 md:p-4 min-w-0">
          <FullCalendar
            plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={calendarEvents}
            dateClick={(info) => {
              setADate(info.dateStr.split("T")[0]);
              setAStart(info.dateStr.includes("T") ? info.dateStr.split("T")[1].slice(0, 5) : "09:00");
              setShowAddApt(true);
            }}
            eventClick={(info) => {
              const apt = appointments.find(a => String(a.id) === info.event.id);
              if (apt) openEdit(apt);
            }}
            slotMinTime="07:00:00"
            slotMaxTime="20:00:00"
            height="auto"
            nowIndicator={true}
            allDaySlot={false}
          />
        </div>
      </div>

      {/* Modal — Add Patient */}
      {showAddPatient && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">New Patient</h2>
            <div className="flex flex-col gap-3">
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Full Name *" value={pName} onChange={e => setPName(e.target.value)} />
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Phone" value={pPhone} onChange={e => setPPhone(e.target.value)} />
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Condition (e.g. Diabetes)" value={pCondition} onChange={e => setPCondition(e.target.value)} />
              <textarea className="border rounded-lg px-3 py-2 text-sm" placeholder="Notes" value={pNotes} onChange={e => setPNotes(e.target.value)} rows={3} />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={addPatient} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold text-sm hover:bg-indigo-700">Save</button>
              <button onClick={() => setShowAddPatient(false)} className="flex-1 border py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Add / Edit Appointment */}
      {(showAddApt || editApt) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              {editApt ? "Edit Appointment" : "New Appointment"}
            </h2>
            <AptForm />
            <div className="flex gap-3 mt-5">
              <button
                onClick={editApt ? saveEdit : addAppointment}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold text-sm hover:bg-indigo-700">
                {editApt ? "Save Changes" : "Save"}
              </button>
              {editApt && (
                <button onClick={() => { deleteAppointment(editApt.id); setEditApt(null); resetAptForm(); }}
                  className="px-4 border border-red-200 text-red-500 py-2 rounded-lg text-sm hover:bg-red-50">
                  Delete
                </button>
              )}
              <button onClick={() => { setShowAddApt(false); setEditApt(null); resetAptForm(); }}
                className="flex-1 border py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}