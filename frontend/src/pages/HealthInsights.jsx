import { useEffect, useState } from "react";
import API from "../services/api";
import { downloadHealthReport } from "../services/reportDownload";

export default function HealthInsightsPreview() {
    const [insights, setInsights] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingReport, setDownloadingReport] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const [insightsRes, historyRes] = await Promise.all([
                    API.get("/api/health/insights"),
                    API.get("/api/health/history"),
                ]);
                setInsights(insightsRes.data.insights);
                setSessions((historyRes.data.history || []).slice(0, 3));
            } catch {
                setError("Failed to load health insights. Please log in and try again.");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

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
                minHeight: "60vh", display: "flex", alignItems: "center",
                justifyContent: "center", fontFamily: "'DM Sans', sans-serif"
            }}>
                <p style={{ color: "#64748b", fontSize: 14 }}>Loading health insights...</p>
            </div>
        );
    }

    return (
        <div className="hb-premium-page" style={{
            maxWidth: 800, margin: "32px auto", padding: "0 24px",
            fontFamily: "'DM Sans', sans-serif"
        }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                Health Insights
            </h1>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
                AI-generated insights based on your chat history.
            </p>

            {error && (
                <div style={{
                    padding: "12px 16px", borderRadius: 12, fontSize: 14,
                    background: "#fef2f2", color: "#dc2626",
                    border: "1px solid #fecaca", marginBottom: 16
                }}>{error}</div>
            )}

            {/* AI Insights */}
            {insights ? (
                <div className="hb-premium-card" style={{
                    background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0",
                    padding: "20px 24px", marginBottom: 24, whiteSpace: "pre-wrap",
                    lineHeight: 1.7, fontSize: 14, color: "#1e293b"
                }}>
                    {insights}
                </div>
            ) : (
                <div style={{
                    background: "#f8fafc", borderRadius: 16, border: "1px solid #e2e8f0",
                    padding: "20px 24px", marginBottom: 24, textAlign: "center",
                    color: "#94a3b8", fontSize: 14
                }}>
                    No data yet. Start chatting to generate insights.
                </div>
            )}

            {/* Recent Sessions */}
            {sessions.length > 0 && (
                <>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
                        Recent Conversations
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {sessions.map((session, i) => {
                            const userMsgs = session.filter(m => m.role === "user");
                            const preview = userMsgs.length > 0 ? userMsgs[0].content : "Conversation";
                            const date = session[0]?.createdAt
                                ? new Date(session[0].createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                                : "";
                            return (
                                <div key={i} className="hb-premium-card" style={{
                                    background: "#fff", borderRadius: 12,
                                    border: "1px solid #e2e8f0", padding: "12px 16px",
                                }}>
                                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#1e293b" }}>
                                        {preview.length > 80 ? preview.slice(0, 80) + "..." : preview}
                                    </p>
                                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>
                                        {date} &middot; {session.length} messages
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Download Report */}
            <button
                onClick={handleDownloadReport}
                disabled={downloadingReport}
                style={{
                    marginTop: 24, width: "100%", padding: "12px",
                    borderRadius: 12, border: "none",
                    background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
                    color: "#fff", fontWeight: 600, fontSize: 14,
                    cursor: downloadingReport ? "not-allowed" : "pointer",
                    opacity: downloadingReport ? 0.7 : 1,
                    fontFamily: "'DM Sans', sans-serif"
                }}
            >
                {downloadingReport ? "Preparing report..." : "Download Health Report (PDF)"}
            </button>
        </div>
    );
}
