import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Loader2, ArrowRight, Smartphone, KeyRound, RefreshCw, Edit2 } from "lucide-react";
import toast from "react-hot-toast";
import { getVendor } from "../../data/vendorApi"; // To check if they are onboarded

const VendorLogin = () => {
  const [step, setStep] = useState(1); // 1: Enter Phone, 2: Enter OTP
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const { sendOtp, login, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, route away
  useEffect(() => {
    if (user) {
      navigate("/wedding/vendor/dashboard");
    }
  }, [user, navigate]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    const res = await sendOtp(cleanPhone);
    setLoading(false);

    if (res.success) {
      setStep(2);
    } else {
      toast.error(res.error || "Failed to send OTP");
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    const res = await sendOtp(phone);
    setResending(false);

    if (!res.success) {
      toast.error(res.error || "Failed to resend OTP");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length === 0) {
      toast.error("Please enter the OTP");
      return;
    }

    setLoading(true);
    const res = await login(phone, otp.trim());

    if (res.success) {
      // Check if they have an active vendor profile
      const vendorRes = await getVendor();
      if (vendorRes?.vendor?.status !== "draft") {
        navigate("/wedding/vendor/dashboard");
      } else {
        navigate("/wedding/vendor/onboarding/step-1");
      }
    } else {
      toast.error(res.error || "Verification failed");
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 pl-11 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  return (
    <div className="wedding-module min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Vendor Portal
            </span>
          </Link>
        </div>

        <div className="bg-card py-8 px-6 shadow-xl rounded-3xl border border-border sm:px-10 animate-wedding-fade-up">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {step === 1
                ? "Enter your mobile number to receive an OTP"
                : "Enter the OTP sent to your mobile number"}
            </p>
          </div>

          {step === 1 ? (
            /* STEP 1: ENTER PHONE */
            <form className="space-y-4" onSubmit={handleSendOtp}>
              <div className="relative">
                <Smartphone className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Mobile Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  maxLength={15}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 mt-2 py-3 px-4 rounded-xl text-sm font-semibold text-background wedding-gradient hover:shadow-lg transition-all disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Send OTP <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: ENTER OTP */
            <form className="space-y-4" onSubmit={handleVerifyOtp}>
              {/* Phone indicator & Edit button */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-muted/60 rounded-xl border border-border text-sm">
                <span className="text-foreground font-medium">+91 {phone}</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                  }}
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" /> Change
                </button>
              </div>

              <div className="relative">
                <KeyRound className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  name="otp"
                  placeholder="Enter 6-Digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className={inputClass}
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 mt-2 py-3 px-4 rounded-xl text-sm font-semibold text-background wedding-gradient hover:shadow-lg transition-all disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Verify & Login <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                  Resend OTP
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground border-t border-border pt-6">
            Don't have an account?{" "}
            <Link to="/wedding/vendor/signup" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Sign up today
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorLogin;
