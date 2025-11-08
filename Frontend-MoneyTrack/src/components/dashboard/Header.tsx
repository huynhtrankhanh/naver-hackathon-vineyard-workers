import React from "react";
import { Wallet } from "lucide-react";

interface HeaderProps {
  title: string;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onBack }) => {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-100">
      <div className="mx-auto max-w-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-blue-600 flex items-center justify-center shadow-sm">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div className="font-semibold">{title}</div>
        </div>
        {onBack && (
          <button onClick={onBack} className="text-sm text-blue-600">
            Back
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
