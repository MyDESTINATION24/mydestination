import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCategories } from "../../data/categoryApi";
import { useAuth } from "../../context/AuthContext";
import { Loader2, ArrowRight, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";

const VendorSignup = () => {
  const [categories, setCategories] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
  });
  const [errors, setErrors] = useState({});

  const defaultCategories = [
    { _id: '1', name: 'Wedding Planner' },
    { _id: '2', name: 'Photographers' },
    { _id: '3', name: 'Bridal Wear' },
    { _id: '4', name: 'Food & Catering' },
    { _id: '5', name: 'Pre Wedding Shoot' },
    { _id: '6', name: 'Venue Manager' }
  ];

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await getCategories();
        if (res.success && res.categories && res.categories.length > 0) {
          setCategories(res.categories);
        } else {
          setCategories(defaultCategories);
        }
      } catch (error) {
        setCategories(defaultCategories);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchCats();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "name" && !/^[a-zA-Z\s]*$/.test(value)) {
      return;
    }

    if (name === "phone") {
      // Only allow numbers
      if (value && !/^\d*$/.test(value)) return;

      if (value.length > 10) {
        toast.error("Phone number cannot exceed 10 digits", { id: "phone_max" });
        return;
      }

      if (value.length > 0 && value.length < 10) {
        setErrors(prev => ({ ...prev, phone: "Phone number must be exactly 10 digits" }));
      } else {
        setErrors(prev => { const newErr = {...prev}; delete newErr.phone; return newErr; });
      }
    }

    if (name === "email") {
      // Strictly allow only specified TLDs (.com, .in, .co.in, .org, .net, .edu, .gov, .co, .io, .me)
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in|co\.in|org|net|edu|gov|co|io|me)$/i;
      if (value && !emailRegex.test(value)) {
        setErrors(prev => ({ ...prev, email: "Please enter a valid email address (e.g. abhi@gmail.com, careers@tech.io)" }));
      } else {
        setErrors(prev => { const newErr = {...prev}; delete newErr.email; return newErr; });
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.values(formData).some((v) => !v.trim())) {
      toast.error("All fields are required.");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in|co\.in|org|net|edu|gov|co|io|me)$/i;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address.");
      setErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
      return;
    }
    
    if (formData.phone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number.");
      setErrors(prev => ({ ...prev, phone: "Phone number must be exactly 10 digits" }));
      return;
    }

    setLoadingSubmit(true);
    const res = await signup(formData);
    setLoadingSubmit(false);

    if (res.success) {
      toast.success("Account created successfully!");
      navigate("/wedding/vendor/onboarding/step-1");
    } else {
      toast.error(res.error || "Signup failed");
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  return (
    <div className="wedding-module min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Vendor Portal
            </span>
          </Link>
        </div>

        <div className="bg-card py-8 px-6 shadow-xl rounded-3xl border border-border sm:px-10 animate-wedding-fade-up">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-center" style={{ fontFamily: "'Playfair Display', serif" }}>
              Create an Account
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Join our network of premium wedding vendors
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <input
                type="text"
                name="name"
                placeholder="Full Name / Business Name"
                value={formData.name}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
             <div>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.email 
                    ? 'border border-red-500 ring-2 ring-red-200 bg-red-50 text-red-900 focus:ring-red-500' 
                    : 'bg-muted border border-border text-foreground focus:ring-primary/50'
                }`}
                required
              />
              {errors.email && (
                <p className="text-xs text-red-500 font-bold mt-1.5 ml-1 animate-pulse">
                  ⚠️ {errors.email}
                </p>
              )}
            </div>
            <div>
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number (10 Digits)"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.phone 
                    ? 'border border-red-500 ring-2 ring-red-200 bg-red-50 text-red-900 focus:ring-red-500' 
                    : 'bg-muted border border-border text-foreground focus:ring-primary/50'
                }`}
                required
              />
              {errors.phone && (
                <p className="text-xs text-red-500 font-bold mt-1.5 ml-1 animate-pulse">
                  ⚠️ {errors.phone}
                </p>
              )}
            </div>
            <div>
              <div className="relative">
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, category: val }))}
                  disabled={loadingInitial}
                >
                  <SelectTrigger className={`${inputClass} h-[50px]`}>
                    <SelectValue placeholder={loadingInitial ? "Loading categories..." : "Select Vendor Category"} />
                  </SelectTrigger>
                  <SelectContent 
                    position="popper" 
                    side="bottom" 
                    avoidCollisions={true} 
                    className="z-[100] max-h-[200px] overflow-y-auto bg-white shadow-2xl border-border"
                  >
                    {categories && categories.length > 0 ? (
                      categories.map((cat, idx) => (
                        <SelectItem key={cat._id || cat.id || cat.slug || idx} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-xs text-muted-foreground">No categories found</div>
                    )}
                  </SelectContent>
                </Select>
                {loadingInitial && (
                  <Loader2 className="w-4 h-4 animate-spin absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground" />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingSubmit || loadingInitial}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-background wedding-gradient hover:shadow-lg transition-all disabled:opacity-70"
            >
              {loadingSubmit ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground border-t border-border pt-6">
            Already have an account?{" "}
            <Link to="/wedding/vendor/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Log in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorSignup;
