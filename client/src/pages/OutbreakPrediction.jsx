import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import StatCard from '../components/StatCard';

const forecast = [
  { day: 'Day 1', lower: 560, predicted: 580, upper: 610 },
  { day: 'Day 2', lower: 610, predicted: 630, upper: 670 },
  { day: 'Day 3', lower: 660, predicted: 690, upper: 730 },
  { day: 'Day 4', lower: 690, predicted: 720, upper: 760 },
  { day: 'Day 5', lower: 720, predicted: 750, upper: 800 },
  { day: 'Day 6', lower: 740, predicted: 780, upper: 830 },
  { day: 'Day 7', lower: 760, predicted: 810, upper: 860 },
];

const featureImportance = [
  { feature: 'Population Density', score: 92 },
  { feature: 'Temperature', score: 68 },
  { feature: 'Historical Trends', score: 49 },
  { feature: 'Vaccination Rate', score: 38 },
];

export default function OutbreakPrediction() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-5xl font-bold">AI-Powered Outbreak Prediction</h2>
        <p className="text-slate-500 text-2xl">Machine learning models for early disease outbreak detection</p>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Overall Accuracy" value="87.2%" subtitle="↑ 2.3% vs last month" accent="text-emerald-600" />
        <StatCard title="Precision Score" value="84.1%" subtitle="True positives rate" />
        <StatCard title="Recall Score" value="89.3%" subtitle="Outbreak detection rate" />
        <StatCard title="F1 Score" value="86.5%" subtitle="Balanced performance" />
      </div>
      <div className="grid xl:grid-cols-2 gap-4">
        <div className="card p-5 h-[420px]">
          <h3 className="text-3xl font-semibold mb-4">7-Day Outbreak Forecast (Metro North - Influenza)</h3>
          <ResponsiveContainer>
            <LineChart data={forecast}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis /><Tooltip /><Line type="monotone" dataKey="predicted" stroke="#2563eb" /><Line type="monotone" dataKey="upper" stroke="#ef4444" strokeDasharray="3 4" /><Line type="monotone" dataKey="lower" stroke="#f59e0b" strokeDasharray="3 4" /></LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5 h-[420px]">
          <h3 className="text-3xl font-semibold mb-4">Feature Importance Analysis</h3>
          <ResponsiveContainer>
            <BarChart layout="vertical" data={featureImportance}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="feature" type="category" width={130} /><Tooltip /><Bar dataKey="score" fill="#8b5cf6" /></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
