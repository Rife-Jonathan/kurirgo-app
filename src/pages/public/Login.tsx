import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { apiClient } from '../../api/client';
import toast from 'react-hot-toast';
import { Package } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('sender1@kurir.com');
  const [password, setPassword] = useState('sender123');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient('/auth/login', {
        method: 'POST',
        data: { email, password }
      });
      login(res.token, res.user);
      navigate("/" + (res.user.role.toLowerCase()) + "/dashboard");
      toast.success("Welcome back!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
        <div className="flex flex-col items-center justify-center mb-8">
          <span className="text-3xl font-bold text-orange-600 flex items-center gap-2">
            <Package className="w-8 h-8" /> KurirGO
          </span>
          <span className="text-xs text-gray-400 mt-1">by nusawebsite</span>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-orange-600 text-white font-medium py-3 rounded-xl hover:bg-orange-700 transition flex justify-center items-center"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-500">
          Don't have an account? <Link to="/register" className="text-orange-600 font-medium">Register here</Link>
        </p>

        <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-center text-gray-400">
          Demo Accounts:<br/>
          Sender: sender1@kurir.com / sender123<br/>
          Courier: kurir1@kurir.com / kurir123<br/>
          Admin: admin@kurir.com / admin123
        </div>
      </div>
    </div>
  );
}
