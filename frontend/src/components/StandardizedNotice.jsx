import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

const StandardizedNotice = ({ featureName = "Input Features" }) => {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg mb-6 shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-semibold text-amber-900">
            Standardized Research Dataset Feature Notice (RES-IPRC-2025-003)
          </h3>
          <div className="mt-1 text-xs text-amber-800 leading-relaxed">
            <p>
              Values displayed for <strong>{featureName}</strong> are <em>Z-score standardized</em> (mean = 0, standard deviation = 1).
              Negative scores indicate below-average observations within the normalized baseline, NOT negative physical consumption.
              Only <strong>Carbon_Emission_kgCO2</strong> is a raw physical measurement (kg CO2).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandardizedNotice;

