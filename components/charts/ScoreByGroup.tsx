import React from 'react';
import { PermitTypeData, CityData } from '../../hooks/useScoringAnalytics';

interface ScoreByGroupProps {
  title: string;
  data: PermitTypeData[] | CityData[];
  barColor: string;
  textColor: string;
}

export const ScoreByGroup: React.FC<ScoreByGroupProps> = ({ title, data, barColor, textColor }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
            <div className="flex-1">
              <p className="text-white font-medium text-sm">{item.name}</p>
              <p className="text-slate-400 text-xs">{item.count} permits</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 bg-slate-700 rounded h-2 overflow-hidden">
                <div
                  className={barColor}
                  style={{ width: `${item.average}%`, height: '100%' }}
                ></div>
              </div>
              <p className={`${textColor} font-bold w-12 text-right`}>{item.average}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
