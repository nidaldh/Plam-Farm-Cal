export const calculateTrees = (plot, palmsPerDunum) => {
  if (plot.existingTrees != null) return plot.existingTrees;
  return Math.round((Number(plot.dunums) || 0) * palmsPerDunum);
};

export const getScenarioTrees = (scenario, plots, palmsPerDunum) => {
  return scenario.plotIds.reduce((sum, plotId) => {
    const plot = plots.find(p => p.id === plotId);
    return sum + (plot ? calculateTrees(plot, palmsPerDunum) : 0);
  }, 0);
};

export const getScenarioRoCapacities = (scenario, roUnits) => {
  return scenario.roIds.reduce((acc, roId) => {
    const ro = roUnits.find(r => r.id === roId);
    if (ro) {
      acc.output += Number(ro.capacity) || 0;
      acc.input += Number(ro.inputCapacity) || 0;
    }
    return acc;
  }, { output: 0, input: 0 });
};

export const getScenarioWellCapacity = (scenario, wells) => {
  return scenario.wellIds.reduce((sum, wellId) => {
    const well = wells.find(w => w.id === wellId);
    return sum + (well ? Number(well.capacity) || 0 : 0);
  }, 0);
};
