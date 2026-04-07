function buildInsights({ role, query, summary }) {
  const q = (query || '').toLowerCase();

  if (role === 'patient') {
    if (q.includes('prevention')) {
      return 'Wear a mask in crowded areas, hydrate, rest, and seek testing if fever + cough persist for 48 hours.';
    }
    return `Current personal context: ${summary.personalRisk}. Follow preventive hygiene and monitor symptoms daily.`;
  }

  if (q.includes('high-risk') || q.includes('area')) {
    return `High-risk regions today: ${summary.highRiskRegions.join(', ') || 'No critical clusters'}. Prioritize rapid testing there.`;
  }

  return `Total cases: ${summary.totalCases}. Active alerts: ${summary.activeAlerts}. Trend is ${summary.trend}.`;
}

module.exports = { buildInsights };
