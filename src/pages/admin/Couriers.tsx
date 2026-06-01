import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import toast from 'react-hot-toast';

export default function AdminCouriers() {
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCouriers = async () => {
    try {
      const res = await apiClient('/admin/couriers');
      setCouriers(res);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCouriers();
  }, []);

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await apiClient("/admin/couriers/" + (id) + "", { method: 'PATCH', data: { isActive } });
      toast.success("Courier " + (isActive ? 'activated' : 'deactivated') + "");
      fetchCouriers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Couriers</h1>
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Phone</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {couriers.map(courier => (
                <tr key={courier.id} className="border-b border-gray-50 hover:bg-gray-50 transition text-sm">
                  <td className="p-4 font-bold text-gray-800">{courier.name}</td>
                  <td className="p-4 text-gray-600">{courier.email}</td>
                  <td className="p-4 text-gray-600">{courier.phone}</td>
                  <td className="p-4">
                    {courier.isActive ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">ACTIVE</span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">INACTIVE</span>
                    )}
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => toggleActive(courier.id, !courier.isActive)}
                      className={"px-3 py-1.5 rounded-lg text-xs font-bold text-white transition " + (courier.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700') + ""}
                    >
                      {courier.isActive ? 'Deactivate' : 'Activate'}
                    </button>
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
