export default function SystemArchitecture() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-5xl font-bold">System Architecture</h2>
        <p className="text-slate-500 text-2xl">Scalable cloud-ready architecture and deployment strategy</p>
      </div>
      <div className="card p-6 space-y-4 text-lg">
        <p><strong>Data Ingestion:</strong> Hospitals/EHR, wearables, weather APIs, and public datasets through secure API gateway.</p>
        <p><strong>Processing:</strong> ETL normalization, anonymization, feature engineering, and quality validation pipeline.</p>
        <p><strong>AI Layer:</strong> FastAPI microservice serving classification and time-series forecasting models.</p>
        <p><strong>Serving:</strong> Node.js orchestration API, Redis-ready cache layer, and MongoDB Atlas storage.</p>
        <p><strong>Observability:</strong> Health checks, central logs, and containerized deployment for horizontal scaling.</p>
      </div>
    </div>
  );
}
