import React from 'react';
import { ScenarioInput, KpiCard } from './UI';

export function ScenarioSection({
    scenarioResults,
    plots, wells, roUnits,
    config,
    updateScenario, removeScenario, addScenario,
    togglePlotInScenario, toggleWellInScenario, toggleRoInScenario
}) {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                <h2 className="text-2xl font-bold text-gray-800">Scenarios & Analysis</h2>
                <button onClick={addScenario} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 transition shadow-sm">+ New Scenario</button>
            </div>

            {scenarioResults.map(result => (
                <div key={result.scenario.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    {/* Scenario Header & Controls */}
                    <div className="bg-gray-50 p-6 border-b border-gray-200">
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-6">
                            <div className="flex items-center gap-3 min-w-[200px]">
                                <span className="text-2xl">📊</span>
                                <input
                                    type="text"
                                    value={result.scenario.name}
                                    onChange={(e) => updateScenario(result.scenario.id, 'name', e.target.value)}
                                    className="text-xl font-bold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-purple-500 focus:outline-none px-1 transition-colors w-full"
                                />
                            </div>

                            {/* Scenario Inputs */}
                            <div className="flex flex-wrap items-center gap-3">
                                <ScenarioInput
                                    label="RO Run Days"
                                    value={result.scenario.roRunDays}
                                    onChange={(v) => updateScenario(result.scenario.id, 'roRunDays', v)}
                                    width="w-16"
                                />
                                <ScenarioInput
                                    label="Supply Buffer (h)"
                                    value={result.scenario.supplyBufferHours}
                                    onChange={(v) => updateScenario(result.scenario.id, 'supplyBufferHours', v)}
                                    width="w-16"
                                />
                                <ScenarioInput
                                    label="Peak (m³/tree)"
                                    value={result.scenario.customPeakDemand}
                                    onChange={(v) => updateScenario(result.scenario.id, 'customPeakDemand', v)}
                                    width="w-16"
                                    placeholder="17.0"
                                />
                                <ScenarioInput
                                    label="Ponds"
                                    value={result.scenario.numPonds}
                                    onChange={(v) => updateScenario(result.scenario.id, 'numPonds', v)}
                                    width="w-12"
                                />
                                <button onClick={() => removeScenario(result.scenario.id)} className="text-red-500 hover:text-red-700 text-sm font-medium ml-2">Delete</button>
                            </div>
                        </div>

                        {/* Scenario Options (Selections) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Included Plots</h4>
                                <div className="flex flex-wrap gap-2">
                                    {plots.map(p => {
                                        const isActive = result.scenario.plotIds.includes(p.id);
                                        return (
                                            <button
                                                key={p.id}
                                                onClick={() => togglePlotInScenario(result.scenario.id, p.id)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isActive ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                                            >
                                                {p.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Active Wells</h4>
                                <div className="flex flex-wrap gap-2">
                                    {wells.map(w => {
                                        const isActive = result.scenario.wellIds.includes(w.id);
                                        return (
                                            <button
                                                key={w.id}
                                                onClick={() => toggleWellInScenario(result.scenario.id, w.id)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isActive ? 'bg-teal-600 text-white shadow-sm' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                                            >
                                                {w.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Active RO Units</h4>
                                <div className="flex flex-wrap gap-2">
                                    {roUnits.map(r => {
                                        const isActive = result.scenario.roIds.includes(r.id);
                                        return (
                                            <button
                                                key={r.id}
                                                onClick={() => toggleRoInScenario(result.scenario.id, r.id)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                                            >
                                                {r.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scenario Results Body */}
                    <div className="p-6">
                        {/* KPIs Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                            <KpiCard
                                title="Total Palms"
                                value={result.totalTrees.toLocaleString()}
                                sub="Scenario tree count"
                                color="bg-gradient-to-br from-green-500 to-green-600"
                                icon="🌴"
                            />
                            <KpiCard
                                title={`Storage (${config.storageDays} Days)`}
                                value={`${result.storageRequired.toLocaleString(undefined, { maximumFractionDigits: 0 })} m³`}
                                sub={`Needed for irrigation`}
                                color="bg-gradient-to-br from-blue-500 to-blue-600"
                                icon="🏗️"
                            />
                            <KpiCard
                                title={`Prod. Ponds (${result.numPonds}x)`}
                                value={`${result.sidePerPond.toFixed(0)}m x ${result.sidePerPond.toFixed(0)}m`}
                                sub={`Area: ${result.areaPerPond.toLocaleString(undefined, { maximumFractionDigits: 0 })} m² each`}
                                color="bg-gradient-to-br from-cyan-500 to-cyan-600"
                                icon="📏"
                            />
                            <KpiCard
                                title="Supply Pond"
                                value={`${result.supplyPondSide.toFixed(0)}m x ${result.supplyPondSide.toFixed(0)}m`}
                                sub={`${result.supplyPondVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })} m³ (${result.scenario.supplyBufferHours}h buffer)`}
                                color="bg-gradient-to-br from-teal-500 to-teal-600"
                                icon="💧"
                            />
                            <KpiCard
                                title="Peak Demand"
                                value={`${result.dailyPeakDemand.toLocaleString(undefined, { maximumFractionDigits: 0 })} m³`}
                                sub="Daily consumption"
                                color="bg-gradient-to-br from-orange-500 to-orange-600"
                                icon="📈"
                            />
                        </div>

                        {/* Mixing & Volume Details */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-2xl">🏭</span>
                                    <div className="flex-1">
                                        <div className="text-xs font-bold text-blue-600 uppercase">Desalination Volume</div>
                                        <div className="text-2xl font-bold text-gray-800">{result.desalVolNeeded.toLocaleString(undefined, { maximumFractionDigits: 0 })} m³</div>
                                    </div>
                                </div>
                                <div className="text-xs text-blue-700 font-medium space-y-1">
                                    <div>Op Hours: <strong>{result.dailyOpHours.toFixed(1)} h/day</strong> (over {result.roRunDays} days)</div>
                                    <div>Input Feed: <strong>{result.rawWaterForRO.toLocaleString(undefined, { maximumFractionDigits: 0 })} m³</strong> (from Wells)</div>
                                </div>
                            </div>

                            <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-2xl">🌊</span>
                                    <div className="flex-1">
                                        <div className="text-xs font-bold text-green-600 uppercase">Total Well Water</div>
                                        <div className="text-2xl font-bold text-gray-800">{result.totalWellWaterNeeded.toLocaleString(undefined, { maximumFractionDigits: 0 })} m³</div>
                                    </div>
                                </div>
                                <div className="text-xs text-green-700 font-medium space-y-1">
                                    <div>Direct to Mixing: <strong>{result.wellVolForMixing.toLocaleString(undefined, { maximumFractionDigits: 0 })} m³</strong></div>
                                    <div>To Supply Pond: <strong>{result.rawWaterForRO.toLocaleString(undefined, { maximumFractionDigits: 0 })} m³</strong></div>
                                    <div>Op Hours: <strong>{result.dailyWellOpHours.toFixed(1)} h/day</strong> (over {result.roRunDays} days)</div>
                                </div>
                            </div>

                            {/* Hydraulic Balance */}
                            <div className={`rounded-xl p-5 border ${result.isFlowDeficit ? 'bg-red-50 border-red-100' : 'bg-teal-50 border-teal-100'}`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-2xl">⚡</span>
                                    <div>
                                        <div className={`text-xs font-bold uppercase ${result.isFlowDeficit ? 'text-red-600' : 'text-teal-600'}`}>
                                            Hydraulic Balance
                                        </div>
                                        <div className={`text-lg font-bold ${result.isFlowDeficit ? 'text-red-800' : 'text-teal-800'}`}>
                                            {result.isFlowDeficit ? "⚠ FLOW DEFICIT" : "✅ BALANCED"}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Active Well Cap:</span>
                                        <span className="font-bold">{result.wellCapacity} m³/hr</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Max RO Demand:</span>
                                        <span className="font-bold">{result.activeROInputCap} m³/hr</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Mixing Demand:</span>
                                        <span className="font-bold">{result.instantaneousMixingDemand.toFixed(0)} m³/hr</span>
                                    </div>
                                    <div className="flex justify-between items-center text-purple-600">
                                        <span className="font-medium">Pond Fill Time:</span>
                                        <span className="font-bold">{result.supplyPondFillTime.toFixed(1)} hrs</span>
                                    </div>
                                    <div className={`flex justify-between items-center pt-2 border-t ${result.isFlowDeficit ? 'border-red-200 text-red-700' : 'border-teal-200 text-teal-700'}`}>
                                        <span className="font-bold">Net Flow:</span>
                                        <span className="font-bold">{result.flowBalance.toFixed(0)} m³/hr</span>
                                    </div>
                                    {!result.isFlowDeficit && result.activeWellsCount > result.neededWellsCount && (
                                        <div className="flex justify-between items-center mt-1 text-teal-600 font-medium italic">
                                            <span>💡 Needed Wells:</span>
                                            <span>{result.neededWellsCount} of {result.activeWellsCount}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* System Status (Load) */}
                            <div className={`rounded-xl p-5 border ${result.dailyOpHours > 24 || result.dailyWellOpHours > 24 ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'}`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-2xl">⏱️</span>
                                    <div>
                                        <div className={`text-xs font-bold uppercase ${result.dailyOpHours > 24 || result.dailyWellOpHours > 24 ? 'text-red-600' : 'text-orange-600'}`}>
                                            System Status
                                        </div>
                                        <div className={`text-lg font-bold ${result.dailyOpHours > 24 || result.dailyWellOpHours > 24 ? 'text-red-800' : 'text-gray-800'}`}>
                                            {result.dailyOpHours > 24 || result.dailyWellOpHours > 24 ? "⚠️ OVERLOAD" : "✅ OPTIMAL"}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-700 space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span>Mixing Ratio:</span>
                                        <div className="text-right">
                                            <div className="font-bold text-gray-800">{(result.desalRatio * 100).toFixed(0)}% / {(100 - result.desalRatio * 100).toFixed(0)}%</div>
                                            {result.desalRatio > 0 && result.desalRatio < 1 && (
                                                <div className="text-[10px] text-purple-600 font-bold uppercase">
                                                    RO {(result.desalRatio / (1 - result.desalRatio)).toFixed(1)} : 1 Well
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Desal Load:</span>
                                        <strong className={result.dailyOpHours > 24 ? 'text-red-600' : ''}>{(result.dailyOpHours / 24 * 100).toFixed(0)}%</strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Well Load:</span>
                                        <strong className={result.dailyWellOpHours > 24 ? 'text-red-600' : ''}>{(result.dailyWellOpHours / 24 * 100).toFixed(0)}%</strong>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
