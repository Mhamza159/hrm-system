/**
 * @file DepartmentStatsCards.jsx
 * @description Dynamic KPI metric cards for department organizational structures.
 */

import React from 'react';
import { Building2, Network, Archive, Users, FolderMinus } from 'lucide-react';
import { StatCard } from '../../../components/common/StatCard.jsx';

export function DepartmentStatsCards({ stats = {}, isLoading = false }) {
  const {
    total = 0,
    active = 0,
    archived = 0,
    withEmployees = 0,
    withoutEmployees = 0
  } = stats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      <StatCard
        title="Total Units"
        value={total}
        icon={Building2}
        description="Registered corporate divisions"
        loading={isLoading}
      />
      <StatCard
        title="Active Units"
        value={active}
        icon={Network}
        description="Operating business units"
        loading={isLoading}
      />
      <StatCard
        title="Archived Units"
        value={archived}
        icon={Archive}
        description="Units in cold storage"
        loading={isLoading}
      />
      <StatCard
        title="With Assigned Staff"
        value={withEmployees}
        icon={Users}
        description="Units with active personnel"
        loading={isLoading}
      />
      <StatCard
        title="Empty Units"
        value={withoutEmployees}
        icon={FolderMinus}
        description="Unallocated business units"
        loading={isLoading}
      />
    </div>
  );
}
