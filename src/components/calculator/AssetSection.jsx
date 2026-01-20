import React from 'react';
import { calculateTrees } from './utils';

export function AssetSection({
    plots, addPlot, updatePlot, removePlot,
    wells, addWell, updateWell, removeWell,
    roUnits, addRoUnit, updateRoUnit, removeRoUnit,
    palmsPerDunum
}) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Farm Plots */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><span>🌴</span> Farm Plots</h2>
                    <button onClick={addPlot} className="text-sm bg-green-50 text-green-600 px-3 py-1 rounded-lg font-bold hover:bg-green-100 transition">+ Add Plot</button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {plots.map(plot => (
                        <div key={plot.id} className="flex gap-2 items-center p-2 bg-gray-50 rounded-lg">
                            <input type="text" value={plot.name} onChange={(e) => updatePlot(plot.id, 'name', e.target.value)} className="flex-1 min-w-0 p-1.5 border border-gray-200 rounded text-sm" placeholder="Name" />
                            <input type="number" value={plot.dunums} onChange={(e) => updatePlot(plot.id, 'dunums', e.target.value)} className="w-20 p-1.5 border border-gray-200 rounded text-sm" placeholder="Dunums" />
                            <span className="text-xs text-gray-500 whitespace-nowrap min-w-[80px] text-right">
                                {plot.existingTrees != null ? <strong>{plot.existingTrees} (Fixed)</strong> : <>{calculateTrees(plot, palmsPerDunum)} trees</>}
                            </span>
                            <button onClick={() => removePlot(plot.id)} className="text-red-400 hover:text-red-600 px-1">✕</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Wells */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><span>🌊</span> Wells</h2>
                    <button onClick={addWell} className="text-sm bg-teal-50 text-teal-600 px-3 py-1 rounded-lg font-bold hover:bg-teal-100 transition">+ Add Well</button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {wells.map(well => (
                        <div key={well.id} className="flex gap-2 items-center p-2 bg-teal-50/50 rounded-lg">
                            <input type="text" value={well.name} onChange={(e) => updateWell(well.id, 'name', e.target.value)} className="flex-1 min-w-0 p-1.5 border border-gray-200 rounded text-sm" placeholder="Name" />
                            <div className="flex items-center gap-1">
                                <input type="number" value={well.capacity} onChange={(e) => updateWell(well.id, 'capacity', e.target.value)} className="w-20 p-1.5 border border-gray-200 rounded text-sm" placeholder="Cap" />
                                <span className="text-xs text-gray-500">m³/hr</span>
                            </div>
                            <button onClick={() => removeWell(well.id)} className="text-red-400 hover:text-red-600 px-1">✕</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* RO Units */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><span>🏭</span> RO Units</h2>
                    <button onClick={addRoUnit} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-bold hover:bg-blue-100 transition">+ Add Unit</button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {roUnits.map(ro => (
                        <div key={ro.id} className="flex flex-col p-2 bg-blue-50/50 rounded-lg gap-2">
                            <div className="flex gap-2 items-center">
                                <input type="text" value={ro.name} onChange={(e) => updateRoUnit(ro.id, 'name', e.target.value)} className="flex-1 min-w-0 p-1.5 border border-gray-200 rounded text-sm" placeholder="Name" />
                                <button onClick={() => removeRoUnit(ro.id)} className="text-red-400 hover:text-red-600 px-1">✕</button>
                            </div>
                            <div className="flex gap-2 text-xs items-center">
                                <div className="flex-1">
                                    <label className="text-gray-500 uppercase font-bold text-[10px]">Output (m³/h)</label>
                                    <input type="number" value={ro.capacity} onChange={(e) => updateRoUnit(ro.id, 'capacity', e.target.value)} className="w-full p-1 border border-gray-200 rounded" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-gray-500 uppercase font-bold text-[10px]">Input (m³/h)</label>
                                    <input type="number" value={ro.inputCapacity} onChange={(e) => updateRoUnit(ro.id, 'inputCapacity', e.target.value)} className="w-full p-1 border border-gray-200 rounded" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
