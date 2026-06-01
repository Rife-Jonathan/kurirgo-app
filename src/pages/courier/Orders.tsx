import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import toast from 'react-hot-toast';

export default function CourierOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await apiClient('/courier/orders/available');
      setOrders(res);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Available Jobs</h1>
        <button onClick={fetchOrders} className="text-orange-600 font-medium text-sm hover:underline">Refresh</button>
      </div>
      
      {loading ? (
        <div>Loading...</div>
      ) : orders.length === 0 ? (
        <div className="text-center text-gray-400 py-10 bg-white rounded-2xl border border-gray-100">No jobs available right now.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex justify-between mb-3">
                  <span className="text-xs font-bold text-gray-400 uppercase">{order.orderCode}</span>
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">Rp {order.totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex gap-3 mb-2">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div className="w-px h-6 bg-gray-200 my-1"></div>
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  </div>
                  <div className="flex flex-col text-sm w-full">
                    <p className="truncate text-gray-700 h-8">{order.pickupAddress}</p>
                    <p className="truncate font-semibold text-gray-900">{order.destAddress}</p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500 flex justify-between">
                  <span>{order.itemType} • {order.itemWeight} kg</span>
                  <span>{order.distance.toFixed(1)} km</span>
                </div>
              </div>
              <Link to={"/courier/order/" + order.id} className="mt-4 w-full bg-gray-50 text-gray-900 text-center py-2 rounded-xl text-sm font-medium hover:bg-gray-100 transition border border-gray-200">
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
