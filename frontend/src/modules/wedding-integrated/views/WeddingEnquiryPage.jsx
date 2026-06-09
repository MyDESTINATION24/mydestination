import { useState, useEffect } from "react";
import { Check, ChevronRight, ChevronLeft, PartyPopper, Loader2 } from "lucide-react";
import ScrollReveal from "../components/ScrollReveal";
import { weddingService } from "../../../services/weddingService";

const services = [
  "Full Planning",
  "Decor & Design",
  "Photography",
  "Catering",
  "Entertainment",
  "Mehendi",
  "Sangeet",
  "Guest Management",
];

const WeddingEnquiryPage = () => {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [destinations, setDestinations] = useState([]);
  const [form, setForm] = useState({
    eventDate: "",
    guestCount: "",
    destination: "",
    budgetRange: "",
    selectedServices: [],
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const data = await weddingService.getDestinations();
        setDestinations(data);
      } catch (err) {
        console.error("Failed to fetch destinations:", err);
      }
    };
    fetchDestinations();
  }, []);

  const update = (key, value) => setForm({ ...form, [key]: value });

  const toggleService = (s) => {
    const selected = form.selectedServices.includes(s)
      ? form.selectedServices.filter((x) => x !== s)
      : [...form.selectedServices, s];
    update("selectedServices", selected);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await weddingService.createEnquiry(form);
      setSubmitted(true);
    } catch (err) {
      console.error("Submission error:", err);
      alert(err.message || "Failed to submit enquiry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center animate-wedding-scale-in">
          <div className="w-24 h-24 rounded-full wedding-gradient flex items-center justify-center mx-auto mb-6">
            <PartyPopper className="w-12 h-12 text-background" />
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Enquiry Submitted!
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Thank you for your interest. Our team will reach out to you within
            24 hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <section className="pt-4 md:pt-20 pb-4 px-4 text-center leading-tight">
        <h1
          className="text-2xl md:text-4xl font-bold"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Plan Your Dream Wedding
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-lg">
          Tell us about your vision
        </p>
      </section>
      
      {/* Step indicator */}
      <div className="max-w-xl mx-auto px-6 mb-8 md:mb-12">
        <div className="flex items-center">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex items-center ${s < 3 ? 'flex-1' : ''}`}>
              <div
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex shrink-0 items-center justify-center text-xs md:text-sm font-semibold transition-all duration-500 shadow-sm ${
                  step >= s
                    ? "wedding-gradient text-background"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : s}
              </div>
              {s < 3 && (
                <div className="flex-1 h-1 mx-0 rounded-full overflow-hidden bg-muted">
                  <div
                    className="h-full wedding-gradient transition-all duration-700"
                    style={{ width: step > s ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1 text-[10px] md:text-xs text-muted-foreground">
          <span>Event Details</span>
          <span>Services</span>
          <span>Contact</span>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 pb-4 md:pb-12">
        <ScrollReveal>
          <div className="p-5 md:p-8 rounded-2xl bg-card border border-border wedding-shadow">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={form.eventDate}
                    onChange={(e) => update("eventDate", e.target.value)}
                    className="w-full px-4 py-2 md:py-3 rounded-xl bg-muted border border-border text-foreground text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Expected Guest Count
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.guestCount}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (form.guestCount.endsWith('+') && val === form.guestCount.slice(0, -1)) {
                        val = val.slice(0, -1);
                      }
                      val = val.replace(/\\D/g, '');
                      update("guestCount", val ? val + "+" : "");
                    }}
                    placeholder="e.g. 500"
                    className="w-full px-4 py-2 md:py-3 rounded-xl bg-muted border border-border text-foreground text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Preferred Destination
                  </label>
                  <input
                    type="text"
                    value={form.destination}
                    onChange={(e) => update("destination", e.target.value)}
                    placeholder="e.g. Jaipur, Goa, Udaipur"
                    className="w-full px-4 py-2 md:py-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Budget
                  </label>
                  <input
                    type="text"
                    value={form.budgetRange}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^[0-9]+[ \t]*[lLkK]?[ \t]*(-[ \t]*([0-9]+[ \t]*[lLkK]?)?)?$/.test(val)) {
                        update("budgetRange", val);
                      }
                    }}
                    placeholder="e.g. 5L or 50K - 1L"
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Services Needed
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {services.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleService(s)}
                        className={`px-4 py-3 rounded-xl text-sm font-medium text-left transition-all duration-300 ${
                          form.selectedServices.includes(s)
                            ? "wedding-gradient text-background shadow-md"
                            : "bg-muted text-muted-foreground hover:bg-primary/10"
                        }`}
                      >
                        {form.selectedServices.includes(s) && (
                          <Check className="w-4 h-4 inline mr-2" />
                        )}
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^[a-zA-Z\s]*$/.test(val)) {
                        update("name", val);
                      }
                    }}
                    placeholder="Full name"
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="e.g. example@gmail.com"
                    className={`w-full px-4 py-3 rounded-xl bg-muted border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${
                      form.email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+[.][a-zA-Z]{2,}$/.test(form.email)
                        ? "border-red-500 focus:ring-red-500/50"
                        : "border-border"
                    }`}
                  />
                  {form.email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+[.][a-zA-Z]{2,}$/.test(form.email) && (
                    <p className="text-xs text-red-500 mt-1">Please enter a valid standard email (e.g. @gmail.com, @yahoo.com)</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                      update("phone", val);
                    }}
                    placeholder="e.g. 9876543210"
                    className={`w-full px-4 py-3 rounded-xl bg-muted border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${
                      form.phone && form.phone.length !== 10
                        ? "border-red-500 focus:ring-red-500/50"
                        : "border-border"
                    }`}
                  />
                  {form.phone && form.phone.length !== 10 && (
                    <p className="text-xs text-red-500 mt-1">Phone number must be exactly 10 digits.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    placeholder="Any special requirements..."
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>
              </div>
            )}
            
            {/* Navigation */}
            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium bg-muted text-muted-foreground transition-all duration-300 hover:bg-primary/10 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium wedding-gradient text-background transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 rounded-full text-sm font-medium wedding-gradient text-background transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-70 disabled:scale-100"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    "Submit Enquiry"
                  )}
                </button>
              )}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default WeddingEnquiryPage;
