import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await apiClient('/orders/my');
      setOrders(data);
      const active = data.find((o: any) => ["PENDING", "CONFIRMED", "PICKED_UP", "ON_DELIVERY"].includes(o.status));
      setActiveOrder(active);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse flex space-x-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></div>;

  const inProgressCount = orders.filter(o => ["PENDING", "CONFIRMED", "PICKED_UP", "ON_DELIVERY"].includes(o.status)).length;
  const completedCount = orders.filter(o => o.status === "COMPLETED").length;
  const totalSpend = orders.filter(o => o.status === "COMPLETED").reduce((acc, curr) => acc + curr.totalPrice, 0);

  const recentOrders = orders.slice(0, 3); // top 3 recent orders

  return (
    <div className="grid grid-cols-12 gap-6 w-full">
      {/* Left: Tracking & Stats */}
      <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">In Progress</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-800">{inProgressCount.toString().padStart(2, '0')}</h3>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-800">{completedCount}</h3>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Spend</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-800">Rp {(totalSpend / 1000).toFixed(0)}K</h3>
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

             {/* Pickup Marker */}
             <div className="absolute left-[80px] top-[290px] flex flex-col items-center">
               <div className="h-8 w-8 rounded-full bg-green-500 border-4 border-white shadow-lg"></div>
               <span className="mt-1 rounded bg-white px-2 py-1 text-[10px] font-bold shadow-sm">PICKUP</span>
             </div>

             {/* Courier Marker */}
             {activeOrder.status === 'ON_DELIVERY' && (
               <div className="absolute left-[240px] top-[190px] flex flex-col items-center animate-bounce">
                 <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 border-4 border-white shadow-xl">
                    <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7h-3v7h3.05a2.5 2.5 0 014.9 0H18a1 1 0 001-1V7a1 1 0 00-1-1h-4z"/></svg>
                 </div>
               </div>
             )}

             {/* Destination Marker */}
             <div className="absolute left-[390px] top-[90px] flex flex-col items-center">
               <div className="h-8 w-8 rounded-full bg-red-500 border-4 border-white shadow-lg"></div>
               <span className="mt-1 rounded bg-white px-2 py-1 text-[10px] font-bold shadow-sm">DESTINATION</span>
             </div>

             {/* Tracking Overlays */}
             <div className="absolute left-6 top-6 max-w-xs rounded-2xl bg-white/90 p-4 shadow-xl backdrop-blur-md">
               <div className="flex items-center gap-3">
                 <img src={"https://api.dicebear.com/7.x/initials/svg?seed=" + (activeOrder.courier?.name || 'Courier')} className="h-10 w-10 rounded-full border border-slate-200" alt="courier" />
                 <div>
                   <p className="text-sm font-bold">{activeOrder.courier?.name || 'Waiting for Courier'}</p>
                   {activeOrder.courier && <p className="text-[10px] font-medium text-slate-500">{activeOrder.courier.phone}</p>}
                 </div>
                 <div className="ml-auto rounded-full bg-orange-100 px-2 py-1 text-[10px] font-bold text-orange-600">{activeOrder.status}</div>
               </div>
               <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                 <div className="flex justify-between text-xs">
                   <span className="text-slate-500">Destination</span>
                   <span className="font-bold truncate max-w-[120px]" title={activeOrder.destAddress}>{activeOrder.destAddress}</span>
                 </div>
                 <Link to={"/sender/order/" + activeOrder.id} className="block mt-2 text-center text-xs font-bold text-orange-600 hover:underline">
                   View Full Details
                 </Link>
               </div>
             </div>
          </div>
        ) : (
          <div className="relative flex-1 min-h-[400px] flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm p-8 text-center text-slate-500">
             <div className="h-16 w-16 mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
             </div>
             <p className="text-lg font-bold text-slate-700">No active deliveries</p>
             <p className="mt-1 text-sm font-medium opacity-80">You don't have any packages on the way right now.</p>
             <Link to="/sender/order/new" className="mt-6 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-orange-200 hover:bg-orange-600 transition-colors">
               Create New Order
             </Link>
          </div>
        )}
      </div>

      {/* Right: Order List */}
      <div className="col-span-12 xl:col-span-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-600">Recent Shipments</h2>
          <Link to="/sender/history" className="text-xs font-bold text-orange-600 hover:underline">See All</Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-sm text-slate-500 text-center py-8">No recent orders found.</div>
        ) : (
          recentOrders.map((order, idx) => {
            const statusConfig = {
              "COMPLETED": { bg: "bg-green-50", text: "text-green-600" },
              "CANCELLED": { bg: "bg-slate-100", text: "text-slate-500" },
              "PENDING": { bg: "bg-blue-50", text: "text-blue-600" },
              "DEFAULT": { bg: "bg-orange-50", text: "text-orange-600" }
            } as any;
            const style = statusConfig[order.status] || statusConfig["DEFAULT"];

            return (
              <Link to={"/sender/order/" + order.id} key={order.id} className={"group relative flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md " + (order.status === 'CANCELLED' ? 'opacity-70' : '')}>
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-slate-300">#{order.orderCode}</span>
                  <span className={"rounded-full px-2 py-1 text-[10px] font-bold " + style.bg + " " + style.text}>{order.status}</span>
                </div>
                <div>
                  <p className="text-sm font-bold">{order.itemType.replace("_", " ")}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{order.pickupAddress} &rarr; {order.destAddress}</p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                  <span className="text-sm font-bold text-slate-800">Rp {order.totalPrice.toLocaleString()}</span>
                  <span className="text-[10px] font-medium text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            )
          })
        )}

        {/* Promotional Banner */}
        <div className="mt-auto rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-5 text-white shadow-lg">
           <h4 className="text-sm font-bold">Go Business Premium</h4>
           <p className="mt-1 text-[11px] leading-relaxed opacity-80">Get 20% discount on all deliveries by switching to our monthly subscription.</p>
           <button className="mt-3 w-full rounded-lg bg-white py-2 text-xs font-bold text-orange-600 shadow-sm active:scale-95 transition-transform">Upgrade Now</button>
        </div>
      </div>
    </div>
  );
}
