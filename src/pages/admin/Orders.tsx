import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [couriers, setCouriers] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, couriersRes] = await Promise.all([
        apiClient('/admin/orders'),
        apiClient('/admin/couriers')
      ]);
      setOrders(ordersRes);
      setCouriers(couriersRes.filter((c: any) => c.isActive));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (orderId: string, courierId: string) => {
    try {
      if (!window.confirm("Assign this courier to the order?")) return;
      await apiClient("/admin/orders/" + (orderId) + "/assign", { method: 'PATCH', data: { courierId } });
      toast.success("Courier assigned successfully");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Orders</h1>
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                <th className="p-4 font-medium">Order ID</th>
                <th className="p-4 font-medium">Sender</th>
                <th className="p-4 font-medium">Dest</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Courier</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition text-sm">
                  <td className="p-4 font-medium text-gray-700">{order.orderCode}</td>
                  <td className="p-4">{order.sender?.name}</td>
                  <td className="p-4 max-w-[150px] truncate">{order.destAddress}</td>
                  <td className="p-4 font-bold text-gray-600">{order.status}</td>
                  <td className="p-4">
                    {order.courier ? (
                      <span className="text-gray-800">{order.courier.name}</span>
                    ) : order.status === "PENDING" ? (
                      <select 
                        onChange={(e) => handleAssign(order.id, e.target.value)}
                        className="p-1.5 border rounded-lg text-sm bg-white"
                        defaultValue=""
                      >
                        <option value="" disabled>Assign...</option>
                        {couriers.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    ) : (
                      "-"
                    )}
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
