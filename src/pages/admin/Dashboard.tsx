import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiClient('/admin/dashboard');
        setStats(res);
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="animate-pulse flex space-x-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></div>;

  return (
    <div className="flex flex-col gap-6 w-full">      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Orders Today</p>
          <div className="mt-1 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-800">{stats.totalOrdersToday}</h3>
          </div>
        </div>
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-600">Active Deliveries</p>
          <div className="mt-1 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-orange-700">{stats.activeOrders}</h3>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Orders</p>
          <div className="mt-1 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-800">{stats.completedOrders}</h3>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Couriers</p>
          <div className="mt-1 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-800">{stats.activeCouriers}</h3>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col min-h-[500px]">
         <div className="flex justify-between items-center mb-4">
           <h2 className="text-sm font-bold text-slate-800">Live Operations Map</h2>
           <span className="flex items-center gap-2 text-xs font-bold text-slate-500">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
             LIVE TRACKING
           </span>
         </div>
         <div className="relative flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center">
            {/* Map UI Elements */}
             <div className="absolute inset-0 bg-[#e5e7eb]" style={{ backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
             
             {/* Simulated Route */}
             <svg className="absolute inset-0 h-full w-full opacity-50" preserveAspectRatio="none">
                <path d="M 100 300 Q 250 200 400 100" fill="none" stroke="#F97316" strokeWidth="2" strokeDasharray="5,5" />
                <path d="M 600 100 Q 500 300 700 400" fill="none" stroke="#F97316" strokeWidth="2" strokeDasharray="5,5" />
             </svg>
             
             {/* Random Markers */}
             <div className="absolute left-[240px] top-[190px] w-6 h-6 rounded-full bg-orange-500 border-2 border-white shadow-md animate-bounce"></div>
             <div className="absolute left-[540px] top-[290px] w-6 h-6 rounded-full bg-orange-500 border-2 border-white shadow-md"></div>
             <div className="absolute left-[340px] top-[90px] w-4 h-4 rounded-full bg-red-400 border-2 border-white shadow-md"></div>
             <div className="absolute left-[640px] top-[150px] w-4 h-4 rounded-full bg-red-400 border-2 border-white shadow-md"></div>
             
             <div className="absolute inset-x-0 bottom-4 flex justify-center">
               <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold text-slate-600 shadow-lg border border-slate-200">
                 System Operational • 42 active vehicles within range
               </div>
             </div>
         </div>
      </div>
    </div>
  );
}
