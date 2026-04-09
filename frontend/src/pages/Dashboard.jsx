import { useEffect, useState } from "react";
import { useNavigate } from "../lib/router.jsx";
import API from "../services/api";
import { downloadHealthReport } from "../services/reportDownload";

function toCsv(arr) {
  if (!Array.isArray(arr)) return "";
  return arr.join(", ");
}

const Avatar = ({ name }) => {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  return (
    <div style={{
      width: 48, height: 48, borderRadius: "50%",
      background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 600, fontSize: 16, flexShrink: 0,
      fontFamily: "'DM Sans', sans-serif"
    }}>
      {initials}
    </div>
  );
};

const Tag = ({ children, color = "#0ea5e9" }) => (
  <span style={{
    display: "inline-block", padding: "2px 10px",
    background: `${color}18`, color: color,
    borderRadius: 20, fontSize: 12, fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    border: `1px solid ${color}30`
  }}>
    {children}
  </span>
);

const FieldGroup = ({ label, icon, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <label style={{
      fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
      textTransform: "uppercase", color: "#94a3b8",
      display: "flex", alignItems: "center", gap: 5,
      fontFamily: "'DM Sans', sans-serif"
    }}>
      <span style={{ fontSize: 13 }}>{icon}</span> {label}
    </label>
    {children}
  </div>
);

const inputStyle = {
  width: "100%", border: "1.5px solid #e2e8f0",
  borderRadius: 10, padding: "9px 12px", fontSize: 14,
  color: "#1e293b", background: "#f8fafc",
  outline: "none", fontFamily: "'DM Sans', sans-serif",
  boxSizing: "border-box", transition: "border-color 0.15s",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [downloadingReport, setDownloadingReport] = useState(false);

  const [form, setForm] = useState({
    age: "",
    gender: "prefer_not_to_say",
    existingMedicalConditions: "",
    allergies: "",
    medications: "",
  });

  const [whatsappIdInput, setWhatsappIdInput] = useState("");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    async function load() {
      try {
        setLoading(true);
        const [profileRes, historyRes] = await Promise.all([
          API.get("/api/profile/me"),
          API.get("/api/profile/history?limit=30"),
        ]);
        setProfile(profileRes.data.profile);
        setHistory(historyRes.data.messages || []);
        const p = profileRes.data.profile || {};
        setForm({
          age: p.age ?? "",
          gender: p.gender ?? "prefer_not_to_say",
          existingMedicalConditions: toCsv(p.existingMedicalConditions),
          allergies: toCsv(p.allergies),
          medications: toCsv(p.medications),
        });
        setWhatsappIdInput(p.whatsappId ?? "");
      } catch { setError("Failed to load dashboard"); }
      finally { setLoading(false); }
    }
    load();
  }, [navigate, token]);

  const saveProfile = async () => {
    try {
      setError(""); setSuccess("");
      await API.put("/api/profile/me", {
        age: form.age === "" ? undefined : form.age,
        gender: form.gender,
        existingMedicalConditions: form.existingMedicalConditions,
        allergies: form.allergies,
        medications: form.medications,
      });
      const profileRes = await API.get("/api/profile/me");
      setProfile(profileRes.data.profile);
      setSuccess("Profile updated successfully");
      setTimeout(() => setSuccess(""), 2500);
    } catch { setError("Failed to update profile"); }
  };

  const linkWhatsApp = async () => {
    try {
      setError(""); setSuccess("");
      await API.post("/api/profile/link-whatsapp", { whatsappId: whatsappIdInput });
      const profileRes = await API.get("/api/profile/me");
      setProfile(profileRes.data.profile);
      setWhatsappIdInput(profileRes.data.profile?.whatsappId ?? "");
      setSuccess("WhatsApp linked successfully");
      setTimeout(() => setSuccess(""), 2500);
    } catch { setError("Failed to link WhatsApp"); }
  };

  const updateField = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleDownloadReport = async () => {
    try {
      setError("");
      setDownloadingReport(true);
      await downloadHealthReport();
    } catch {
      setError("Unable to download report right now. Please try again.");
    } finally {
      setDownloadingReport(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", flexDirection: "column", gap: 16,
        background: "#f0f9ff", fontFamily: "'DM Sans', sans-serif"
      }}>
        <div style={{
          width: 48, height: 48, border: "3px solid #e0f2fe",
          borderTop: "3px solid #0ea5e9", borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "#64748b", fontSize: 14 }}>Loading your health dashboard...</p>
      </div>
    );
  }

  const genderLabel = {
    male: "Male", female: "Female", other: "Other", prefer_not_to_say: "Not specified"
  }[form.gender] || "—";

  return (
    <div className="hb-premium-page" style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #e0f2fe 0%, #f0fdf4 50%, #fef9c3 100%)",
      fontFamily: "'DM Sans', sans-serif",
      padding: "0 0 48px 0"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet" />

      {/* Top Nav */}
      <nav style={{
        background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e2e8f0", padding: "0 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 64, position: "sticky", top: 0, zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18
          }}>🩺</div>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.3px" }}>
            HealthBot
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {profile && (
            <span style={{ fontSize: 13, color: "#64748b" }}>{profile.email}</span>
          )}
          {profile && <Avatar name={profile.name} />}
        </div>
      </nav>

      {/* Hero greeting */}
      <div style={{ padding: "32px 32px 0", maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{
          fontSize: 28, fontWeight: 700, color: "#0f172a",
          letterSpacing: "-0.5px", margin: "0 0 4px",
          fontFamily: "'DM Serif Display', serif"
        }}>
          Good day, {profile?.name?.split(" ")[0] || "there"} 👋
        </h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: 14 }}>
          Manage your health profile and review your consultation history.
        </p>

        {/* Stat pills */}
        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          {form.age && <Tag color="#0ea5e9">Age {form.age}</Tag>}
          <Tag color="#10b981">{genderLabel}</Tag>
          <Tag color="#f59e0b">{history.length} messages</Tag>
          {profile?.whatsappId && <Tag color="#22c55e">WhatsApp linked</Tag>}
        </div>
      </div>

      {/* Toast notifications */}
      {(success || error) && (
        <div style={{
          maxWidth: 1100, margin: "16px auto 0", padding: "0 32px"
        }}>
          <div style={{
            padding: "12px 16px", borderRadius: 12, fontSize: 14, fontWeight: 500,
            background: success ? "#f0fdf4" : "#fef2f2",
            color: success ? "#16a34a" : "#dc2626",
            border: `1px solid ${success ? "#bbf7d0" : "#fecaca"}`,
            display: "flex", alignItems: "center", gap: 8
          }}>
            <span style={{ fontSize: 16 }}>{success ? "✅" : "⚠️"}</span>
            {success || error}
          </div>
        </div>
      )}

      {/* Main grid */}
      <div style={{
        maxWidth: 1100, margin: "24px auto 0", padding: "0 32px",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20
      }}>

        {/* ─── Health Profile Card ─── */}
        <div className="hb-premium-card" style={{
          background: "#fff", borderRadius: 20,
          border: "1px solid #e2e8f0", padding: "24px",
          display: "flex", flexDirection: "column", gap: 20
        }}>
          {/* Card header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: "#eff6ff", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 16
                }}>🧬</div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  Health Profile
                </h2>
              </div>
              {profile && (
                <p style={{ margin: "4px 0 0 40px", fontSize: 12, color: "#94a3b8" }}>
                  {profile.email}
                </p>
              )}
            </div>
            <button
              onClick={handleDownloadReport}
              disabled={downloadingReport}
              style={{
                padding: "8px 14px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #8b5cf6, #0ea5e9)",
                color: "#fff", fontWeight: 600, fontSize: 13,
                cursor: downloadingReport ? "not-allowed" : "pointer",
                opacity: downloadingReport ? 0.7 : 1,
                fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
                display: "flex", alignItems: "center", gap: 6
              }}
            >
              {downloadingReport ? "⏳ Preparing..." : "📄 Report"}
            </button>
          </div>

          {/* Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FieldGroup label="Age" icon="🎂">
                <input
                  value={form.age}
                  onChange={updateField("age")}
                  placeholder="e.g. 28"
                  type="number"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#0ea5e9")}
                  onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
                />
              </FieldGroup>

              <FieldGroup label="Gender" icon="👤">
                <select
                  value={form.gender}
                  onChange={updateField("gender")}
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#0ea5e9")}
                  onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
                >
                  <option value="prefer_not_to_say">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </FieldGroup>
            </div>

            <FieldGroup label="Medical Conditions" icon="🏥">
              <input
                value={form.existingMedicalConditions}
                onChange={updateField("existingMedicalConditions")}
                placeholder="e.g. Hypertension, Diabetes"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#0ea5e9")}
                onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
              />
            </FieldGroup>

            <FieldGroup label="Allergies" icon="⚠️">
              <input
                value={form.allergies}
                onChange={updateField("allergies")}
                placeholder="e.g. Penicillin, Peanuts"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#f59e0b")}
                onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
              />
            </FieldGroup>

            <FieldGroup label="Current Medications" icon="💊">
              <input
                value={form.medications}
                onChange={updateField("medications")}
                placeholder="e.g. Metformin 500mg"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "#0ea5e9")}
                onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
              />
            </FieldGroup>

            <button
              onClick={saveProfile}
              style={{
                width: "100%", padding: "11px", borderRadius: 12,
                border: "none", background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
                color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", marginTop: 4,
                letterSpacing: "0.01em"
              }}
            >
              Save Profile
            </button>
          </div>

          {/* WhatsApp section */}
          <div style={{
            borderTop: "1px dashed #e2e8f0", paddingTop: 18
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: "#f0fdf4", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: 15
              }}>💬</div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                WhatsApp Integration
              </h3>
              {profile?.whatsappId && (
                <Tag color="#22c55e">Active</Tag>
              )}
            </div>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 10px" }}>
              Link your WhatsApp to receive health updates and chat on the go.
            </p>
            <input
              value={whatsappIdInput}
              onChange={(e) => setWhatsappIdInput(e.target.value)}
              placeholder="e.g. 12345678@c.us"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "#22c55e")}
              onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
            />
            <button
              onClick={linkWhatsApp}
              style={{
                width: "100%", padding: "10px", borderRadius: 12,
                border: "1.5px solid #22c55e", background: "transparent",
                color: "#16a34a", fontWeight: 600, fontSize: 14, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", marginTop: 10
              }}
            >
              {profile?.whatsappId ? "Update WhatsApp" : "Link WhatsApp"}
            </button>
          </div>
        </div>

        {/* ─── Chat History Card ─── */}
        <div className="hb-premium-card" style={{
          background: "#fff", borderRadius: 20,
          border: "1px solid #e2e8f0",
          display: "flex", flexDirection: "column",
          overflow: "hidden", minHeight: 500
        }}>
          {/* Header */}
          <div style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex", alignItems: "center", gap: 10
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: "#eff6ff", display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: 16
            }}>💬</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                Consultation History
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
                {history.length} messages on record
              </p>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "16px 20px",
            display: "flex", flexDirection: "column", gap: 10
          }}>
            {history.length === 0 ? (
              <div style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                color: "#94a3b8", gap: 8, padding: "40px 0"
              }}>
                <div style={{ fontSize: 40 }}>🩺</div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>No consultations yet</p>
                <p style={{ margin: 0, fontSize: 12 }}>Your chat history will appear here.</p>
              </div>
            ) : (
              history.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                    alignItems: "flex-end", gap: 8
                  }}
                >
                  {m.role !== "user" && (
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
                      display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 14, flexShrink: 0
                    }}>🤖</div>
                  )}
                  <div style={{
                    maxWidth: "78%", padding: "10px 14px",
                    borderRadius: m.role === "user"
                      ? "16px 16px 4px 16px"
                      : "16px 16px 16px 4px",
                    background: m.role === "user"
                      ? "linear-gradient(135deg, #0ea5e9, #06b6d4)"
                      : "#f8fafc",
                    color: m.role === "user" ? "#fff" : "#1e293b",
                    fontSize: 13.5, lineHeight: 1.5,
                    border: m.role === "user" ? "none" : "1px solid #e2e8f0"
                  }}>
                    {m.content}
                  </div>
                  {m.role === "user" && (
                    <div style={{ flexShrink: 0 }}>
                      <Avatar name={profile?.name} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div style={{
            padding: "12px 20px", borderTop: "1px solid #f1f5f9",
            background: "#fafafa", display: "flex",
            alignItems: "center", gap: 8
          }}>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              💡 Chat with your health assistant via the main chat interface
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
