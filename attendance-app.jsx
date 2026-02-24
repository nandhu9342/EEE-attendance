import { useState, useEffect } from "react";

const SAMPLE_STUDENTS = [
  { id: 1, rollNo: "001", name: "Aarav Sharma" },
  { id: 2, rollNo: "002", name: "Priya Patel" },
  { id: 3, rollNo: "003", name: "Rohan Mehta" },
  { id: 4, rollNo: "004", name: "Sneha Reddy" },
  { id: 5, rollNo: "005", name: "Kiran Nair" },
  { id: 6, rollNo: "006", name: "Arjun Singh" },
];

const todayStr = () => new Date().toISOString().split("T")[0];
const formatDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
const formatShort = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
const AVATAR_COLORS = [["#f59e0b","#fff7e6"],["#10b981","#e6faf4"],["#3b82f6","#e8f0fe"],["#ec4899","#fce8f3"],["#8b5cf6","#ede9fe"],["#f97316","#fff1e6"],["#06b6d4","#e0f9ff"],["#84cc16","#f0fde4"]];
const getColor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length];

export default function App() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [view, setView] = useState("mark");
  const [newStudent, setNewStudent] = useState({ rollNo: "", name: "" });
  const [savedAnim, setSavedAnim] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedDate, setExpandedDate] = useState(null);
  const [flashId, setFlashId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await window.storage.get("att_students");
        const a = await window.storage.get("att_records");
        setStudents(s ? JSON.parse(s.value) : SAMPLE_STUDENTS);
        setAttendance(a ? JSON.parse(a.value) : {});
      } catch { setStudents(SAMPLE_STUDENTS); setAttendance({}); }
    };
    load();
  }, []);

  const persist = async (s, a) => {
    try {
      await window.storage.set("att_students", JSON.stringify(s));
      await window.storage.set("att_records", JSON.stringify(a));
    } catch(e) { console.error(e); }
  };

  const day = attendance[selectedDate] || {};
  const presentCount = Object.values(day).filter(v => v === "present").length;
  const absentCount  = Object.values(day).filter(v => v === "absent").length;
  const unmarked = students.length - presentCount - absentCount;
  const pctToday = (presentCount + absentCount) > 0 ? Math.round(presentCount / (presentCount + absentCount) * 100) : null;

  const mark = (id, status) => {
    const upd = { ...attendance, [selectedDate]: { ...(attendance[selectedDate] || {}), [id]: status } };
    setAttendance(upd);
    setFlashId(id); setTimeout(() => setFlashId(null), 500);
    persist(students, upd);
  };
  const markAll = (status) => {
    const d = {}; students.forEach(s => d[s.id] = status);
    const upd = { ...attendance, [selectedDate]: d };
    setAttendance(upd); persist(students, upd);
  };
  const save = () => { persist(students, attendance); setSavedAnim(true); setTimeout(() => setSavedAnim(false), 2000); };
  const addStudent = () => {
    if (!newStudent.rollNo.trim() || !newStudent.name.trim()) return;
    const upd = [...students, { id: Date.now(), rollNo: newStudent.rollNo.trim(), name: newStudent.name.trim() }];
    setStudents(upd); setNewStudent({ rollNo: "", name: "" }); persist(upd, attendance);
  };
  const removeStudent = (id) => { const upd = students.filter(s => s.id !== id); setStudents(upd); persist(upd, attendance); };
  const getOverall = (id) => {
    const days = Object.values(attendance);
    const marked = days.filter(d => d[id] !== undefined);
    if (!marked.length) return null;
    return Math.round(marked.filter(d => d[id] === "present").length / marked.length * 100);
  };

  const dates = Object.keys(attendance).sort((a, b) => b.localeCompare(a));
  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo.includes(search));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:wght@600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #f5f6fa;
          --surface: #ffffff;
          --surface2: #f9fafb;
          --border: #e5e7eb;
          --text: #111827;
          --text2: #6b7280;
          --text3: #9ca3af;
          --indigo: #4f46e5;
          --indigo-dark: #3730a3;
          --indigo-light: #eef2ff;
          --green: #059669;
          --green-bg: #f0fdf4;
          --green-light: #bbf7d0;
          --red: #dc2626;
          --red-bg: #fff5f5;
          --red-light: #fecaca;
          --amber: #d97706;
          --amber-bg: #fffbeb;
          --r: 16px;
          --r-sm: 10px;
          --shadow-xs: 0 1px 2px rgba(0,0,0,.05);
          --shadow-sm: 0 1px 3px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.04);
          --shadow: 0 4px 16px rgba(0,0,0,.08);
          --shadow-lg: 0 12px 40px rgba(0,0,0,.13);
          --ease: cubic-bezier(.4,0,.2,1);
          --spring: cubic-bezier(.22,1,.36,1);
        }
        body { font-family: 'Outfit', sans-serif; background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; }

        /* ─── LAYOUT ─── */
        .shell { min-height: 100vh; background: var(--bg); background-image: radial-gradient(ellipse 80% 60% at 10% -10%, rgba(79,70,229,.07) 0%, transparent 70%); }
        .header { background: var(--surface); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 200; box-shadow: var(--shadow-sm); }
        .header-in { max-width: 880px; margin: 0 auto; padding: 0 24px; }
        .header-top { display: flex; align-items: center; justify-content: space-between; padding: 16px 0 14px; }
        .brand { display: flex; align-items: center; gap: 12px; }
        .brand-icon { width: 42px; height: 42px; border-radius: 13px; background: linear-gradient(135deg,#4f46e5,#7c3aed); display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 14px rgba(79,70,229,.35); }
        .brand-name { font-family: 'Playfair Display', serif; font-size: 22px; letter-spacing: -.3px; }
        .brand-sub { font-size: 11px; color: var(--text3); font-weight: 500; letter-spacing: .4px; margin-top: 1px; }
        .date-chip { background: var(--surface2); border: 1px solid var(--border); border-radius: 24px; padding: 6px 14px; font-size: 12px; color: var(--text2); font-weight: 600; display: flex; align-items: center; gap: 6px; }
        .tabs { display: flex; gap: 2px; }
        .tab { padding: 10px 16px; border: none; background: transparent; cursor: pointer; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500; color: var(--text2); border-bottom: 2px solid transparent; transition: color .2s var(--ease), border-color .2s var(--ease); white-space: nowrap; }
        .tab:hover { color: var(--indigo); }
        .tab.on { color: var(--indigo); border-bottom-color: var(--indigo); font-weight: 600; }
        .tab-badge { display: inline-flex; align-items: center; justify-content: center; background: var(--indigo-light); color: var(--indigo); font-size: 10px; font-weight: 700; width: 17px; height: 17px; border-radius: 50%; margin-left: 5px; }
        .main { max-width: 880px; margin: 0 auto; padding: 28px 24px 80px; }

        /* ─── PAGE ANIMATION ─── */
        .pg { animation: pgIn .4s var(--spring) both; }
        @keyframes pgIn { from { opacity:0; transform: translateY(18px) } to { opacity:1; transform: translateY(0) } }

        /* ─── STATS ─── */
        .stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-bottom: 22px; }
        .stat { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 18px 20px; box-shadow: var(--shadow-sm); position: relative; overflow: hidden; transition: transform .22s var(--ease), box-shadow .22s var(--ease); }
        .stat::after { content:''; position:absolute; top:0; left:0; right:0; height:3px; border-radius:3px 3px 0 0; }
        .stat:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
        .stat.g::after { background: var(--green); }
        .stat.r::after { background: var(--red); }
        .stat.a::after { background: var(--amber); }
        .stat-n { font-family: 'Playfair Display', serif; font-size: 38px; line-height: 1; }
        .stat.g .stat-n { color: var(--green); }
        .stat.r .stat-n { color: var(--red); }
        .stat.a .stat-n { color: var(--amber); }
        .stat-l { font-size: 11px; color: var(--text3); font-weight: 600; text-transform: uppercase; letter-spacing: .6px; margin-top: 4px; }

        /* ─── PROGRESS ─── */
        .prog-wrap { margin-bottom: 22px; }
        .prog-labels { display: flex; justify-content: space-between; margin-bottom: 7px; font-size: 12px; font-weight: 600; }
        .prog-outer { height: 9px; background: var(--border); border-radius: 99px; overflow: hidden; }
        .prog-inner { height: 100%; border-radius: 99px; transition: width .7s var(--spring); }

        /* ─── CONTROLS ─── */
        .controls { display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 20px; }
        .field-label { font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: .7px; margin-bottom: 5px; }
        input[type="date"] { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--r-sm); color: var(--text); padding: 9px 13px; font-family: 'Outfit',sans-serif; font-size: 13px; font-weight: 500; outline: none; transition: border-color .2s, box-shadow .2s; cursor: pointer; }
        input[type="date"]:focus { border-color: var(--indigo); box-shadow: 0 0 0 3px rgba(79,70,229,.1); }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(35%) sepia(80%) saturate(400%) hue-rotate(200deg); cursor: pointer; opacity: .7; }
        .btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border: none; border-radius: var(--r-sm); font-family: 'Outfit',sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .18s var(--ease); white-space: nowrap; }
        .btn:active { transform: scale(.97); }
        .btn-indigo { background: var(--indigo); color: #fff; box-shadow: 0 2px 8px rgba(79,70,229,.3); }
        .btn-indigo:hover { background: var(--indigo-dark); box-shadow: 0 4px 16px rgba(79,70,229,.4); transform: translateY(-1px); }
        .btn-green { background: var(--green-bg); color: var(--green); border: 1.5px solid rgba(5,150,105,.2); }
        .btn-green:hover { background: var(--green-light); }
        .btn-red { background: var(--red-bg); color: var(--red); border: 1.5px solid rgba(220,38,38,.18); }
        .btn-red:hover { background: var(--red-light); }
        .btn-save { background: var(--indigo); color: #fff; box-shadow: 0 2px 8px rgba(79,70,229,.25); margin-left: auto; }
        .btn-save.done { background: var(--green) !important; animation: savePop .4s ease; }
        @keyframes savePop { 0%{transform:scale(1)} 40%{transform:scale(1.07)} 100%{transform:scale(1)} }

        /* ─── STUDENT CARD ─── */
        .s-list { display: flex; flex-direction: column; gap: 10px; }
        .s-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--r); padding: 14px 18px; display: flex; align-items: center; gap: 14px; box-shadow: var(--shadow-sm); transition: all .22s var(--ease); animation: cardIn .32s var(--spring) both; }
        .s-card:hover { box-shadow: var(--shadow); transform: translateY(-1px); }
        .s-card.p-card { border-color: rgba(5,150,105,.3); background: linear-gradient(to right, #f0fdf4, #fff); }
        .s-card.a-card { border-color: rgba(220,38,38,.22); background: linear-gradient(to right, #fff5f5, #fff); }
        .s-card.flash { animation: flash .45s var(--spring); }
        @keyframes flash { 0%{transform:scale(1)} 30%{transform:scale(1.016); box-shadow:var(--shadow-lg)} 100%{transform:scale(1)} }
        @keyframes cardIn { from { opacity:0; transform: translateX(-14px) } to { opacity:1; transform:translateX(0) } }

        .av { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 17px; flex-shrink: 0; transition: transform .2s var(--spring); }
        .s-card:hover .av { transform: scale(1.08); }
        .s-info { flex: 1; min-width: 0; }
        .s-name { font-size: 14px; font-weight: 600; }
        .s-roll { font-size: 11px; color: var(--text3); font-weight: 500; margin-top: 2px; }
        .s-pct { text-align: center; min-width: 52px; }
        .s-pct-n { font-family: 'Playfair Display', serif; font-size: 21px; line-height: 1; }
        .s-pct-l { font-size: 10px; color: var(--text3); margin-top: 1px; font-weight: 500; }

        /* ─── P/A BUTTONS ─── */
        .mark-btns { display: flex; gap: 6px; }
        .mbtn { width: 46px; height: 40px; border-radius: 9px; border: 2px solid transparent; font-family: 'Outfit',sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: all .16s var(--ease); display: flex; align-items: center; justify-content: center; }
        .mbtn.p { background: var(--green-bg); color: var(--green); border-color: rgba(5,150,105,.18); }
        .mbtn.p:hover { background: var(--green-light); border-color: var(--green); }
        .mbtn.p.on { background: var(--green); color: #fff; border-color: var(--green); box-shadow: 0 3px 10px rgba(5,150,105,.32); transform: scale(1.06); }
        .mbtn.a { background: var(--red-bg); color: var(--red); border-color: rgba(220,38,38,.18); }
        .mbtn.a:hover { background: var(--red-light); border-color: var(--red); }
        .mbtn.a.on { background: var(--red); color: #fff; border-color: var(--red); box-shadow: 0 3px 10px rgba(220,38,38,.28); transform: scale(1.06); }

        /* ─── HISTORY ─── */
        .h-list { display: flex; flex-direction: column; gap: 12px; }
        .h-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--r); overflow: hidden; box-shadow: var(--shadow-sm); transition: box-shadow .22s var(--ease); animation: cardIn .3s var(--spring) both; }
        .h-card:hover { box-shadow: var(--shadow); }
        .h-header { display: flex; align-items: center; gap: 14px; padding: 16px 20px; cursor: pointer; transition: background .18s; user-select: none; }
        .h-header:hover { background: var(--surface2); }
        .h-date-col { flex: 1; }
        .h-date { font-size: 14px; font-weight: 600; }
        .h-subdate { font-size: 11px; color: var(--text3); margin-top: 2px; }
        .h-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .h-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 11px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .h-chip.g { background: var(--green-bg); color: var(--green); }
        .h-chip.r { background: var(--red-bg); color: var(--red); }
        .h-pct { font-family: 'Playfair Display', serif; font-size: 24px; min-width: 56px; text-align: right; }
        .chev { font-size: 11px; color: var(--text3); transition: transform .28s var(--ease); }
        .chev.open { transform: rotate(180deg); }

        /* ─── HISTORY EXPAND ─── */
        .h-detail { border-top: 1px solid var(--border); overflow: hidden; max-height: 0; opacity: 0; transition: max-height .45s var(--ease), opacity .3s var(--ease), padding .3s; padding: 0 20px; }
        .h-detail.open { max-height: 800px; opacity: 1; padding: 18px 20px 22px; }
        .detail-sec-title { font-size: 11px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
        .detail-sec-title.g { color: var(--green); }
        .detail-sec-title.r { color: var(--red); }
        .chip-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
        .chip-grid:last-child { margin-bottom: 0; }
        .d-chip { display: flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 24px; font-size: 12px; font-weight: 500; animation: chipPop .28s var(--spring) both; }
        @keyframes chipPop { from { opacity:0; transform:scale(.82) } to { opacity:1; transform:scale(1) } }
        .d-chip.g { background: var(--green-bg); color: var(--green); border: 1px solid rgba(5,150,105,.18); }
        .d-chip.r { background: var(--red-bg); color: var(--red); border: 1px solid rgba(220,38,38,.14); }
        .chip-av { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }
        .chip-roll { opacity: .55; font-size: 11px; }

        /* ─── STUDENTS TAB ─── */
        .add-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--r); padding: 22px 24px; box-shadow: var(--shadow-sm); margin-bottom: 20px; }
        .add-title { font-size: 12px; font-weight: 700; color: var(--text2); text-transform: uppercase; letter-spacing: .8px; margin-bottom: 14px; }
        .add-row { display: flex; gap: 10px; flex-wrap: wrap; }
        .ifield { background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--r-sm); color: var(--text); padding: 10px 14px; font-family: 'Outfit',sans-serif; font-size: 13px; font-weight: 500; outline: none; transition: border-color .2s, box-shadow .2s; }
        .ifield:focus { border-color: var(--indigo); box-shadow: 0 0 0 3px rgba(79,70,229,.1); background: var(--surface); }
        .ifield::placeholder { color: var(--text3); }
        .search-wrap { position: relative; margin-bottom: 16px; }
        .search-wrap::before { content: '🔍'; position: absolute; left: 13px; top: 50%; transform: translateY(-50%); font-size: 13px; pointer-events: none; }
        .search-field { width: 100%; padding-left: 36px !important; }
        .sm-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--r); padding: 14px 18px; display: flex; align-items: center; gap: 14px; box-shadow: var(--shadow-sm); transition: all .2s var(--ease); animation: cardIn .28s var(--spring) both; }
        .sm-card:hover { box-shadow: var(--shadow); transform: translateY(-1px); }
        .del-btn { width: 34px; height: 34px; border-radius: 8px; background: var(--red-bg); border: 1px solid rgba(220,38,38,.15); color: var(--red); cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; transition: all .18s var(--ease); flex-shrink: 0; }
        .del-btn:hover { background: var(--red-light); transform: scale(1.1); }

        /* ─── MISC ─── */
        .sec-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .sec-title { font-family: 'Playfair Display', serif; font-size: 22px; }
        .sec-sub { font-size: 13px; color: var(--text3); }
        .empty { text-align: center; padding: 64px 24px; color: var(--text3); font-size: 14px; }
        .empty-icon { font-size: 48px; margin-bottom: 14px; opacity: .45; }

        @media (max-width: 580px) {
          .header-in, .main { padding-left: 14px; padding-right: 14px; }
          .stats { gap: 10px; }
          .stat-n { font-size: 30px; }
          .brand-name { font-size: 19px; }
          .tab { padding: 10px 12px; font-size: 12px; }
        }
      `}</style>

      <div className="shell">
        {/* ── HEADER ── */}
        <header className="header">
          <div className="header-in">
            <div className="header-top">
              <div className="brand">
                <div className="brand-icon">📚</div>
                <div>
                  <div className="brand-name">Attenance</div>
                  <div className="brand-sub">EEE Student Attendance Manager</div>
                </div>
              </div>
              <div className="date-chip">📅 {formatShort(todayStr())}</div>
            </div>
            <nav className="tabs">
              {[
                { key:"mark", label:"Mark Attendance", icon:"✏️", badge: unmarked > 0 ? unmarked : null },
                { key:"history", label:"History", icon:"📋", badge: dates.length || null },
                { key:"students", label:"Students", icon:"👥", badge: students.length },
              ].map(t => (
                <button key={t.key} className={`tab${view === t.key ? " on" : ""}`} onClick={() => setView(t.key)}>
                  {t.icon} {t.label}
                  {t.badge != null && <span className="tab-badge">{t.badge}</span>}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main className="main">

          {/* ──── MARK ATTENDANCE ──── */}
          {view === "mark" && (
            <div className="pg">
              {/* Stats */}
              <div className="stats">
                {[
                  { cls:"g", n: presentCount, l:"Present" },
                  { cls:"r", n: absentCount, l:"Absent" },
                  { cls:"a", n: unmarked, l:"Unmarked" },
                ].map(({ cls, n, l }) => (
                  <div key={l} className={`stat ${cls}`}>
                    <div className="stat-n">{n}</div>
                    <div className="stat-l">{l}</div>
                  </div>
                ))}
              </div>

              {/* Progress */}
              {pctToday !== null && (
                <div className="prog-wrap">
                  <div className="prog-labels">
                    <span style={{ color:"var(--text2)" }}>Today's Rate</span>
                    <span style={{ color: pctToday>=75?"var(--green)":pctToday>=50?"var(--amber)":"var(--red)", fontWeight:700 }}>{pctToday}%</span>
                  </div>
                  <div className="prog-outer">
                    <div className="prog-inner" style={{
                      width:`${pctToday}%`,
                      background: pctToday>=75 ? "linear-gradient(90deg,#059669,#34d399)"
                        : pctToday>=50 ? "linear-gradient(90deg,#d97706,#fbbf24)"
                        : "linear-gradient(90deg,#dc2626,#f87171)"
                    }} />
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="controls">
                <div>
                  <div className="field-label">Date</div>
                  <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                </div>
                <button className="btn btn-green" onClick={() => markAll("present")}>✓ All Present</button>
                <button className="btn btn-red" onClick={() => markAll("absent")}>✗ All Absent</button>
                <button className={`btn btn-save${savedAnim ? " done" : ""}`} onClick={save}>
                  {savedAnim ? "✓ Saved!" : "💾 Save"}
                </button>
              </div>

              {/* Student list */}
              <div className="s-list">
                {students.length === 0 && (
                  <div className="empty"><div className="empty-icon">👥</div>No students yet. Add them in the Students tab.</div>
                )}
                {students.map((s, i) => {
                  const status = day[s.id];
                  const pct = getOverall(s.id);
                  const [bg, fg] = getColor(s.id);
                  return (
                    <div
                      key={s.id}
                      className={`s-card${status==="present"?" p-card":status==="absent"?" a-card":""}${flashId===s.id?" flash":""}`}
                      style={{ animationDelay:`${i*.04}s` }}
                    >
                      <div className="av" style={{ background:bg, color:fg }}>{s.name[0].toUpperCase()}</div>
                      <div className="s-info">
                        <div className="s-name">{s.name}</div>
                        <div className="s-roll">Roll No. {s.rollNo}</div>
                      </div>
                      {pct !== null && (
                        <div className="s-pct">
                          <div className="s-pct-n" style={{ color: pct>=75?"var(--green)":pct>=50?"var(--amber)":"var(--red)" }}>{pct}%</div>
                          <div className="s-pct-l">Overall</div>
                        </div>
                      )}
                      <div className="mark-btns">
                        <button className={`mbtn p${status==="present"?" on":""}`} onClick={() => mark(s.id,"present")}>P</button>
                        <button className={`mbtn a${status==="absent"?" on":""}`} onClick={() => mark(s.id,"absent")}>A</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ──── HISTORY ──── */}
          {view === "history" && (
            <div className="pg">
              <div className="sec-header">
                <h2 className="sec-title">Attendance History</h2>
                <span className="sec-sub">{dates.length} day{dates.length!==1?"s":""} recorded</span>
              </div>
              {dates.length === 0 && (
                <div className="empty"><div className="empty-icon">📋</div>No attendance records yet.</div>
              )}
              <div className="h-list">
                {dates.map((date, i) => {
                  const rec = attendance[date];
                  const presentStudents = students.filter(s => rec[s.id] === "present");
                  const absentStudents  = students.filter(s => rec[s.id] === "absent");
                  const pCount = presentStudents.length, aCount = absentStudents.length;
                  const pct = (pCount+aCount)>0 ? Math.round(pCount/(pCount+aCount)*100) : 0;
                  const open = expandedDate === date;
                  return (
                    <div key={date} className="h-card" style={{ animationDelay:`${i*.05}s` }}>
                      <div className="h-header" onClick={() => setExpandedDate(open ? null : date)}>
                        <div className="h-date-col">
                          <div className="h-date">{formatDate(date)}</div>
                          <div className="h-subdate">{date}</div>
                        </div>
                        <div className="h-right">
                          <span className="h-chip g">✓ {pCount} Present</span>
                          <span className="h-chip r">✗ {aCount} Absent</span>
                          <div className="h-pct" style={{ color: pct>=75?"var(--green)":pct>=50?"var(--amber)":"var(--red)" }}>{pct}%</div>
                          <span className={`chev${open?" open":""}`}>▼</span>
                        </div>
                      </div>

                      {/* Expandable detail */}
                      <div className={`h-detail${open?" open":""}`}>
                        {/* Present */}
                        {presentStudents.length > 0 && (
                          <>
                            <div className="detail-sec-title g">
                              ✅ Present — {presentStudents.length} student{presentStudents.length!==1?"s":""}
                            </div>
                            <div className="chip-grid">
                              {presentStudents.map((s, j) => {
                                const [bg, fg] = getColor(s.id);
                                return (
                                  <div key={s.id} className="d-chip g" style={{ animationDelay:`${j*.03}s` }}>
                                    <div className="chip-av" style={{ background:bg, color:fg }}>{s.name[0]}</div>
                                    <span>{s.name}</span>
                                    <span className="chip-roll">#{s.rollNo}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                        {/* Absent */}
                        {absentStudents.length > 0 && (
                          <>
                            <div className="detail-sec-title r">
                              ❌ Absent — {absentStudents.length} student{absentStudents.length!==1?"s":""}
                            </div>
                            <div className="chip-grid">
                              {absentStudents.map((s, j) => {
                                const [bg, fg] = getColor(s.id);
                                return (
                                  <div key={s.id} className="d-chip r" style={{ animationDelay:`${j*.03}s` }}>
                                    <div className="chip-av" style={{ background:bg, color:fg }}>{s.name[0]}</div>
                                    <span>{s.name}</span>
                                    <span className="chip-roll">#{s.rollNo}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                        {pCount===0 && aCount===0 && (
                          <div style={{ color:"var(--text3)", fontSize:"13px" }}>No students were marked this day.</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ──── STUDENTS ──── */}
          {view === "students" && (
            <div className="pg">
              <div className="sec-header">
                <h2 className="sec-title">Student Management</h2>
                <span className="sec-sub">{students.length} enrolled</span>
              </div>

              <div className="add-card">
                <div className="add-title">Add New Student</div>
                <div className="add-row">
                  <input className="ifield" placeholder="Roll No." value={newStudent.rollNo}
                    onChange={e => setNewStudent(n=>({...n, rollNo:e.target.value}))}
                    style={{ width:"110px" }} />
                  <input className="ifield" placeholder="Full Name" value={newStudent.name}
                    onChange={e => setNewStudent(n=>({...n, name:e.target.value}))}
                    onKeyDown={e => e.key==="Enter" && addStudent()}
                    style={{ flex:1, minWidth:"180px" }} />
                  <button className="btn btn-indigo" onClick={addStudent}>+ Add Student</button>
                </div>
              </div>

              <div className="search-wrap">
                <input className="ifield search-field" placeholder="Search by name or roll number…"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>

              <div className="s-list">
                {filteredStudents.length === 0 && (
                  <div className="empty"><div className="empty-icon">🔍</div>No students found.</div>
                )}
                {filteredStudents.map((s, i) => {
                  const pct = getOverall(s.id);
                  const totalD = Object.values(attendance).filter(d => d[s.id] !== undefined).length;
                  const presD  = Object.values(attendance).filter(d => d[s.id] === "present").length;
                  const [bg, fg] = getColor(s.id);
                  return (
                    <div key={s.id} className="sm-card" style={{ animationDelay:`${i*.04}s` }}>
                      <div className="av" style={{ background:bg, color:fg }}>{s.name[0].toUpperCase()}</div>
                      <div className="s-info">
                        <div className="s-name">{s.name}</div>
                        <div className="s-roll">Roll No. {s.rollNo}</div>
                      </div>
                      {pct !== null && (
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"21px", color: pct>=75?"var(--green)":pct>=50?"var(--amber)":"var(--red)" }}>{pct}%</div>
                          <div style={{ fontSize:"11px", color:"var(--text3)" }}>{presD}/{totalD} days</div>
                        </div>
                      )}
                      <button className="del-btn" onClick={() => removeStudent(s.id)} title="Remove">✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </main>
      </div>
    </>
  );
}
