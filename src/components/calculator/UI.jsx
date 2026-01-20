import React from 'react';

export function ConfigInput({ label, value, onChange, highlight }) {
    return (
        <div className={`flex flex-col ${highlight ? 'relative' : ''}`}>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full p-2.5 rounded-lg border text-sm font-medium transition-all focus:ring-2 focus:ring-purple-500 focus:outline-none ${highlight ? 'bg-purple-50 border-purple-200 text-purple-900' : 'bg-gray-50 border-gray-200 text-gray-800 hover:border-gray-300'}`}
            />
        </div>
    );
}

export function ScenarioInput({ label, value, onChange, width = "w-16", placeholder }) {
    return (
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200" title={label}>
            <label className="text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{label}:</label>
            <input
                type="number"
                min="0"
                value={value === 0 ? '' : value}
                placeholder={placeholder || value}
                onChange={(e) => onChange(e.target.value)}
                className={`${width} text-sm font-bold text-center focus:outline-none focus:text-purple-600 placeholder-gray-300`}
            />
        </div>
    );
}

export function KpiCard({ title, value, sub, color, icon }) {
    return (
        <div className={`${color} text-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-all`}>
            <div className="flex justify-between items-start mb-2">
                <div className="text-xs font-bold uppercase opacity-80">{title}</div>
                <span className="text-xl opacity-90">{icon}</span>
            </div>
            <div className="text-2xl font-bold mb-1">{value}</div>
            <div className="text-xs opacity-80 font-medium">{sub}</div>
        </div>
    );
}
