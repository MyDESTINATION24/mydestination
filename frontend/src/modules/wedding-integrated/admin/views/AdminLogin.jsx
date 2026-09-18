import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, ArrowRight, Mail, Lock, Eye, EyeOff } from "lucide-react";
import toast from 'react-hot-toast';
import { api } from "../../../../services/apiService";
import logoImg from "../../assets/logo.png";
import weddingImg from "../../assets/wedding_pink.png";

const AdminLogin = () => {
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Email and Password are required.");
      return;
    }

    setLoadingSubmit(true);
    try {
      const response = await api.post('/wedding/admin/login', formData);
      if (response.data.success) {
        localStorage.setItem("admin_token", response.data.token);
        localStorage.setItem("admin_user", JSON.stringify(response.data.admin));
        toast.success("Admin login successful!");
        navigate("/wedding/admin/dashboard");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const inputClass =
    "w-full px-6 py-4 rounded-full bg-white/20 border border-white/30 text-white placeholder:text-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 transition-all backdrop-blur-md";

  return (
    <div 
      className="wedding-module min-h-screen w-full flex items-center justify-center relative overflow-hidden font-inter"
      style={{
        backgroundImage: `url(${weddingImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Custom Style for Autofill Fix */}
      <style>
        {`
          input:-webkit-autofill,
          input:-webkit-autofill:hover, 
          input:-webkit-autofill:focus, 
          input:-webkit-autofill:active {
              -webkit-box-shadow: 0 0 0 1000px rgba(255, 255, 255, 0.1) inset !important;
              -webkit-text-fill-color: white !important;
              transition: background-color 5000s ease-in-out 0s;
          }
        `}
      </style>

      {/* Dark Overlay for contrast */}
      <div className="absolute inset-0 bg-black/40 backdrop-brightness-[0.85]" />

      <div className="w-full max-w-6xl h-full flex flex-col md:flex-row relative z-10 px-4 md:px-12">
        
        {/* Left Side: Catchy Text */}
        <div className="w-full md:w-1/2 flex flex-col justify-center py-12 md:py-0 text-white">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tighter mb-8 drop-shadow-2xl">
            Experience <br />
            <span className="text-pink-300">The Magic.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-md font-medium drop-shadow-md">
            Manage the world's most exquisite destination weddings from your control panel.
          </p>
        </div>

        {/* Right Side: Glassmorphism Form */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center relative">
          <div className="w-full max-w-md bg-white/10 backdrop-blur-2xl p-8 md:p-12 rounded-[2.5rem] border border-white/20 shadow-2xl animate-wedding-fade-up">
            
            <div className="mb-10 text-center md:text-left">
              <div className="mb-6 flex justify-center md:justify-start">
                 <img src={logoImg} alt="Logo" className="h-16 w-auto object-contain drop-shadow-xl" />
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">Admin Login</h2>
              <div className="h-1 w-12 bg-pink-400 mt-2 mx-auto md:mx-0 rounded-full" />
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/70 ml-2">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 z-10" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleChange}
                    className={`${inputClass} pl-14`}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/70 ml-2">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 z-10" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className={`${inputClass} pl-14 pr-14`}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors z-10"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loadingSubmit}
                  className="w-full flex justify-center items-center gap-3 py-4 px-8 rounded-full text-sm font-black text-slate-900 bg-white hover:bg-pink-50 transition-all shadow-[0_15px_30px_rgba(255,255,255,0.2)] active:scale-[0.98] disabled:opacity-70"
                >
                  {loadingSubmit ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Login to account <ArrowRight className="w-4 h-4" strokeWidth={3} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          
          <p className="absolute bottom-[-60px] text-white/30 text-[10px] uppercase tracking-[0.2em] font-bold">
             My Destination Wedding Operations
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
