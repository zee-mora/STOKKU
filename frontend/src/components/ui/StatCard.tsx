import React from "react";
import { TrendingUp } from "lucide-react";

interface StatsProps {
  Icon: any;
  title: string;
  value: number;
  color: string;
  bgColor: string;
  percentage?: number;
}

const StatCard: React.FC<StatsProps> = ({
  Icon,
  title,
  value,
  color,
  bgColor,
  percentage,
}: {
  Icon: any;
  title: string;
  value: number;
  color: string;
  bgColor: string;
  percentage?: number;
}) => (
  <div
    className={`${bgColor} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
  >
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="text-sm font-medium opacity-90">{title}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
      </div>
      <div className={`${color} p-3 rounded-full bg-white/20 backdrop-blur-sm`}>
        {Icon && <Icon size={24} />}
      </div>
    </div>
    {percentage !== undefined && (
      <div className="text-xs opacity-75 flex items-center gap-1">
        <TrendingUp size={14} />
        {percentage}% dari total
      </div>
    )}
  </div>
);

export default StatCard;
