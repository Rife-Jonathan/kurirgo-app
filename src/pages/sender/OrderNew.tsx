import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LocationPicker from '../../components/LocationPicker';
import { apiClient } from '../../api/client';
import toast from 'react-hot-toast';

export default function OrderNew() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Pickup, 2: Destination, 3: Details & Confirmation
  
  const [form, setForm] = useState({
    pickupAddress: '', pickupLat: 0, pickupLng: 0,
    destAddress: '', destLat: 0, destLng: 0,
    itemType: 'DOCUMENT', itemWeight: 1, itemDescription: '', paymentMethod: 'COD'
  });

  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculateEstimate = async () => {
    try {
      setLoading(true);
      const res = await apiClient("/orders/estimate?pickupLat=" + form.pickupLat + "&pickupLng=" + form.pickupLng + "&destLat=" + form.destLat + "&destLng=" + form.destLng + "&itemType=" + form.itemType + "&itemWeight=" + form.itemWeight);
      setEstimate(res);
      setStep(3);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await apiClient('/orders', { method: 'POST', data: form });
      toast.success("Order Created successfully!");
      navigate("/sender/order/" + res.id);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Delivery</h1>
      
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-700">1. Pickup Location</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Address</label>
            <input type="text" className="w-full px-4 py-2 border rounded-xl" value={form.pickupAddress} onChange={e => setForm({...form, pickupAddress: e.target.value})} placeholder="e.g. Jl. Merdeka No.1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pin on Map</label>
            <LocationPicker onLocationSelect={(lat, lng) => setForm({...form, pickupLat: lat, pickupLng: lng})} />
          </div>
          <button 
            disabled={!form.pickupAddress || !form.pickupLat} 
            onClick={() => setStep(2)}
            className="w-full bg-orange-600 text-white py-3 rounded-xl hover:bg-orange-700 disabled:opacity-50"
          >Continue to Destination</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-700">2. Destination Location</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Address</label>
            <input type="text" className="w-full px-4 py-2 border rounded-xl" value={form.destAddress} onChange={e => setForm({...form, destAddress: e.target.value})} placeholder="e.g. Jl. Sudirman No.2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pin on Map</label>
            <LocationPicker onLocationSelect={(lat, lng) => setForm({...form, destLat: lat, destLng: lng})} />
          </div>
          <div className="flex gap-4">
            <button onClick={() => setStep(1)} className="w-1/3 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200">Back</button>
            <button 
              disabled={!form.destAddress || !form.destLat} 
              onClick={calculateEstimate}
              className="w-2/3 bg-orange-600 text-white py-3 rounded-xl hover:bg-orange-700 disabled:opacity-50"
            >Check Pricing</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h2 className="font-semibold text-gray-700">3. Package Details & Payment</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Item Type</label>
              <select className="w-full px-4 py-2 border rounded-xl" value={form.itemType} onChange={e => {setForm({...form, itemType: e.target.value}); setEstimate(null);}}>
                <option value="DOCUMENT">Document</option>
                <option value="SMALL_PACKAGE">Small Package</option>
                <option value="MEDIUM_PACKAGE">Medium Package</option>
                <option value="LARGE_PACKAGE">Large Package</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Weight (kg)</label>
              <input type="number" min="0.1" step="0.1" className="w-full px-4 py-2 border rounded-xl" value={form.itemWeight} onChange={e => {setForm({...form, itemWeight: parseFloat(e.target.value)}); setEstimate(null);}} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Item Description (Optional)</label>
            <input type="text" className="w-full px-4 py-2 border rounded-xl" value={form.itemDescription} onChange={e => setForm({...form, itemDescription: e.target.value})} placeholder="e.g. Baju kemeja putih" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Payment Method</label>
            <select className="w-full px-4 py-2 border rounded-xl" value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})}>
              <option value="COD">Cash on Delivery (COD)</option>
              <option value="TRANSFER">Bank Transfer (Simulated)</option>
            </select>
          </div>

          {!estimate ? (
            <button onClick={calculateEstimate} className="w-full bg-orange-100 text-orange-700 py-3 rounded-xl font-medium">Recalculate Estimate</button>
          ) : (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-2">Price Breakdown</h3>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Distance ({estimate.distance.toFixed(1)} km)</span>
                <span>Rp {estimate.distancePrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Base Price</span>
                <span>Rp {estimate.basePrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-lg mt-3 pt-3 border-t">
                <span>Total</span>
                <span className="text-orange-600">Rp {estimate.totalPrice.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button onClick={() => setStep(2)} className="w-1/3 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200">Back</button>
            <button 
              disabled={loading || !estimate} 
              onClick={handleSubmit}
              className="w-2/3 bg-orange-600 text-white py-3 rounded-xl hover:bg-orange-700 font-medium disabled:opacity-50"
            >Create Order</button>
          </div>
        </div>
      )}
    </div>
  );
}
