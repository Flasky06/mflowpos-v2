import React from 'react';
import { POSWorkspace } from '../../components/pos/POSWorkspace';

export const DashboardPage: React.FC = () => {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <POSWorkspace />
    </div>
  );
};
