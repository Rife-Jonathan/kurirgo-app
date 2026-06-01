import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import toast from 'react-hot-toast';

export default function CourierHistory() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await apiClient('/courier/orders/my');
      setOrders(res);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Job History</h1>
      
      {loading ? (
        <div className="animate-pulse flex space-x-4"><div className="h-4 bg-gray-200 rounded w-full"></div></div>
      ) : orders.length === 0 ? (
        <div className="text-center text-gray-400 py-10 bg-white rounded-2xl border border-gray-100">No jobs found.</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                <th className="p-4 font-medium">Order ID</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Earnings</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="p-4 text-sm font-medium">{order.orderCode}</td>
                  <td className="p-4 text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-sm text-gray-600">Rp {order.totalPrice.toLocaleString()}</td>
                  <td className="p-4 text-sm">
                    <span className={"px-3 py-1 rounded-full text-xs font-medium " + (order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700')}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    <Link to={"/courier/order/" + (order.id) + ""} className="text-blue-600 font-medium hover:underline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
