import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import toast from 'react-hot-toast';
import { useSocket } from '../../hooks/useSocket';
import TrackingMap from '../../components/TrackingMap';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  const fetchOrder = async () => {
    try {
      const res = await apiClient("/orders/" + (id) + "");
      setOrder(res);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (!socket) return;
    
    socket.on("order:status_updated", (data: any) => {
      if (data.orderId === id) {
        toast("Order status updated to " + (data.status) + "");
        fetchOrder();
      }
    });

    return () => {
      socket.off("order:status_updated");
    }
  }, [socket, id]);

  const handlePay = async () => {
    try {
      if (!window.confirm('Simulate Bank Transfer Payment?')) return;
      await apiClient("/orders/" + (id) + "/pay", { method: 'PATCH' });
      toast.success("Payment successful");
      fetchOrder();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleComplete = async () => {
    try {
      if (!window.confirm('Confirm you have received the package?')) return;
      await apiClient("/orders/" + (id) + "/complete", { method: 'PATCH' });
      toast.success("Order completed!");
      fetchOrder();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCancel = async () => {
    try {
      if (!window.confirm('Are you sure you want to cancel this order?')) return;
      const reason = prompt("Reason for cancellation?");
      await apiClient("/orders/" + (id) + "/cancel", { method: 'POST', data: { cancelReason: reason } });
      toast.success("Order cancelled");
      fetchOrder();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (!order) return <div className="p-4">Order not found</div>;

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{order.orderCode}</h1>
          <p className="text-gray-500">Status: <strong className="text-orange-600">{order.status}</strong></p>
        </div>
        <div className="space-x-3">
          {order.status === "PENDING" && (
            <button onClick={handleCancel} className="px-4 py-2 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition">Cancel Order</button>
          )}
          {order.paymentMethod === "TRANSFER" && order.paymentStatus === "UNPAID" && (
            <button onClick={handlePay} className="px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition">Pay Now</button>
          )}
          {order.status === "DELIVERED" && (
            <button onClick={handleComplete} className="px-4 py-2 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition">Confirm Received</button>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <TrackingMap pickup={[order.pickupLat, order.pickupLng]} dest={[order.destLat, order.destLng]} orderId={order.id!} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-bold text-lg text-gray-800 border-b pb-2">Order Info</h2>
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-gray-500">Pickup</span>
            <strong className="text-gray-900">{order.pickupAddress}</strong>
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-gray-500">Destination</span>
            <strong className="text-gray-900">{order.destAddress}</strong>
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-gray-500">Item Details</span>
            <strong className="text-gray-900">{order.itemType} - {order.itemWeight} kg</strong>
            {order.itemDescription && <span className="italic">{order.itemDescription}</span>}
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-gray-500">Courier</span>
            {order.courier ? (
              <strong className="text-gray-900">{order.courier.name} ({order.courier.phone})</strong>
            ) : <span className="text-gray-400">Waiting for assign...</span>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-bold text-lg text-gray-800 border-b pb-2">Status Logs</h2>
          <div className="space-y-4">
            {order.statusLogs?.map((log: any, idx: number) => (
              <div key={log.id} className="flex gap-4 relative">
                {idx !== order.statusLogs.length - 1 && (
                  <div className="absolute top-6 bottom-[-20px] left-1 w-px bg-gray-200"></div>
                )}
                <div className="w-2.5 h-2.5 rounded-full bg-orange-400 mt-1.5 z-10 shrink-0"></div>
                <div>
                  <p className="font-semibold text-gray-800">{log.status}</p>
                  <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
                  {log.note && <p className="text-sm text-gray-600 mt-1">{log.note}</p>}
                </div>
              </div>
            ))}
          </div>

          {order.proofPhotoUrl && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-bold text-sm text-gray-700 mb-2">Proof of Delivery</h3>
              <img src={order.proofPhotoUrl.startsWith('http') ? order.proofPhotoUrl : `${import.meta.env.VITE_API_URL || ''}${order.proofPhotoUrl}`.replace('/api/uploads', '/uploads')} alt="Proof" className="w-full rounded-xl border" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
