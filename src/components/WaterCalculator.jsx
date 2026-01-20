import React, { useState } from 'react';

// --- CONSTANTS: Base Water Needs (m3 per tree) from Excel ---
const BASE_DATA = {
  Jan: { Y1: 0.53, Y2: 0.66, Y3: 0.82, Y4: 1.02, Y5: 1.28, Y6: 1.60, Y7: 2.00 },
  Feb: { Y1: 0.78, Y2: 0.98, Y3: 1.23, Y4: 1.54, Y5: 1.92, Y6: 2.40, Y7: 3.00 },
  Mar: { Y1: 1.31, Y2: 1.64, Y3: 2.05, Y4: 2.56, Y5: 3.20, Y6: 4.00, Y7: 5.00 },
  Apr: { Y1: 1.83, Y2: 2.29, Y3: 2.86, Y4: 3.58, Y5: 4.48, Y6: 5.60, Y7: 7.00 },
  May: { Y1: 2.54, Y2: 3.18, Y3: 3.97, Y4: 4.96, Y5: 6.20, Y6: 8.00, Y7: 10.00 },
  Jun: { Y1: 2.74, Y2: 3.43, Y3: 4.29, Y4: 5.36, Y5: 6.70, Y6: 8.80, Y7: 11.00 },
  Jul: { Y1: 3.93, Y2: 4.91, Y3: 6.14, Y4: 7.68, Y5: 9.60, Y6: 12.00, Y7: 15.00 },
  Aug: { Y1: 4.46, Y2: 5.57, Y3: 6.96, Y4: 8.70, Y5: 10.88, Y6: 13.60, Y7: 17.00 },
  Sep: { Y1: 3.41, Y2: 4.26, Y3: 5.23, Y4: 6.66, Y5: 8.32, Y6: 10.40, Y7: 13.00 },
  Oct: { Y1: 2.54, Y2: 3.18, Y3: 3.97, Y4: 5.12, Y5: 6.40, Y6: 8.00, Y7: 10.00 },
  Nov: { Y1: 1.83, Y2: 2.29, Y3: 2.86, Y4: 3.58, Y5: 4.48, Y6: 5.60, Y7: 7.00 },
  Dec: { Y1: 0.53, Y2: 0.66, Y3: 0.82, Y4: 1.02, Y5: 1.28, Y6: 1.60, Y7: 2.00 },
};

export default function WaterCalculator() {
  // --- STATE: Inputs ---
  const [config, setConfig] = useState({
    wellSalinity: 4500,
    desalSalinity: 100,
    targetSalinity: 1200,
    storageDays: 7, // Global storage buffer setting
    pondDepth: 4
  });

  const [palmsPerDunum, setPalmsPerDunum] = useState(15);

  const [plots, setPlots] = useState([
    { id: 1, name: 'Plot 333', dunums: 51, existingTrees: 734 },
    { id: 2, name: 'Plot 384', dunums: 80, existingTrees: 1194 },
    { id: 3, name: 'Plot 352', dunums: 200 },
    { id: 4, name: 'Plot 302', dunums: 30.6 },
    { id: 5, name: 'Plot 304', dunums: 47 },
  ]);

  const [roUnits, setRoUnits] = useState([
    { id: 1, name: 'RO Unit 1', capacity: 90, inputCapacity: 120 },
    { id: 2, name: 'RO Unit 2', capacity: 35, inputCapacity: 47 },
  ]);

  const [wells, setWells] = useState([
    { id: 1, name: 'Well 1', capacity: 40 },
    { id: 2, name: 'Well 2', capacity: 40 },
    { id: 3, name: 'Well 3', capacity: 40 },
    { id: 4, name: 'Well 4', capacity: 40 },
    { id: 5, name: 'Well 5', capacity: 40 },
  ]);

  const [scenarios, setScenarios] = useState([
    { 
      id: 1, 
      name: 'All Plots', 
      plotIds: [1, 2, 3, 4, 5], 
      roIds: [1, 2],
      wellIds: [1, 2, 3, 4, 5],
      numPonds: 1,
      roRunDays: 7, // Default to match typical storage cycle
      supplyBufferHours: 12,
      customPeakDemand: 0 
    },
  ]);

  // --- CALCULATIONS ---
  const calculateTrees = (plot) => {
    if (plot.existingTrees != null) return plot.existingTrees;
    return Math.round((Number(plot.dunums) || 0) * palmsPerDunum);
  };
  
  const getScenarioTrees = (scenario) => {
    return scenario.plotIds.reduce((sum, plotId) => {
      const plot = plots.find(p => p.id === plotId);
      return sum + (plot ? calculateTrees(plot) : 0);
    }, 0);
  };

  const getScenarioRoCapacities = (scenario) => {
    return scenario.roIds.reduce((acc, roId) => {
      const ro = roUnits.find(r => r.id === roId);
      if (ro) {
        acc.output += Number(ro.capacity) || 0;
        acc.input += Number(ro.inputCapacity) || 0;
      }
      return acc;
    }, { output: 0, input: 0 });
  };

  const getScenarioWellCapacity = (scenario) => {
    return scenario.wellIds.reduce((sum, wellId) => {
      const well = wells.find(w => w.id === wellId);
      return sum + (well ? Number(well.capacity) || 0 : 0);
    }, 0);
  };

  const scenarioResults = scenarios.map(scenario => {
    const totalTrees = getScenarioTrees(scenario);
    const { output: desalCapacity, input: roInputCapacity } = getScenarioRoCapacities(scenario);
    const wellCapacity = getScenarioWellCapacity(scenario);

    let desalRatio = (config.wellSalinity - config.targetSalinity) / (config.wellSalinity - config.desalSalinity);
    desalRatio = Math.max(0, Math.min(1, desalRatio));
    
    // Peak Demand & Storage (Demand Side)
    const peakMultiplier = (scenario.customPeakDemand && Number(scenario.customPeakDemand) > 0)
      ? Number(scenario.customPeakDemand)
      : 17.00; 

    const peakMonthTotal = peakMultiplier * totalTrees;
    const dailyPeakDemand = peakMonthTotal / 31;
    const storageRequired = dailyPeakDemand * config.storageDays; // Global config controls total buffer size
    
    // Pond Calculations
    const numPonds = Math.max(1, parseInt(scenario.numPonds) || 1);
    const volumePerPond = storageRequired / numPonds;
    const pondDepth = config.pondDepth || 1;
    const areaPerPond = volumePerPond / pondDepth;
    const sidePerPond = Math.sqrt(areaPerPond);

    // Supply Pond Calculations
    const supplyBufferHours = Number(scenario.supplyBufferHours) || 0;
    const supplyPondVolume = roInputCapacity * supplyBufferHours;
    const supplyPondArea = supplyPondVolume / pondDepth;
    const supplyPondSide = Math.sqrt(supplyPondArea);

    // Volumes Needed
    const desalVolNeeded = storageRequired * desalRatio;
    const wellVolForMixing = storageRequired * (1 - desalRatio);
    const roRecovery = roInputCapacity > 0 ? (desalCapacity / roInputCapacity) : 1; 
    const rawWaterForRO = desalVolNeeded > 0 ? (desalVolNeeded / roRecovery) : 0;
    const totalWellWaterNeeded = wellVolForMixing + rawWaterForRO;

    // Operation Hours (Supply Side - Based on "RO Run Days")
    // How many days do we have to produce the 'storageRequired' volume?
    const roRunDays = Number(scenario.roRunDays) || config.storageDays; 
    
    const totalOpHours = desalCapacity > 0 ? desalVolNeeded / desalCapacity : 0;
    const dailyOpHours = totalOpHours / roRunDays; // Spread load over Run Days

    const totalWellOpHours = wellCapacity > 0 ? totalWellWaterNeeded / wellCapacity : 0;
    const dailyWellOpHours = totalWellOpHours / roRunDays; // Spread load over Run Days

    return {
      scenario,
      totalTrees,
      desalCapacity,
      roInputCapacity,
      wellCapacity,
      desalRatio,
      storageRequired,
      
      // Ponds
      numPonds,
      volumePerPond,
      areaPerPond,
      sidePerPond,
      supplyPondVolume,
      supplyPondArea,
      supplyPondSide,

      // Volumes
      desalVolNeeded,
      wellVolForMixing,
      rawWaterForRO,
      totalWellWaterNeeded,

      // Ops
      dailyOpHours,
      dailyWellOpHours,
      dailyPeakDemand,
      peakMultiplier,
      roRunDays // Pass through for UI
    };
  });

  const mainResult = scenarioResults[0] || {
    totalTrees: 0,
    dailyPeakDemand: 0
  };

  // --- HANDLERS ---
  const updateConfig = (field, val) => setConfig(prev => ({ ...prev, [field]: Number(val) }));
  
  const updatePlot = (id, field, val) => {
    setPlots(plots.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  const addPlot = () => {
    setPlots([...plots, { id: Date.now(), name: 'New Plot', dunums: 0 }]);
  };

  const removePlot = (id) => {
    setPlots(plots.filter(p => p.id !== id));
    setScenarios(scenarios.map(s => ({
      ...s,
      plotIds: s.plotIds.filter(pid => pid !== id)
    })));
  };

  const updateRoUnit = (id, field, val) => {
    setRoUnits(roUnits.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const addRoUnit = () => {
    setRoUnits([...roUnits, { id: Date.now(), name: 'New RO Unit', capacity: 100, inputCapacity: 133 }]);
  };

  const removeRoUnit = (id) => {
    setRoUnits(roUnits.filter(r => r.id !== id));
    setScenarios(scenarios.map(s => ({
      ...s,
      roIds: s.roIds.filter(rid => rid !== id)
    })));
  };

  const updateWell = (id, field, val) => {
    setWells(wells.map(w => w.id === id ? { ...w, [field]: val } : w));
  };

  const addWell = () => {
    setWells([...wells, { id: Date.now(), name: 'New Well', capacity: 40 }]);
  };

  const removeWell = (id) => {
    setWells(wells.filter(w => w.id !== id));
    setScenarios(scenarios.map(s => ({
      ...s,
      wellIds: s.wellIds.filter(wid => wid !== id)
    })));
  };

  const updateScenario = (id, field, val) => {
    setScenarios(scenarios.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  const addScenario = () => {
    setScenarios([...scenarios, { 
      id: Date.now(), 
      name: 'New Scenario', 
      plotIds: [], roIds: [], wellIds: [], 
      numPonds: 1, 
      roRunDays: 7,
      supplyBufferHours: 12,
      customPeakDemand: 0 
    }]);
  };

  const removeScenario = (id) => {
    setScenarios(scenarios.filter(s => s.id !== id));
  };

  const togglePlotInScenario = (scenarioId, plotId) => {
    setScenarios(scenarios.map(s => {
      if (s.id === scenarioId) {
        const hasPlot = s.plotIds.includes(plotId);
        return {
          ...s,
          plotIds: hasPlot ? s.plotIds.filter(id => id !== plotId) : [...s.plotIds, plotId]
        };
      }
      return s;
    }));
  };

  const toggleRoInScenario = (scenarioId, roId) => {
    setScenarios(scenarios.map(s => {
      if (s.id === scenarioId) {
        const hasRo = s.roIds.includes(roId);
        return {
          ...s,
          roIds: hasRo ? s.roIds.filter(id => id !== roId) : [...s.roIds, roId]
        };
      }
      return s;
    }));
  };

  const toggleWellInScenario = (scenarioId, wellId) => {
    setScenarios(scenarios.map(s => {
      if (s.id === scenarioId) {
        const hasWell = s.wellIds.includes(wellId);
        return {
          ...s,
          wellIds: hasWell ? s.wellIds.filter(id => id !== wellId) : [...s.wellIds, wellId]
        };
      }
      return s;
    }));
  };

  return (
    <div className="max-w-full mx-auto p-4 lg:p-6 space-y-6">
      
      {/* 1. TOP ROW: CONFIGURATION */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
          <span>⚙️</span> Global Configuration
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
           <ConfigInput label="Well Salinity (ppm)" value={config.wellSalinity} onChange={v => updateConfig('wellSalinity', v)} />
           <ConfigInput label="Desal Salinity (ppm)" value={config.desalSalinity} onChange={v => updateConfig('desalSalinity', v)} />
           <ConfigInput label="Target Salinity (ppm)" value={config.targetSalinity} onChange={v => updateConfig('targetSalinity', v)} highlight />
           <ConfigInput label="Storage Buffer (Days)" value={config.storageDays} onChange={v => updateConfig('storageDays', v)} />
           <ConfigInput label="Pond Depth (m)" value={config.pondDepth} onChange={v => updateConfig('pondDepth', v)} highlight />
           <ConfigInput label="Palms/Dunum" value={palmsPerDunum} onChange={setPalmsPerDunum} highlight />
        </div>
      </div>

      {/* 2. SECOND ROW: ASSETS (Plots, Wells, RO) */}
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
                  {plot.existingTrees != null ? <strong>{plot.existingTrees} (Fixed)</strong> : <>{calculateTrees(plot)} trees</>}
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

      {/* 3. SCENARIOS SECTION */}
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
                  value={`${result.storageRequired.toLocaleString(undefined, {maximumFractionDigits:0})} m³`} 
                  sub={`Needed for irrigation`} 
                  color="bg-gradient-to-br from-blue-500 to-blue-600" 
                  icon="🏗️"
                />
                <KpiCard 
                  title={`Prod. Ponds (${result.numPonds}x)`} 
                  value={`${result.sidePerPond.toFixed(0)}m x ${result.sidePerPond.toFixed(0)}m`} 
                  sub={`Area: ${result.areaPerPond.toLocaleString(undefined, {maximumFractionDigits:0})} m² each`} 
                  color="bg-gradient-to-br from-cyan-500 to-cyan-600" 
                  icon="📏"
                />
                <KpiCard 
                  title="Supply Pond" 
                  value={`${result.supplyPondSide.toFixed(0)}m x ${result.supplyPondSide.toFixed(0)}m`} 
                  sub={`${result.supplyPondVolume.toLocaleString(undefined, {maximumFractionDigits:0})} m³ (${result.scenario.supplyBufferHours}h buffer)`} 
                  color="bg-gradient-to-br from-teal-500 to-teal-600" 
                  icon="💧"
                />
                <KpiCard 
                  title="Peak Demand" 
                  value={`${result.dailyPeakDemand.toLocaleString(undefined, {maximumFractionDigits:0})} m³`} 
                  sub="Daily consumption" 
                  color="bg-gradient-to-br from-orange-500 to-orange-600" 
                  icon="📈"
                />
              </div>

              {/* Mixing & Volume Details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">🏭</span>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-blue-600 uppercase">Desalination Volume</div>
                      <div className="text-2xl font-bold text-gray-800">{result.desalVolNeeded.toLocaleString(undefined, {maximumFractionDigits:0})} m³</div>
                    </div>
                  </div>
                  <div className="text-xs text-blue-700 font-medium space-y-1">
                    <div>Op Hours: <strong>{result.dailyOpHours.toFixed(1)} h/day</strong> (over {result.roRunDays} days)</div>
                    <div>Input Feed: <strong>{result.rawWaterForRO.toLocaleString(undefined, {maximumFractionDigits:0})} m³</strong> (from Wells)</div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">🌊</span>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-green-600 uppercase">Total Well Water</div>
                      <div className="text-2xl font-bold text-gray-800">{result.totalWellWaterNeeded.toLocaleString(undefined, {maximumFractionDigits:0})} m³</div>
                    </div>
                  </div>
                  <div className="text-xs text-green-700 font-medium space-y-1">
                    <div>Direct to Mixing: <strong>{result.wellVolForMixing.toLocaleString(undefined, {maximumFractionDigits:0})} m³</strong></div>
                    <div>To Supply Pond: <strong>{result.rawWaterForRO.toLocaleString(undefined, {maximumFractionDigits:0})} m³</strong></div>
                    <div>Op Hours: <strong>{result.dailyWellOpHours.toFixed(1)} h/day</strong> (over {result.roRunDays} days)</div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-xl p-5 border border-orange-100">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <div className="text-xs font-bold text-orange-600 uppercase">System Status</div>
                      <div className="text-lg font-bold text-gray-800">
                        {result.dailyOpHours > 24 || result.dailyWellOpHours > 24 ? "⚠️ OVERLOAD" : "✅ OPTIMAL"}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-orange-800 space-y-1">
                    <div className="flex justify-between"><span>Mixing:</span> <strong>{(result.desalRatio * 100).toFixed(0)}% Desal / {(100 - result.desalRatio*100).toFixed(0)}% Well</strong></div>
                    <div className="flex justify-between"><span>Desal Load:</span> <strong>{(result.dailyOpHours/24*100).toFixed(0)}%</strong></div>
                    <div className="flex justify-between"><span>Well Load:</span> <strong>{(result.dailyWellOpHours/24*100).toFixed(0)}%</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. BOTTOM SECTION: DETAILED WATER DEMAND */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-100">
          <h3 className="font-bold text-gray-700 text-lg flex items-center gap-2">
            <span className="text-2xl">📅</span>
            Monthly Water Demand (Year 7 - Peak Load)
          </h3>
          <p className="text-sm text-gray-600 mt-1">Based on the first scenario's total tree count ({mainResult.totalTrees.toLocaleString()} trees)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-4 font-bold whitespace-nowrap">Month</th>
                <th className="px-6 py-4 font-bold whitespace-nowrap">Per Tree (m³)</th>
                <th className="px-6 py-4 font-bold whitespace-nowrap text-blue-600">Total Demand (m³)</th>
                <th className="px-6 py-4 font-bold whitespace-nowrap">Daily Average (m³)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Object.entries(BASE_DATA).map(([month, data]) => {
                const perTree = data.Y7;
                const total = perTree * mainResult.totalTrees;
                const daily = total / 30.5;
                return (
                  <tr key={month} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{month}</td>
                    <td className="px-6 py-4 text-gray-600">{perTree.toFixed(2)}</td>
                    <td className="px-6 py-4 font-bold text-blue-600">{total.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                    <td className="px-6 py-4 text-gray-700">{daily.toFixed(0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ConfigInput({ label, value, onChange, highlight }) {
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

function ScenarioInput({ label, value, onChange, width = "w-16", placeholder }) {
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

function KpiCard({ title, value, sub, color, icon }) {
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