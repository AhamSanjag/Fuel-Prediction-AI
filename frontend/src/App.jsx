import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Gauge, Fuel, IndianRupee, Leaf, Activity, Car, Navigation, Info, Save, Weight, Zap } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area, Bar, Line, Legend } from 'recharts';

const App = () => {
  const [catalog, setCatalog] = useState({ vehicles: [], routes: [] });
  const [formData, setFormData] = useState({ vehicle_name: 'Maruti Swift', route_name: 'Bengaluru to Chennai', driving_style: 'Normal', load_weight: 0 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => { axios.get('http://localhost:8000/get-catalog').then(res => setCatalog(res.data)); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setIsLogged(false);
    try {
      const response = await axios.post('http://localhost:8000/predict', formData);
      setResult(response.data);
    } catch (e) { alert("Backend offline!"); }
    setLoading(false);
  };

  const generateTelemetry = () => {
    if (!result) return [];
    const avg = result.predicted_fuel_economy;
    const fuel = result.estimated_fuel_required_liters;
    return [
      { name: 'Idle', economy: avg * 0.6, consumption: fuel * 0.05 },
      { name: 'Acceleration', economy: avg * 0.45, consumption: fuel * 0.3 },
      { name: 'Cruising', economy: avg * 1.25, consumption: fuel * 0.45 },
      { name: 'Arrival', economy: avg * 0.8, consumption: fuel * 0.2 }
    ];
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-12 font-sans tracking-tight">
      <header className="max-w-6xl mx-auto mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4 italic">
          <Activity className="text-blue-500" size={32} />
          <h1 className="text-2xl font-black text-blue-400 uppercase tracking-tighter leading-none">Fuel Economy Prediction</h1>
        </div>
        <div className="bg-slate-900 px-6 py-2 rounded-full text-[10px] font-black text-emerald-400 border border-emerald-500/20 uppercase tracking-widest leading-none">
          Bengaluru Fuel Rate: ₹107.16 / L
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        <section className="lg:col-span-4 bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl h-fit">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Dropdown label="Select Vehicle" icon={<Car size={14}/>} options={catalog.vehicles} onChange={v => setFormData({...formData, vehicle_name: v})} />
            <Dropdown label="Select Route" icon={<Navigation size={14}/>} options={catalog.routes} onChange={r => setFormData({...formData, route_name: r})} />
            <div className="grid grid-cols-2 gap-4">
              <Dropdown label="Mode" options={['Normal', 'Eco', 'Aggressive']} onChange={s => setFormData({...formData, driving_style: s})} />
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2 tracking-widest leading-none"><Weight size={14}/> Load (kg)</label>
                <input type="number" className="w-full bg-slate-800 p-3 rounded-xl border border-slate-700 outline-none text-sm font-bold" 
                  value={formData.load_weight} onChange={e => setFormData({...formData, load_weight: parseFloat(e.target.value) || 0})} />
              </div>
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95 leading-none">
              Calculate Prediction
            </button>
          </form>
        </section>

        <section className="lg:col-span-8 space-y-6">
          {result ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card label="Avg Economy" val={result.predicted_fuel_economy} unit="km/l" icon={<Gauge className="text-blue-400"/>} />
                <Card label="Fuel Required" val={result.estimated_fuel_required_liters} unit="Ltrs" icon={<Fuel className="text-emerald-400"/>} />
                <Card label="Trip Cost" val={`₹${result.estimated_trip_cost.toLocaleString()}`} unit="INR" icon={<IndianRupee className="text-yellow-400"/>} />
                <Card label="CO2 Impact" val={result.co2_emission_kg} unit="kg" icon={<Leaf className="text-red-400"/>} />
              </div>

              <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-inner overflow-hidden">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h3 className="font-bold text-slate-100 uppercase text-xs tracking-[0.2em] flex items-center gap-2 leading-none">
                       <Zap size={14} className="text-yellow-400"/> Multi-Factor Trip Analysis
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest leading-none">Trip Distance: {result.applied_distance} KM</p>
                  </div>
                  <button onClick={() => { axios.post('http://localhost:8000/save-trip', {...formData, ...result}); setIsLogged(true); alert("Trip Logged & AI Retrained!"); }} disabled={isLogged} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase bg-blue-600 text-white leading-none">
                    <Save size={14}/> {isLogged ? 'Model Updated' : 'Log Trip & Retrain'}
                  </button>
                </div>
                
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={generateTelemetry()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={10} axisLine={false} unit=" km/l" />
                      <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px'}} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{fontSize: '10px', textTransform: 'uppercase'}} />
                      <Bar name="Consumption (L)" dataKey="consumption" fill="#1e293b" radius={[4, 4, 0, 0]} barSize={40} />
                      <Line type="monotone" name="Economy Telemetry" dataKey="economy" stroke="#3b82f6" strokeWidth={4} dot={{fill:'#3b82f6'}} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-[3rem] p-20 text-slate-700 text-center uppercase text-[10px] font-black tracking-[0.3em]">
              <Info size={40} className="mb-6 opacity-5" />
              <p>Initialize AI Simulation</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

const Dropdown = ({ label, icon, options, onChange }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 tracking-widest leading-none">{icon} {label}</label>
    <select className="w-full bg-slate-800 p-3.5 rounded-xl border border-slate-700 outline-none text-xs font-bold text-slate-200" onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const Card = ({ label, val, unit, icon }) => (
  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
    <div className="flex justify-between mb-3 text-slate-500 leading-none"><span className="text-[10px] font-black uppercase tracking-widest">{label}</span>{icon}</div>
    <div className="text-2xl font-black leading-none">{val} <span className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-tighter">{unit}</span></div>
  </div>
);

export default App;