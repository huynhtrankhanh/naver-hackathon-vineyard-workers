import React from "react";

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, color, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-slate-100 p-3 shadow-sm text-left hover:bg-slate-50 active:scale-[.99] transition"
    >
      <div
        className={`h-8 w-8 rounded-lg bg-gradient-to-br ${color} text-white grid place-items-center mb-2`}
      >
        {icon}
      </div>
      <div className="text-xs text-slate-500">{title}</div>
      <div className="font-semibold">{value}</div>
    </button>
  );
};

export default KpiCard;
