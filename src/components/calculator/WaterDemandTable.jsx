import React from 'react';
import { BASE_DATA } from './constants';

export function WaterDemandTable({ mainResult }) {
    return (
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
                                    <td className="px-6 py-4 font-bold text-blue-600">{total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    <td className="px-6 py-4 text-gray-700">{daily.toFixed(0)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
