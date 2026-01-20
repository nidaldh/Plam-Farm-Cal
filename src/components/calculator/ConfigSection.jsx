import React from 'react';
import { ConfigInput } from './UI';

export function ConfigSection({ config, updateConfig, palmsPerDunum, setPalmsPerDunum }) {
    return (
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
    );
}
