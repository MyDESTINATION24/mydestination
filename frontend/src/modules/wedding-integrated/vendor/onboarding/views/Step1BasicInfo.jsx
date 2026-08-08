import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronDown, Loader2, ArrowRight, CheckCircle2, Edit2, ChevronUp } from "lucide-react";
import ProgressBar from "../components/ProgressBar";
import useVendorForm from "../../hooks/useVendorForm";
import { useAuth } from "../../context/AuthContext";
import { getCategories } from "../../data/categoryApi";
import { weddingService } from "../../../../../services/weddingService";
import { getAdminVendors } from "../../../services/storage";
import toast from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";

const Step1BasicInfo = () => {
  const navigate = useNavigate();
  const { basicInfo, updateBasicInfo, submitForm } = useVendorForm();
  const { user } = useAuth();
  const [errors, setErrors] = useState({});
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingLocs, setLoadingLocs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEditFields, setShowEditFields] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await getCategories();
        if (res.success) {
          let cats = [...res.categories];
          try {
            const adminVendors = getAdminVendors() || [];
            const adminCats = [...new Set(adminVendors.map(v => v.category).filter(Boolean))];
            
            adminCats.forEach(ac => {
               if(!cats.find(c => c.name.toLowerCase() === ac.toLowerCase())) {
                   cats.push({ id: `custom-cat-${Date.now()}-${Math.random()}`, name: ac });
               }
            });
          } catch(e) {}
          
          setAvailableCategories(cats);
        }
      } catch (error) {
        console.error("Failed to load categories", error);
      } finally {
        setLoadingCats(false);
      }
    };
    fetchCats();
  }, []);

  // Fetch locations
  useEffect(() => {
    const fetchLocs = async () => {
      try {
        const data = await weddingService.getDestinations();
        const apiLocs = data.map(d => d.name);
        const sorted = [...new Set(apiLocs)].sort((a, b) => a.localeCompare(b));
        setAvailableLocations(sorted);
      } catch (error) {
        console.error("Failed to load locations", error);
        setAvailableLocations([]);
      } finally {
        setLoadingLocs(false);
      }
    };
    fetchLocs();
  }, []);

  // Auto-fill from Auth if vendor basicInfo is empty
  useEffect(() => {
    if (user) {
      updateBasicInfo({
        name: basicInfo.name || user.name || "",
        email: basicInfo.email || user.email || "",
        phone: basicInfo.phone || user.phone || "",
        category: basicInfo.category || user.category || "",
      });
    }
  }, [user]);

  const validateEmailDomain = (email) => {
    if (!email) return { isValid: true };
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in|org|net|co|info|edu|co\.in)$/i;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: "Please enter a standard valid email (e.g. name@gmail.com, name@domain.in)" };
    }
    const parts = email.split('@');
    if (parts.length < 2) return { isValid: false, message: "Invalid email structure" };
    const domain = parts[1].toLowerCase();
    
    if (/(.)\1\1/.test(domain)) {
      return { isValid: false, message: "Suspicious spelling in email domain. Please check for typos." };
    }
    
    const gmailTypos = [
      'gamil.com', 'gmaill.com', 'gmaild.com', 'gmal.com', 'gmeil.com', 'gmaik.com', 'gamil.co',
      'gmal.co', 'gmaill.co', 'gmaii.com', 'gmaul.com', 'gmail.con', 'gmail.coo', 'gmail.comm',
      'gmial.com', 'gmaik.co', 'gmai.com', 'gamil.in', 'gmaill.in', 'gmaild.in'
    ];
    if (gmailTypos.includes(domain)) {
      return { isValid: false, message: "Did you mean gmail.com?" };
    }

    return { isValid: true };
  };

  const handleNext = async () => {
    const newErrors = {};
    if (!basicInfo.name.trim()) newErrors.name = "Business name is required";
    if (!basicInfo.category) newErrors.category = "Please select a category";
    if (!basicInfo.location) newErrors.location = "Please select a location";
    if (!basicInfo.experience) newErrors.experience = "Experience is required";
    
    if (!basicInfo.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (basicInfo.phone.replace(/\D/g, '').length !== 10) {
      newErrors.phone = "Phone number must be exactly 10 digits";
    }
    
    if (!basicInfo.email.trim()) {
      newErrors.email = "Email is required";
      toast.error("Email is required");
    } else {
      const emailCheck = validateEmailDomain(basicInfo.email.trim());
      if (!emailCheck.isValid) {
        newErrors.email = emailCheck.message;
        toast.error(emailCheck.message);
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await submitForm();
      navigate("/wedding/vendor/onboarding/step-2");
    } catch (error) {
      toast.error("Failed to save progress. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 md:py-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  return (
    <div className="min-h-screen bg-background">
      <section className="pt-4 md:pt-12 pb-4 px-4 text-center">
        <h1
          className="text-2xl md:text-4xl font-bold"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Vendor Registration
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Complete your business profile
        </p>
      </section>

      <ProgressBar currentStep={1} />

      <div className="max-w-2xl mx-auto px-4 pb-16 md:pb-24">
        <div className="p-5 md:p-8 rounded-2xl bg-card border border-border wedding-shadow animate-wedding-fade-up space-y-6">
          
          {/* PRE-FILLED ACCOUNT DETAILS SUMMARY CARD */}
          <div className="p-4 rounded-xl bg-muted/60 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-semibold text-foreground">
                  Account Details (Saved from Registration)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowEditFields(!showEditFields)}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                {showEditFields ? "Hide Edit" : "Edit Info"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs md:text-sm">
              <div className="bg-background/80 p-2.5 rounded-lg border border-border/50">
                <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold mb-0.5">Business Name</span>
                <span className="font-bold text-foreground break-words">{basicInfo.name || "N/A"}</span>
              </div>
              <div className="bg-background/80 p-2.5 rounded-lg border border-border/50">
                <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold mb-0.5">Category</span>
                <span className="font-bold text-foreground break-words">{basicInfo.category || "N/A"}</span>
              </div>
              <div className="bg-background/80 p-2.5 rounded-lg border border-border/50">
                <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold mb-0.5">Phone Number</span>
                <span className="font-bold text-foreground break-words">{basicInfo.phone || "N/A"}</span>
              </div>
              <div className="bg-background/80 p-2.5 rounded-lg border border-border/50">
                <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold mb-0.5">Email Address</span>
                <span className="font-bold text-foreground break-all">{basicInfo.email || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* EDITABLE REGISTRATION FIELDS (EXPANDABLE) */}
          {showEditFields && (
            <div className="p-4 rounded-xl bg-background border border-border space-y-4 animate-wedding-fade-up">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-muted-foreground">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={basicInfo.name}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^A-Za-z\s]/g, '');
                    updateBasicInfo({ name: val });
                    if (errors.name) setErrors(prev => ({ ...prev, name: null }));
                  }}
                  placeholder="e.g. Royal Lens Photography"
                  className={inputClass}
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-muted-foreground">
                    Category *
                  </label>
                  <Select
                    value={basicInfo.category}
                    onValueChange={(val) => updateBasicInfo({ category: val })}
                    disabled={loadingCats}
                  >
                    <SelectTrigger className={`${inputClass} h-[46px]`}>
                      <SelectValue placeholder={loadingCats ? "Loading..." : "Select Category"} />
                    </SelectTrigger>
                    <SelectContent position="popper" side="bottom" avoidCollisions={false} className="max-h-[200px] overflow-y-auto">
                      {availableCategories.map((cat, idx) => (
                        <SelectItem key={cat._id || cat.id || idx} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-xs text-destructive mt-1">{errors.category}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-muted-foreground">
                    Phone *
                  </label>
                  <input
                    type="text"
                    value={basicInfo.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      updateBasicInfo({ phone: val });
                      if (errors.phone) setErrors(prev => ({ ...prev, phone: null }));
                    }}
                    placeholder="Enter 10-digit phone"
                    className={inputClass}
                  />
                  {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-muted-foreground">
                  Email *
                </label>
                <input
                  type="email"
                  value={basicInfo.email}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateBasicInfo({ email: val });
                    const emailCheck = validateEmailDomain(val);
                    if (val && !emailCheck.isValid) {
                      setErrors(prev => ({ ...prev, email: emailCheck.message }));
                    } else {
                      setErrors(prev => ({ ...prev, email: null }));
                    }
                  }}
                  placeholder="you@business.com"
                  className={inputClass}
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>
            </div>
          )}

          {/* MAIN NEW REQUIRED FIELDS: LOCATION & EXPERIENCE */}
          <div className="space-y-5 pt-2">
            <h2 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
              Location & Experience
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-muted-foreground">
                  Primary Business Location *
                </label>
                <Select
                  value={basicInfo.location}
                  onValueChange={(val) => {
                    updateBasicInfo({ location: val });
                    if (errors.location) setErrors(prev => ({ ...prev, location: null }));
                  }}
                  disabled={loadingLocs}
                >
                  <SelectTrigger className={`${inputClass} h-[50px]`}>
                    <SelectValue placeholder={loadingLocs ? "Loading Locations..." : "Select Location"} />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" avoidCollisions={false} className="max-h-[200px] overflow-y-auto">
                    {availableLocations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.location && <p className="text-xs text-destructive mt-1">{errors.location}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-muted-foreground">
                  Years of Experience *
                </label>
                <input
                  type="text"
                  value={basicInfo.experience}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                    updateBasicInfo({ experience: val });
                    if (errors.experience) setErrors(prev => ({ ...prev, experience: null }));
                  }}
                  placeholder="e.g. 5"
                  className={inputClass}
                />
                {errors.experience && <p className="text-xs text-destructive mt-1">{errors.experience}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-8 pt-4 border-t border-border">
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Next Step <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1BasicInfo;
