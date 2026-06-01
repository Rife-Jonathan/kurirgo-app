import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import toast from 'react-hot-toast';

export default function CourierDashboard() {
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [earnings, setEarnings] = useState({ totalOrders: 0, earnings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [ordersRes, earningsRes] = await Promise.all([
        apiClient('/courier/orders/my'),
        apiClient('/courier/earnings')
      ]);
      const active = ordersRes.find((o: any) => ["CONFIRMED", "PICKED_UP", "ON_DELIVERY", "DELIVERED"].includes(o.status));
      setActiveOrder(active);
      setEarnings(earningsRes);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse flex space-x-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></div>;

  return (
    <div className="grid grid-cols-12 gap-6 w-full">
      {/* Left: Stats & Map */}
      <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Today's Earnings</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-800">Rp {earnings.earnings.toLocaleString()}</h3>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Today</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-800">{earnings.totalOrders}</h3>
          </div>
        </div>

        {/* Live Tracking Map Placeholder */}
        {activeOrder ? (
          <div className="relative flex-1 min-h-[400px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
             {/* Map UI Elements */}
             <div className="absolute inset-0 bg-[#e5e7eb]" style={{ backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
             
             {/* Simulated Route */}
             <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                <path d="M 100 300 Q 250 200 400 100" fill="none" stroke="#F97316" strokeWidth="4" strokeDasharray="10,10" />
             </svg>

             {/* Vehicle Marker */}
             <div className="absolute left-[240px] top-[190px] flex flex-col items-center animate-bounce">
               <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 border-4 border-white shadow-xl">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7h-3v7h3.05a2.5 2.5 0 014.9 0H18a1 1 0 001-1V7a1 1 0 00-1-1h-4z"/></svg>
               </div>
             </div>

             {/* Tracking Overlays */}
             <div className="absolute left-6 top-6 max-w-sm rounded-2xl bg-white/90 p-4 shadow-xl backdrop-blur-md">
               <div className="flex justify-between items-start mb-3">
                 <div>
                   <p className="text-sm font-bold text-slate-800">Current Job</p>
                   <p className="text-[10px] font-medium text-slate-500">#{activeOrder.orderCode}</p>
                 </div>
                 <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-bold text-blue-700">{activeOrder.status}</span>
               </div>
               <div className="space-y-3 border-t border-slate-200 pt-3">
                 <div>
                   <p className="text-[10px] font-bold uppercase text-slate-400">Pickup</p>
                   <p className="text-xs font-medium text-slate-700 truncate">{activeOrder.pickupAddress}</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold uppercase text-slate-400">Destination</p>
                   <p className="text-xs font-medium text-slate-700 truncate">{activeOrder.destAddress}</p>
                 </div>
                 <Link to={"/courier/order/" + activeOrder.id} className="block mt-4 rounded-lg bg-orange-600 py-2.5 text-center text-xs font-bold text-white shadow-sm hover:bg-orange-700 transition-colors">
                   View Active Job Details
                 </Link>
               </div>
             </div>
          </div>
        ) : (
          <div className="relative flex-1 min-h-[400px] flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm p-8 text-center text-slate-500">
             <div className="h-16 w-16 mb-4 rounded-full bg-orange-50 border-4 border-orange-100 flex items-center justify-center animate-pulse">
                <svg className="h-6 w-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
             </div>
             <p className="text-lg font-bold text-slate-700">You are currently idle</p>
             <p className="mt-1 text-sm font-medium opacity-80">Ready to take on a new delivery?</p>
             <Link to="/courier/orders" className="mt-6 rounded-full bg-slate-900 px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-slate-800 transition-colors active:scale-95">
               Find New Jobs
             </Link>
          </div>
        )}
      </div>

      {/* Right column: Placeholder or useful widget */}
       <div className="col-span-12 xl:col-span-4 flex flex-col gap-4">
        {/* Promotional Banner */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white shadow-lg">
           <div className="flex justify-between items-center mb-4">
             <h4 className="text-sm font-bold">Courier Performance</h4>
             <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full font-bold">TOP 5%</span>
           </div>
           <div className="space-y-3">
             <div>
               <div className="flex justify-between text-xs mb-1">
                 <span className="opacity-80">Acceptance Rate</span>
                 <span className="font-bold">98%</span>
               </div>
               <div className="w-full bg-white/10 rounded-full h-1.5"><div className="bg-green-400 h-1.5 rounded-full w-[98%]"></div></div>
             </div>
             <div>
               <div className="flex justify-between text-xs mb-1">
                 <span className="opacity-80">On-Time Delivery</span>
                 <span className="font-bold">95%</span>
               </div>
               <div className="w-full bg-white/10 rounded-full h-1.5"><div className="bg-green-400 h-1.5 rounded-full w-[95%]"></div></div>
             </div>
           </div>
        </div>

        <div className="mt-auto p-5 border border-slate-200 bg-white rounded-2xl shadow-sm text-center text-sm text-slate-500">
          <p className="font-bold text-slate-700 mb-1">Need support?</p>
          <p>Contact dispatcher if you have issues during delivery.</p>
          <button className="mt-4 w-full py-2 bg-slate-100 font-bold hover:bg-slate-200 rounded-lg text-slate-700 transition-colors">Call Dispatch</button>
        </div>
      </div>
    </div>
  );
}
