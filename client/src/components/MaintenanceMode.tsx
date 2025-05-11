import React from 'react';
import { AlertCircle, Wrench, Shield } from 'lucide-react';

const MaintenanceMode: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-95 z-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card p-8 rounded-lg shadow-lg">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Wrench className="h-10 w-10 text-primary" />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground">Site Under Maintenance</h1>
          
          <p className="text-muted-foreground">
            We're currently performing scheduled maintenance on our systems to enhance your experience.
            Please check back soon.
          </p>
          
          <div className="bg-slate-800 p-4 rounded-md w-full mt-4">
            <div className="flex items-center space-x-2 text-amber-400 mb-2">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Estimated Downtime</span>
            </div>
            <p className="text-slate-300 text-sm">
              Our team is working to complete maintenance as quickly as possible.
              The site should be back online shortly.
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-2 text-muted-foreground text-sm mt-6">
            <Shield className="h-4 w-4" />
            <span>Admin users can still access the site</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceMode;