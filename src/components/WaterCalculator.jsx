import React, { useState, useRef } from 'react';

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
    storageDays: 7, 
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
      roRunDays: 7, 
      supplyBufferHours: 12,
      customPeakDemand: 0 
    },
  ]);

  const fileInputRef = useRef(null);

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
    const { output: activeROOutputCap, input: activeROInputCap } = getScenarioRoCapacities(scenario);
    const wellCapacity = getScenarioWellCapacity(scenario);

    let desalRatio = (config.wellSalinity - config.targetSalinity) / (config.wellSalinity - config.desalSalinity);
    desalRatio = Math.max(0, Math.min(1, desalRatio));
    
    const peakMultiplier = (scenario.customPeakDemand && Number(scenario.customPeakDemand) > 0)
      ? Number(scenario.customPeakDemand)
      : 17.00; 

    const peakMonthTotal = peakMultiplier * totalTrees;
    const dailyPeakDemand = peakMonthTotal / 31;
    const storageRequired = dailyPeakDemand * config.storageDays; 
    
    const desalVolNeeded = storageRequired * desalRatio;
    const wellVolForMixing = storageRequired * (1 - desalRatio);
    
    const roRecoveryRate = activeROInputCap > 0 ? (activeROOutputCap / activeROInputCap) : 1;
    const rawWaterForRO = desalVolNeeded > 0 ? (desalVolNeeded / roRecoveryRate) : 0;
    const totalWellWaterNeeded = wellVolForMixing + rawWaterForRO;

    const numPonds = Math.max(1, parseInt(scenario.numPonds) || 1);
    const volumePerPond = storageRequired / numPonds;
    const pondDepth = config.pondDepth || 1;
    const areaPerPond = volumePerPond / pondDepth;
    const sidePerPond = Math.sqrt(areaPerPond);

    const supplyBufferHours = Number(scenario.supplyBufferHours) || 0;
    const supplyPondVolume = activeROInputCap * supplyBufferHours;
    const supplyPondArea = supplyPondVolume / pondDepth;
    const supplyPondSide = Math.sqrt(supplyPondArea);

    const roRunDays = Number(scenario.roRunDays) || config.storageDays; 
    
    const totalOpHours = activeROOutputCap > 0 ? desalVolNeeded / activeROOutputCap : 0;
    const dailyOpHours = totalOpHours / roRunDays;
    
    const totalWellOpHours = wellCapacity > 0 ? totalWellWaterNeeded / wellCapacity : 0;
    const dailyWellOpHours = totalWellOpHours / roRunDays;

    const mixingOpHoursTotal = wellCapacity > 0 ? wellVolForMixing / wellCapacity : 0;
    const dailyMixingWellOpHours = mixingOpHoursTotal / roRunDays;

    const supplyPondOpHoursTotal = wellCapacity > 0 ? rawWaterForRO / wellCapacity : 0;
    const dailySupplyPondWellOpHours = supplyPondOpHoursTotal / roRunDays;

    const mixingRatioVol = desalVolNeeded > 0 ? (wellVolForMixing / desalVolNeeded) : 0;
    const instantaneousMixingDemand = activeROOutputCap * mixingRatioVol;
    
    const instantaneousTotalDemand = activeROInputCap + instantaneousMixingDemand;
    const flowBalance = wellCapacity - instantaneousTotalDemand;
    const isFlowDeficit = flowBalance < 0;

    return {
      scenario,
      totalTrees,
      activeROOutputCap,
      activeROInputCap,
      wellCapacity,
      desalRatio,
      storageRequired,
      desalVolNeeded,
      wellVolForMixing,
      rawWaterForRO,
      totalWellWaterNeeded,
      numPonds,
      volumePerPond,
      areaPerPond,
      sidePerPond,
      supplyPondVolume,
      supplyPondArea,
      supplyPondSide,
      dailyOpHours,
      dailyWellOpHours,
      dailyMixingWellOpHours,
      dailySupplyPondWellOpHours,
      dailyPeakDemand,
      peakMultiplier,
      roRunDays,
      instantaneousMixingDemand,
      instantaneousTotalDemand,
      flowBalance,
      isFlowDeficit
    };
  });

  const mainResult = scenarioResults[0] || { totalTrees: 0, dailyPeakDemand: 0 };

  // --- HANDLERS ---
  const updateConfig = (field, val) => setConfig(prev => ({ ...prev, [field]: Number(val) }));
  const updatePlot = (id, field, val) => setPlots(plots.map(p => p.id === id ? { ...p, [field]: val } : p));
  const addPlot = () => setPlots([...plots, { id: Date.now(), name: 'New Plot', dunums: 0 }]);
  const removePlot = (id) => {
    setPlots(plots.filter(p => p.id !== id));
    setScenarios(scenarios.map(s => ({ ...s, plotIds: s.plotIds.filter(pid => pid !== id) })));
  };
  const updateRoUnit = (id, field, val) => setRoUnits(roUnits.map(r => r.id === id ? { ...r, [field]: val } : r));
  const addRoUnit = () => setRoUnits([...roUnits, { id: Date.now(), name: 'New RO Unit', capacity: 100, inputCapacity: 133 }]);
  const removeRoUnit = (id) => {
    setRoUnits(roUnits.filter(r => r.id !== id));
    setScenarios(scenarios.map(s => ({ ...s, roIds: s.roIds.filter(rid => rid !== id) })));
  };
  const updateWell = (id, field, val) => setWells(wells.map(w => w.id === id ? { ...w, [field]: val } : w));
  const addWell = () => setWells([...wells, { id: Date.now(), name: 'New Well', capacity: 40 }]);
  const removeWell = (id) => {
    setWells(wells.filter(w => w.id !== id));
    setScenarios(scenarios.map(s => ({ ...s, wellIds: s.wellIds.filter(wid => wid !== id) })));
  };
  const updateScenario = (id, field, val) => setScenarios(scenarios.map(s => s.id === id ? { ...s, [field]: val } : s));
  const addScenario = () => setScenarios([...scenarios, { id: Date.now(), name: 'New Scenario', plotIds: [], roIds: [], wellIds: [], numPonds: 1, roRunDays: 7, supplyBufferHours: 12, customPeakDemand: 0 }]);
  const removeScenario = (id) => setScenarios(scenarios.filter(s => s.id !== id));
  const togglePlotInScenario = (sId, pid) => setScenarios(scenarios.map(s => s.id === sId ? { ...s, plotIds: s.plotIds.includes(pid) ? s.plotIds.filter(i => i !== pid) : [...s.plotIds, pid] } : s));
  const toggleRoInScenario = (sId, rid) => setScenarios(scenarios.map(s => s.id === sId ? { ...s, roIds: s.roIds.includes(rid) ? s.roIds.filter(i => i !== rid) : [...s.roIds, rid] } : s));
  const toggleWellInScenario = (sId, wid) => setScenarios(scenarios.map(s => s.id === sId ? { ...s, wellIds: s.wellIds.includes(wid) ? s.wellIds.filter(i => i !== wid) : [...s.wellIds, wid] } : s));

  // --- EXPORT / IMPORT ---
  const handleExport = () => {
    const data = {
      config,
      palmsPerDunum,
      plots,
      roUnits,
      wells,
      scenarios
    };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `water-calculator-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /*
  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      
      // 1. Prepare Data for Excel
      
      // Results Summary
      const resultsData = scenarioResults.map(r => ({
        "Scenario Name": r.scenario.name,
        "Total Trees": r.totalTrees,
        "Peak Demand (m3/d)": r.dailyPeakDemand,
        "Storage Required (m3)": r.storageRequired,
        "Desal Volume (m3)": r.desalVolNeeded,
        "Well Volume (m3)": r.totalWellWaterNeeded,
        "Daily RO Op Hours": r.dailyOpHours,
        "Daily Well Op Hours": r.dailyWellOpHours,
        "Hydraulic Balance (m3/h)": r.flowBalance,
        "Status": r.isFlowDeficit ? "FLOW DEFICIT" : "BALANCED"
      }));

      // Scenarios Config
      const scenariosData = scenarios.map(s => ({
        "ID": s.id,
        "Name": s.name,
        "RO Run Days": s.roRunDays,
        "Supply Buffer (h)": s.supplyBufferHours,
        "Custom Peak (m3/tree)": s.customPeakDemand || "Default",
        "Ponds": s.numPonds,
        "Included Plots": s.plotIds.map(pid => plots.find(p => p.id === pid)?.name).join(', '),
        "Active ROs": s.roIds.map(rid => roUnits.find(r => r.id === rid)?.name).join(', '),
        "Active Wells": s.wellIds.map(wid => wells.find(w => w.id === wid)?.name).join(', ')
      }));

      // Farm Plots
      const plotsData = plots.map(p => ({
        "Name": p.name,
        "Dunums": p.dunums,
        "Calculated Trees": Math.round((Number(p.dunums) || 0) * palmsPerDunum),
        "Existing Trees (Fixed)": p.existingTrees || "N/A",
        "Total Trees": p.existingTrees != null ? p.existingTrees : Math.round((Number(p.dunums) || 0) * palmsPerDunum)
      }));

      // Assets
      const roData = roUnits.map(r => ({
        "Name": r.name,
        "Output Capacity (m3/h)": r.capacity,
        "Input Capacity (m3/h)": r.inputCapacity
      }));
      
      const wellsData = wells.map(w => ({
        "Name": w.name,
        "Capacity (m3/h)": w.capacity
      }));

      // Global Config
      const configData = [{
        "Well Salinity": config.wellSalinity,
        "Desal Salinity": config.desalSalinity,
        "Target Salinity": config.targetSalinity,
        "Storage Buffer (Days)": config.storageDays,
        "Pond Depth (m)": config.pondDepth,
        "Palms Per Dunum": palmsPerDunum
      }];

      // 2. Create Workbook
      const wb = XLSX.utils.book_new();
      
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resultsData), "Results Summary");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(scenariosData), "Scenarios");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(plotsData), "Farm Plots");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(roData), "RO Units");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(wellsData), "Wells");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(configData), "Configuration");

      // 3. Write File
      XLSX.writeFile(wb, `Farm_Water_Calc_${new Date().toISOString().split('T')[0]}.xlsx`);

    } catch (error) {
      console.error(error);
      alert("Excel export failed. Please ensure 'xlsx' package is installed: npm install xlsx");
    }
  };
  */

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.config) setConfig(data.config);
          if (data.palmsPerDunum) setPalmsPerDunum(data.palmsPerDunum);
          if (data.plots) setPlots(data.plots);
          if (data.roUnits) setRoUnits(data.roUnits);
          if (data.wells) setWells(data.wells);
          if (data.scenarios) setScenarios(data.scenarios);
          alert('Configuration imported successfully!');
        } catch (error) {
          alert('Error parsing JSON file. Please make sure it is a valid configuration file.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-full mx-auto p-4 lg:p-6 space-y-6">
      
      {/* 1. TOP ROW: CONFIGURATION */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>⚙️</span> Global Configuration
          </h2>
          <div className="flex gap-2">
            <button onClick={handleExport} className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition border border-gray-300">
              ⬇ Export JSON
            </button>
            {/*
            <button onClick={handleExportExcel} className="text-xs font-bold bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 transition border border-green-200">
              📊 Export Excel
            </button>
            */}
            <button onClick={() => fileInputRef.current.click()} className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition border border-blue-200">
              ⬆ Import Config
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImport} 
              className="hidden" 
              accept="application/json"
            />
          </div>
        </div>
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
        <AssetCard title="Farm Plots" icon="🌴" items={plots} onAdd={addPlot} color="green">
          {plots.map(plot => (
            <div key={plot.id} className="flex gap-2 items-center p-2 bg-gray-50 rounded-lg">
              <input type="text" value={plot.name} onChange={(e) => updatePlot(plot.id, 'name', e.target.value)} className="flex-1 min-w-0 p-1.5 border border-gray-200 rounded text-sm" />
              <input type="number" value={plot.dunums} onChange={(e) => updatePlot(plot.id, 'dunums', e.target.value)} className="w-16 p-1.5 border border-gray-200 rounded text-sm" />
              <button onClick={() => removePlot(plot.id)} className="text-red-400">✕</button>
            </div>
          ))}
        </AssetCard>

        <AssetCard title="Wells" icon="🌊" items={wells} onAdd={addWell} color="teal">
          {wells.map(well => (
            <div key={well.id} className="flex gap-2 items-center p-2 bg-teal-50/50 rounded-lg">
              <input type="text" value={well.name} onChange={(e) => updateWell(well.id, 'name', e.target.value)} className="flex-1 min-w-0 p-1.5 border border-gray-200 rounded text-sm" />
              <input type="number" value={well.capacity} onChange={(e) => updateWell(well.id, 'capacity', e.target.value)} className="w-16 p-1.5 border border-gray-200 rounded text-sm" />
              <button onClick={() => removeWell(well.id)} className="text-red-400">✕</button>
            </div>
          ))}
        </AssetCard>

        <AssetCard title="RO Units" icon="🏭" items={roUnits} onAdd={addRoUnit} color="blue">
          {roUnits.map(ro => (
            <div key={ro.id} className="p-2 bg-blue-50/50 rounded-lg space-y-1">
              <div className="flex justify-between">
                <input type="text" value={ro.name} onChange={(e) => updateRoUnit(ro.id, 'name', e.target.value)} className="flex-1 p-1 border-b border-transparent bg-transparent text-sm font-bold" />
                <button onClick={() => removeRoUnit(ro.id)} className="text-red-400">✕</button>
              </div>
              <div className="flex gap-2 text-[10px]">
                <div className="flex-1">Out: <input type="number" value={ro.capacity} onChange={(e) => updateRoUnit(ro.id, 'capacity', e.target.value)} className="w-full p-1 border rounded" /></div>
                <div className="flex-1">In: <input type="number" value={ro.inputCapacity} onChange={(e) => updateRoUnit(ro.id, 'inputCapacity', e.target.value)} className="w-full p-1 border rounded" /></div>
              </div>
            </div>
          ))}
        </AssetCard>
      </div>

      {/* 3. SCENARIOS SECTION */}
      <div className="space-y-8">
        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-800">Scenarios & Analysis</h2>
          <button onClick={addScenario} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 transition shadow-sm">+ New Scenario</button>
        </div>

        {scenarioResults.map(result => (
          <div key={result.scenario.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 p-6 border-b border-gray-200">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-6">
                <input type="text" value={result.scenario.name} onChange={(e) => updateScenario(result.scenario.id, 'name', e.target.value)} className="text-xl font-bold bg-transparent border-b border-transparent focus:border-purple-500 w-full xl:w-auto" />
                <div className="flex flex-wrap items-center gap-3">
                  <ScenarioInput label="RO Run Days" value={result.scenario.roRunDays} onChange={(v) => updateScenario(result.scenario.id, 'roRunDays', v)} />
                  <ScenarioInput label="Supply Buff (h)" value={result.scenario.supplyBufferHours} onChange={(v) => updateScenario(result.scenario.id, 'supplyBufferHours', v)} />
                  <ScenarioInput label="Peak (m³/tree)" value={result.scenario.customPeakDemand} onChange={(v) => updateScenario(result.scenario.id, 'customPeakDemand', v)} />
                  <ScenarioInput label="Ponds" value={result.scenario.numPonds} onChange={(v) => updateScenario(result.scenario.id, 'numPonds', v)} width="w-12" />
                  <button onClick={() => removeScenario(result.scenario.id)} className="text-red-500 font-medium">Delete</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ToggleList title="Included Plots" items={plots} selectedIds={result.scenario.plotIds} onToggle={(id) => togglePlotInScenario(result.scenario.id, id)} color="bg-green-600" />
                <ToggleList title="Active Wells" items={wells} selectedIds={result.scenario.wellIds} onToggle={(id) => toggleWellInScenario(result.scenario.id, id)} color="bg-teal-600" />
                <ToggleList title="Active RO Units" items={roUnits} selectedIds={result.scenario.roIds} onToggle={(id) => toggleRoInScenario(result.scenario.id, id)} color="bg-blue-600" />
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <KpiCard title="Total Palms" value={result.totalTrees.toLocaleString()} sub="Scenario tree count" color="bg-gradient-to-br from-green-500 to-green-600" icon="🌴" />
                <KpiCard title={`Storage (7 Days)`} value={`${result.storageRequired.toLocaleString(undefined, {maximumFractionDigits:0})} m³`} sub={`Irrigation buffer`} color="bg-gradient-to-br from-blue-500 to-blue-600" icon="🏗️" />
                <KpiCard title={`Prod. Ponds (${result.numPonds}x)`} value={`${result.sidePerPond.toFixed(0)}m x ${result.sidePerPond.toFixed(0)}m`} sub={`${result.areaPerPond.toFixed(0)} m² each`} color="bg-gradient-to-br from-cyan-500 to-cyan-600" icon="📏" />
                <KpiCard title="Supply Pond" value={`${result.supplyPondSide.toFixed(0)}m x ${result.supplyPondSide.toFixed(0)}m`} sub={`${result.supplyPondVolume.toLocaleString()} m³ (${result.scenario.supplyBufferHours}h)`} color="bg-gradient-to-br from-teal-500 to-teal-600" icon="💧" />
                <KpiCard title="Peak Demand" value={`${result.dailyPeakDemand.toLocaleString(undefined, {maximumFractionDigits:0})} m³`} sub="Daily consumption" color="bg-gradient-to-br from-orange-500 to-orange-600" icon="📈" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <DetailBox title="Desalination" icon="🏭" color="blue" main={`${result.desalVolNeeded.toLocaleString(undefined, {maximumFractionDigits:0})} m³`}>
                    <div className="text-xs space-y-1">
                        <div>Load: <strong>{result.dailyOpHours.toFixed(1)} h/day</strong></div>
                        <div>Feed: <strong>{result.rawWaterForRO.toLocaleString(undefined, {maximumFractionDigits:0})} m³</strong></div>
                    </div>
                </DetailBox>

                <DetailBox title="Wells" icon="🌊" color="teal" main={`${result.totalWellWaterNeeded.toLocaleString(undefined, {maximumFractionDigits:0})} m³`}>
                    <div className="text-xs space-y-1">
                        <div>Load: <strong>{result.dailyWellOpHours.toFixed(1)} h/day</strong></div>
                        <div>Direct: <strong>{result.wellVolForMixing.toLocaleString(undefined, {maximumFractionDigits:0})} m³</strong></div>
                    </div>
                </DetailBox>

                <div className={`rounded-xl p-5 border ${result.isFlowDeficit ? 'bg-red-50 border-red-100' : 'bg-teal-50 border-teal-100'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">⚖️</span>
                    <div className={`text-xs font-bold uppercase ${result.isFlowDeficit ? 'text-red-600' : 'text-teal-600'}`}>Hydraulic Balance</div>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between"><span>Well Supply:</span> <strong>{result.wellCapacity} m³/h</strong></div>
                    <div className="flex justify-between"><span>System Need:</span> <strong>{result.instantaneousTotalDemand.toFixed(0)} m³/h</strong></div>
                    <div className={`flex justify-between pt-1 border-t ${result.isFlowDeficit ? 'text-red-700' : 'text-teal-700'}`}>
                        <span>Net Flow:</span> <strong>{result.flowBalance.toFixed(0)} m³/h</strong>
                    </div>
                  </div>
                </div>

                <div className={`rounded-xl p-5 border ${result.dailyOpHours > 24 || result.dailyWellOpHours > 24 ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">⏱️</span>
                    <div className="text-xs font-bold uppercase text-gray-600">System Status</div>
                  </div>
                  <div className="text-[11px] space-y-1">
                    <div className="flex justify-between text-gray-700"><span>Status:</span> <strong>{result.dailyOpHours > 24 ? "OVERLOAD" : "OPTIMAL"}</strong></div>
                    <div className="flex justify-between text-gray-500"><span>Desal Load:</span> <strong>{(result.dailyOpHours/24*100).toFixed(0)}%</strong></div>
                    <div className="flex justify-between text-gray-500"><span>Well Load:</span> <strong>{(result.dailyWellOpHours/24*100).toFixed(0)}%</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-100">
          <h3 className="font-bold text-gray-700 text-lg flex items-center gap-2"><span>📅</span> Monthly Demand (Year 7)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 uppercase text-[10px] font-bold">
              <tr><th className="px-6 py-4">Month</th><th className="px-6 py-4">Per Tree (m³)</th><th className="px-6 py-4 text-blue-600">Total (m³)</th><th className="px-6 py-4">Daily (m³)</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Object.entries(BASE_DATA).map(([month, data]) => (
                <tr key={month} className="hover:bg-blue-50/20"><td className="px-6 py-4 font-medium">{month}</td><td className="px-6 py-4">{data.Y7.toFixed(2)}</td><td className="px-6 py-4 font-bold text-blue-600">{(data.Y7 * mainResult.totalTrees).toLocaleString()}</td><td className="px-6 py-4">{(data.Y7 * mainResult.totalTrees / 30.5).toFixed(0)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ConfigInput({ label, value, onChange, highlight }) {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wide">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)} className={`w-full p-2 rounded-lg border text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none ${highlight ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`} />
    </div>
  );
}

function ScenarioInput({ label, value, onChange, width = "w-16", placeholder }) {
  return (
    <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-gray-200">
      <label className="text-[10px] font-bold text-gray-500 uppercase whitespace-nowrap">{label}:</label>
      <input type="number" min="0" value={value || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={`${width} text-xs font-bold text-center focus:outline-none`} />
    </div>
  );
}

function AssetCard({ title, icon, onAdd, children, color }) {
  const colors = { green: 'text-green-600 bg-green-50 hover:bg-green-100', teal: 'text-teal-600 bg-teal-50 hover:bg-teal-100', blue: 'text-blue-600 bg-blue-50 hover:bg-blue-100' };
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><span>{icon}</span> {title}</h2><button onClick={onAdd} className={`text-[10px] px-2 py-1 rounded-lg font-bold transition ${colors[color]}`}>+ ADD</button></div>
      <div className="space-y-2 max-h-60 overflow-y-auto">{children}</div>
    </div>
  );
}

function ToggleList({ title, items, selectedIds, onToggle, color }) {
  return (
    <div>
      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">{title}</h4>
      <div className="flex flex-wrap gap-1.5">
        {items.map(i => (
          <button key={i.id} onClick={() => onToggle(i.id)} className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all ${selectedIds.includes(i.id) ? `${color} text-white shadow-sm` : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}>{i.name}</button>
        ))}
      </div>
    </div>
  );
}

function DetailBox({ title, icon, color, main, children }) {
    const colors = { blue: 'bg-blue-50 border-blue-100 text-blue-600', teal: 'bg-teal-50 border-teal-100 text-teal-600' };
    return (
        <div className={`rounded-xl p-5 border ${colors[color]}`}>
            <div className="flex items-center gap-3 mb-2"><span className="text-2xl">{icon}</span><div className="text-xs font-bold uppercase">{title}</div></div>
            <div className="text-xl font-bold text-gray-800 mb-1">{main}</div>
            {children}
        </div>
    );
}

function KpiCard({ title, value, sub, color, icon }) {
  return (
    <div className={`${color} text-white p-5 rounded-xl shadow-lg transition-all`}>
      <div className="flex justify-between items-start mb-2"><div className="text-[10px] font-bold uppercase opacity-80">{title}</div><span className="text-xl opacity-90">{icon}</span></div>
      <div className="text-xl font-bold mb-1">{value}</div>
      <div className="text-[10px] opacity-80 font-medium">{sub}</div>
    </div>
  );
}