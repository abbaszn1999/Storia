import { StatCard } from '../stat-card';
import { Video } from 'lucide-react';

export default function StatCardExample() {
  return (
    <div className="p-8 max-w-sm">
      <StatCard
        title="Total Videos"
        value={24}
        icon={Video}
        description="Active projects"
        trend={{ value: 12, isPositive: true }}
      />
    </div>
  );
}
