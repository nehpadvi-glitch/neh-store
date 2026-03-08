/**
 * Admin Login Page - Simple login protection for admin panel
 * Uses HTTP Basic Auth
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AdminLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  // Handle login submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!credentials.username || !credentials.password) {
      toast.error('Please enter username and password');
      return;
    }

    setLoading(true);

    try {
      // Create base64 encoded auth header
      const authHeader = btoa(`${credentials.username}:${credentials.password}`);
      
      const response = await axios.post(
        `${API}/admin/login`,
        {},
        {
          headers: {
            Authorization: `Basic ${authHeader}`,
          },
        }
      );

      if (response.data.message === 'Login successful') {
        // Store credentials in sessionStorage for subsequent requests
        sessionStorage.setItem('adminAuth', authHeader);
        sessionStorage.setItem('adminUsername', credentials.username);
        
        toast.success('Login successful');
        navigate('/admin/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response?.status === 401) {
        toast.error('Invalid username or password');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4" data-testid="admin-login-page">
      <Card className="w-full max-w-md p-8 border-zinc-200">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-2xl font-bold text-zinc-900">Admin Login</h1>
          <p className="text-sm text-zinc-500 mt-2">Enter your credentials to access the admin panel</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              value={credentials.username}
              onChange={handleChange}
              placeholder="Enter username"
              autoComplete="username"
              data-testid="input-username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={handleChange}
                placeholder="Enter password"
                autoComplete="current-password"
                className="pr-10"
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white h-12 uppercase tracking-wider font-bold mt-6"
            data-testid="login-btn"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* Hint */}
        <div className="mt-6 p-4 bg-zinc-100 rounded-lg">
          <p className="text-xs text-zinc-500 text-center">
            Default credentials: <span className="font-mono font-medium">admin / admin123</span>
          </p>
        </div>
      </Card>
    </div>
  );
};
