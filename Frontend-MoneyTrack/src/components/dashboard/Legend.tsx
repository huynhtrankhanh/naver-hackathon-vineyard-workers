import React from "react";

interface LegendProps {
  label: string;
  value: string;
  colorClass: string;
}

const Legend: React.FC<LegendProps> = ({ label, value, colorClass }) => {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${colorClass}`}></span>
      <div className="text-xs">
        <div className="font-medium text-slate-700">{label}</div>
        <div className="text-slate-500">{value}</div>
      </div>
    </div>
  );
};

export default Legend;
