
import React from 'react';

interface HUDStatsProps {
  type: 'radial';
  value: number;
  label: string;
  color: string;
}

const HUDStats: React.FC<HUDStatsProps> = ({ value, label, color }) => {
  const circumference = 2 * Math.PI * 30;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full rotate-[-90deg]">
          <circle
            cx="40"
            cy="40"
            r="30"
            stroke="currentColor"
            strokeWidth="5"
            fill="transparent"
            className="text-slate-100"
          />
          <circle
            cx="40"
            cy="40"
            r="30"
            stroke={color}
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[clamp(10px,0.75vw,13px)] font-black font-orbitron text-slate-800">
          {value}%
        </div>
      </div>
      <div className="flex flex-col">
        <div className="text-[clamp(15px,1.1vw,18px)] font-black font-rajdhani tracking-tight text-slate-800 leading-none mb-2">{label}</div>
        <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full transition-all duration-1500 ease-in-out rounded-full" 
            style={{ width: `${value}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}40` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default HUDStats;
