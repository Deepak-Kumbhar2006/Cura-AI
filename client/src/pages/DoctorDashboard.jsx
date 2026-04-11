import { useMemo } from 'react';
import { Activity, HeartPulse, ShieldAlert, Skull, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import StatCard from '../components/dashboard/StatCard';
import TrendChart from '../components/dashboard/charts/TrendChart';
import DonutChart from '../components/dashboard/charts/DonutChart';
import AgeBarChart from '../components/dashboard/charts/AgeBarChart';
import PredictionChart from '../components/dashboard/charts/PredictionChart';
import Alerts from '../components/dashboard/Alerts';
import RiskMap from '../components/dashboard/Map/RiskMap';
import AIInsights from '../components/dashboard/AIInsights';
import LiveFeed from '../components/dashboard/LiveFeed';

const trendData = [
  { time: '01:00', newCases: 90000, totalCases: 40000 },
  { time: '03:00', newCases: 120000, totalCases: 60000 },
  { time: '06:00', newCases: 210000, totalCases: 90000 },
  { time: '09:00', newCases: 180000, totalCases: 135000 },
  { time: '12:00', newCases: 195000, totalCases: 170000 },
  { time: '15:00', newCases: 230000, totalCases: 205000 },
  { time: '18:00', newCases: 265000, totalCases: 235000 },
  { time: '21:00', newCases: 300000, totalCases: 275000 },
];

const diseaseData = [
  { name: 'COVID-19', value: 68.5 },
  { name: 'Influenza', value: 12.3 },
  { name: 'Dengue', value: 8.7 },
  { name: 'Malaria', value: 5.1 },
  { name: 'Others', value: 5.4 },
];

const ageData = [
  { group: '0-17', value: 12000 },
  { group: '18-29', value: 18000 },
  { group: '30-49', value: 26000 },
  { group: '50-64', value: 30000 },
  { group: '65+', value: 20000 },
];

const predictionData = [
  { date: 'Apr 20', current: 430, predicted: 420 },
  { date: 'Apr 23', current: 310, predicted: 300 },
  { date: 'Apr 26', current: 250, predicted: 240 },
  { date: 'Apr 29', current: 210, predicted: 200 },
  { date: 'May 02', current: 180, predicted: 170 },
  { date: 'May 05', current: 150, predicted: 135 },
  { date: 'May 08', current: 110, predicted: 98 },
];

const statCards = [
  { title: 'Total Cases', value: '4,46,40,738', trend: '+2.4% vs yesterday', icon: Activity },
  { title: 'Current Deaths', value: '247', trend: '-1.2% vs yesterday', icon: Skull },
  { title: 'Active Cases', value: '0', trend: '+0.0% stable', icon: HeartPulse },
  { title: 'Recovery Rate', value: '70%', trend: '+3.8%', icon: TrendingUp, ring: true },
  { title: 'High Risk Regions', value: '12', trend: '+2 new', icon: ShieldAlert },
];

export default function DoctorDashboard() {
  const motionContainer = useMemo(() => ({
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  }), []);

  return (
    <div className="space-y-4">
      <section>
        <h1 className="text-4xl font-bold dashboard-text">Global Health Surveillance <span className="text-sm ml-2 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300">LIVE · 24/7</span></h1>
        <p className="dashboard-muted mt-1">Real-time epidemic monitoring with AI-powered intelligence</p>
      </section>

      <motion.div variants={motionContainer} initial="hidden" animate="show" className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {statCards.map((card) => (
          <motion.div key={card.title} variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}>
            <StatCard {...card} />
          </motion.div>
        ))}
      </motion.div>

      <div className="grid xl:grid-cols-[2fr_1fr_300px] gap-4">
        <TrendChart data={trendData} />
        <DonutChart data={diseaseData} />
        <Alerts />
      </div>

      <div className="grid xl:grid-cols-[1fr_1fr_1.2fr_320px] gap-4">
        <AgeBarChart data={ageData} />
        <PredictionChart data={predictionData} />
        <RiskMap />
        <AIInsights />
      </div>

      <div className="grid xl:grid-cols-3 gap-4">
        <LiveFeed />
        <div className="dashboard-glass rounded-2xl p-4 xl:col-span-2">
          <h3 className="font-semibold dashboard-text mb-2">Scenario Compare (A vs B)</h3>
          <div className="h-24 rounded-xl bg-gradient-to-r from-fuchsia-500/20 via-cyan-400/10 to-emerald-400/20 border border-white/10" />
        </div>
      </div>
    </div>
  );
}
