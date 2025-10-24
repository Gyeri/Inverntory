import React from 'react';

const InventoryManagement = () => {
  console.log('InventoryManagement component rendering...');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your product inventory and stock levels
          </p>
        </div>
      </div>
      
      <div className="card">
        <div className="card-body">
          <p>Inventory Management is loading...</p>
        </div>
      </div>
    </div>
  );
};

export default InventoryManagement;

