import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import toast from 'react-hot-toast';

export default function CourierOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [photo, setPhoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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

  const handleAccept = async () => {
    try {
      if (!window.confirm("Accept this job?")) return;
      await apiClient("/courier/orders/" + (id) + "/accept", { method: 'PATCH' });
      toast.success("Job accepted!");
      fetchOrder();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateStatus = async (status: string, note: string) => {
    try {
      await apiClient("/courier/orders/" + (id) + "/status", { method: 'PATCH', data: { status, note } });
      toast.success("Status updated to " + (status) + "");
      fetchOrder();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUploadProof = async () => {
    if (!photo) return toast.error("Please select a photo");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', photo);
      
      await apiClient("/courier/orders/" + (id) + "/proof", {
        method: 'POST',
        data: formData
      });
      toast.success("Proof uploaded and order marked as DELIVERED!");
      fetchOrder();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (!order) return <div className="p-4">Order not found</div>;

  return (
    <div className="w-full space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{order.orderCode}</h1>
            <p className="text-gray-500">Sender: {order.sender?.name} ({order.sender?.phone})</p>
          </div>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 font-medium rounded-full text-xs">
            {order.status}
          </span>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex justify-between font-bold text-lg mb-2">
            <span>Earnings</span>
            <span className="text-orange-600">Rp {order.totalPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Payment Method</span>
            <span className="font-medium text-gray-900">{order.paymentMethod} ({order.paymentStatus})</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 py-2">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-0.5"><span className="text-xs font-bold">A</span></div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Pickup Address</p>
              <p className="font-medium text-gray-900 mt-1">{order.pickupAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5"><span className="text-xs font-bold">B</span></div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Destination Address</p>
              <p className="font-medium text-gray-900 mt-1">{order.destAddress}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="font-bold text-lg mb-4">Courier Actions</h2>
        
        {order.status === "PENDING" && (
          <button onClick={handleAccept} className="w-full bg-orange-600 text-white rounded-xl py-3 font-medium hover:bg-orange-700">
            Accept Job
          </button>
        )}

        {order.status === "CONFIRMED" && (
           <button onClick={() => handleUpdateStatus("PICKED_UP", "Courier has picked up the item")} className="w-full bg-gray-900 text-white rounded-xl py-3 font-medium hover:bg-gray-800">
             Mark as Picked Up
           </button>
        )}

        {order.status === "PICKED_UP" && (
           <button onClick={() => handleUpdateStatus("ON_DELIVERY", "Courier is on the way to destination")} className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium hover:bg-blue-700">
             Start Delivery
           </button>
        )}

        {order.status === "ON_DELIVERY" && (
           <div className="space-y-4">
             <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100" />
                {photo && <p className="text-sm mt-3 text-green-600 font-medium">{photo.name} selected</p>}
             </div>
             <button disabled={!photo || uploading} onClick={handleUploadProof} className="w-full bg-green-600 text-white rounded-xl py-3 font-medium hover:bg-green-700 disabled:opacity-50">
               {uploading ? "Uploading..." : "Upload Proof & Mark Delivered"}
             </button>
           </div>
        )}

        {order.status === "DELIVERED" && (
          <div className="text-center p-4 bg-orange-50 text-orange-700 rounded-xl font-medium">
            Waiting for sender to confirm receipt...
          </div>
        )}

        {order.status === "COMPLETED" && (
          <div className="text-center p-4 bg-green-50 text-green-700 rounded-xl font-medium">
            Job Completed!
          </div>
        )}
      </div>
    </div>
  );
}
