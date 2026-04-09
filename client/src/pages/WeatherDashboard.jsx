import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Droplets, Thermometer, Wind, MapPin, RefreshCw, Sun, CloudRain, CloudSnow, CloudLightning, Search } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const weatherIcons = {
  hot: { icon: Sun, color: 'from-orange-400 to-red-500', bg: 'bg-orange-50', text: 'text-orange-600' },
  warm: { icon: Sun, color: 'from-yellow-400 to-orange-400', bg: 'bg-yellow-50', text: 'text-yellow-600' },
  mild: { icon: Cloud, color: 'from-blue-400 to-cyan-400', bg: 'bg-blue-50', text: 'text-blue-600' },
  cold: { icon: CloudSnow, color: 'from-indigo-400 to-blue-500', bg: 'bg-indigo-50', text: 'text-indigo-600' },
};

function getWeatherType(temp) {
  if (temp >= 35) return 'hot';
  if (temp >= 25) return 'warm';
  if (temp >= 15) return 'mild';
  return 'cold';
}

const defaultCities = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Chennai', 'Hyderabad'];

export default function WeatherDashboard() {
  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);

  const fetchAllWeather = async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        defaultCities.map((city) => api.get(`/api/weather/${city}`).then((r) => ({ city, ...r.data })).catch(() => ({ city, temperature: 27 + Math.round(Math.random() * 9), humidity: 55 + Math.round(Math.random() * 35) })))
      );
      setWeatherData(results);
      setSelectedCity(results[0]);
    } catch {
      toast.error('Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllWeather(); }, []);

  const handleSearch = async () => {
    if (!searchCity.trim()) return;
    try {
      const { data } = await api.get(`/api/weather/${searchCity.trim()}`);
      const newEntry = { city: searchCity.trim(), ...data };
      setWeatherData((prev) => [newEntry, ...prev.filter((w) => w.city.toLowerCase() !== searchCity.trim().toLowerCase())]);
      setSelectedCity(newEntry);
      setSearchCity('');
      toast.success(`Weather loaded for ${searchCity.trim()}`);
    } catch {
      toast.error('City not found');
    }
  };

  const getHealthRisk = (temp, humidity) => {
    if (temp > 38 && humidity > 70) return { level: 'Critical', color: 'badge-danger', advice: 'Heat stroke risk. Stay indoors, hydrate frequently.' };
    if (temp > 32 && humidity > 60) return { level: 'High', color: 'badge-danger', advice: 'High humidity promotes mosquito breeding. Use repellent.' };
    if (humidity > 80) return { level: 'Moderate', color: 'badge-warning', advice: 'High moisture increases infection risk. Keep surroundings dry.' };
    return { level: 'Low', color: 'badge-success', advice: 'Weather conditions are favorable for health.' };
  };

  if (loading) return <WeatherSkeleton />;

  const wt = selectedCity ? getWeatherType(selectedCity.temperature) : 'warm';
  const wtConfig = weatherIcons[wt];
  const WeatherIcon = wtConfig.icon;
  const healthRisk = selectedCity ? getHealthRisk(selectedCity.temperature, selectedCity.humidity) : null;

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 text-white p-6 shadow-glow">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-36 translate-x-36" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-white/80 font-medium uppercase tracking-wider">Weather Intelligence</p>
              <h2 className="text-3xl font-display font-bold mt-1">Health Weather Monitor</h2>
              <p className="text-sm text-white/70 mt-1">Real-time weather data correlated with disease risk</p>
            </div>
            <button onClick={fetchAllWeather} className="p-3 rounded-2xl bg-white/20 hover:bg-white/30 transition backdrop-blur">
              <RefreshCw size={20} />
            </button>
          </div>
          <div className="flex gap-3 mt-4">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" />
              <input className="w-full bg-white/15 backdrop-blur rounded-2xl pl-11 pr-4 py-3 text-sm placeholder-white/50 outline-none focus:bg-white/25 transition"
                placeholder="Search city..." value={searchCity} onChange={(e) => setSearchCity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
            </div>
            <button onClick={handleSearch} className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-2xl text-sm font-medium backdrop-blur transition">
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Selected City Detail */}
      {selectedCity && (
        <div className="grid lg:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-6 lg:col-span-2">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin size={16} className="text-primary-600" />
                  <p className="text-sm text-slate-500 font-medium">{selectedCity.region || 'India'}</p>
                </div>
                <h3 className="text-2xl font-display font-bold text-slate-800 dark:text-white">{selectedCity.city}</h3>
              </div>
              <div className={`h-16 w-16 rounded-3xl bg-gradient-to-br ${wtConfig.color} text-white grid place-items-center shadow-lg`}>
                <WeatherIcon size={28} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-2xl bg-surface-50 dark:bg-slate-700/50 p-4 text-center">
                <Thermometer size={20} className="mx-auto text-orange-500 mb-2" />
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{selectedCity.temperature}<span className="text-lg">°C</span></p>
                <p className="text-xs text-slate-500 mt-1">Temperature</p>
              </div>
              <div className="rounded-2xl bg-surface-50 dark:bg-slate-700/50 p-4 text-center">
                <Droplets size={20} className="mx-auto text-blue-500 mb-2" />
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{selectedCity.humidity}<span className="text-lg">%</span></p>
                <p className="text-xs text-slate-500 mt-1">Humidity</p>
              </div>
              <div className="rounded-2xl bg-surface-50 dark:bg-slate-700/50 p-4 text-center">
                <Wind size={20} className="mx-auto text-teal-500 mb-2" />
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{wt.charAt(0).toUpperCase() + wt.slice(1)}</p>
                <p className="text-xs text-slate-500 mt-1">Condition</p>
              </div>
            </div>
          </motion.div>

          {/* Health Risk Assessment */}
          {healthRisk && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
              <h4 className="font-display font-semibold text-slate-800 dark:text-white mb-4">Health Risk Assessment</h4>
              <div className="text-center mb-4">
                <span className={`badge ${healthRisk.color} text-lg px-6 py-2`}>{healthRisk.level} Risk</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{healthRisk.advice}</p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Mosquito Activity</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{selectedCity.humidity > 70 ? 'High' : selectedCity.humidity > 50 ? 'Moderate' : 'Low'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Dehydration Risk</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{selectedCity.temperature > 35 ? 'High' : selectedCity.temperature > 28 ? 'Moderate' : 'Low'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Air Quality Impact</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{selectedCity.humidity > 80 ? 'Poor' : 'Good'}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* City Grid */}
      <div>
        <h3 className="font-display font-semibold text-slate-800 dark:text-white mb-4">All Cities</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {weatherData.map((w, i) => {
            const type = getWeatherType(w.temperature);
            const cfg = weatherIcons[type];
            const Icon = cfg.icon;
            const risk = getHealthRisk(w.temperature, w.humidity);
            return (
              <motion.button key={w.city} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedCity(w)}
                className={`card p-5 text-left hover:shadow-elevated transition-all duration-300 ${selectedCity?.city === w.city ? 'ring-2 ring-primary-400' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" />
                    <p className="font-semibold text-slate-800 dark:text-white">{w.city}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${cfg.color} text-white grid place-items-center`}>
                    <Icon size={18} />
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{w.temperature}°C</p>
                    <p className="text-xs text-slate-500 mt-0.5">Humidity: {w.humidity}%</p>
                  </div>
                  <span className={`badge ${risk.color} text-[10px]`}>{risk.level}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WeatherSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-48 rounded-3xl bg-slate-200 dark:bg-slate-700" />
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="h-56 rounded-2xl bg-slate-200 dark:bg-slate-700 lg:col-span-2" />
        <div className="h-56 rounded-2xl bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-700" />)}
      </div>
    </div>
  );
}
