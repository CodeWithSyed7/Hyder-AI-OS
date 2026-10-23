
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Activity, Brain, Target, TrendingUp } from 'lucide-react';

const productivityData = [
  { name: 'Mon', value: 40 },
  { name: 'Tue', value: 70 },
  { name: 'Wed', value: 65 },
  { name: 'Thu', value: 90 },
  { name: 'Fri', value: 85 },
  { name: 'Sat', value: 30 },
  { name: 'Sun', value: 50 },
];

const moodData = [
  { name: 'Focused', count: 12, color: '#38bdf8' },
  { name: 'Creative', count: 18, color: '#a855f7' },
  { name: 'Analytical', count: 8, color: '#22d3ee' },
  { name: 'Zen', count: 15, color: '#4ade80' },
];

const AnalyticsHub: React.FC = () => {
  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8 overflow-y-auto custom-scrollbar h-full min-h-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 sm:gap-0">
        <div>
          <h2 className="text-[clamp(18px,1.6vw,28px)] font-orbitron text-cyan-400">ANALYTICS HUB</h2>
          <p className="text-slate-400 font-mono text-[clamp(9px,0.7vw,12px)] tracking-widest mt-1">NEURAL_PERFORMANCE_METRICS</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="glass px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-slate-800 text-[clamp(10px,0.75vw,12px)]">
            <span className="text-slate-500">Uptime:</span> <span className="text-cyan-400 font-mono">142h 12m</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {[
          { label: 'Neural Efficiency', val: '94.2%', icon: Brain, color: 'text-cyan-400' },
          { label: 'Project Momentum', val: 'High', icon: Target, color: 'text-purple-400' },
          { label: 'System Health', val: 'Stable', icon: Activity, color: 'text-green-400' },
          { label: 'Growth Trend', val: '+12%', icon: TrendingUp, color: 'text-blue-400' }
        ].map((stat, i) => (
          <div key={i} className="glass p-3.5 sm:p-5 lg:p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[clamp(8px,0.55vw,10px)] font-orbitron text-slate-500 uppercase tracking-widest mb-1">{stat.label}</div>
              <div className={`text-[clamp(16px,1.3vw,24px)] font-bold ${stat.color}`}>{stat.val}</div>
            </div>
            <div className={`p-2.5 sm:p-3 rounded-xl bg-slate-900 border border-slate-800 ${stat.color} shrink-0`}>
              <stat.icon size={20} className="sm:w-[22px] sm:h-[22px]" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-2xl border border-slate-800 p-4 md:p-6">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h3 className="text-[clamp(11px,0.8vw,14px)] font-orbitron text-slate-200 uppercase tracking-widest">Weekly Productivity Wave</h3>
            <div className="text-[clamp(8px,0.6vw,10px)] text-cyan-400 font-mono">Real-time Telemetry</div>
          </div>
          <div className="h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productivityData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '10px' }}
                  itemStyle={{ color: '#22d3ee' }}
                />
                <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl border border-slate-800 p-4 md:p-6">
          <h3 className="text-[clamp(11px,0.8vw,14px)] font-orbitron text-slate-200 uppercase tracking-widest mb-6 md:mb-8">Mood Synapse Trends</h3>
          <div className="h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '10px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {moodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsHub;
