const getPrivacyPolicy = (req, res) => {
  res.json({
    success: true,
    title: "Privacy Policy",
    lastUpdated: "May 27, 2026",
    content: "At Home Services, we value your privacy and are committed to protecting your personal data. This privacy policy describes how we collect, use, and share your information when you use our platform.",
    sections: [
      {
        title: "1. Information We Collect",
        body: "We collect information you provide directly to us, such as your name, phone number, email address, physical address, and payment information when you register, schedule a service, or communicate with us."
      },
      {
        title: "2. How We Use Your Information",
        body: "We use your personal information to match you with certified service providers, process payments, verify bookings, send transaction alerts, and improve our home services platform experience."
      },
      {
        title: "3. Information Sharing & Security",
        body: "Your details are only shared with the assigned service technician for execution. We implement strict industry-standard technical measures to secure your data and do not sell information to third-party advertisers."
      }
    ]
  });
};
const getAbout = (req, res) => {
  res.json({
    success: true,
    title: "About Us",
    description: "Home Services is a premium, on-demand platform connecting homeowners with certified and background-checked service professionals like plumbers, electricians, mechanics, painters, and salon technicians.",
    vision: "To make home maintenance, repair, and cleaning services completely hassle-free, secure, and transparent.",
    mission: "To empower local service partners with technology and training while providing consumers with reliable, affordable, and high-quality solutions at their doorstep.",
    highlights: [
      "100% Background Checked & Verified Partners",
      "Standardised Pricing & No Hidden Charges",
      "30-Day Post-Service Warranty Cover",
      "Seamless In-App Booking and Booking Tracking"
    ]
  });
};
const getPoliciesAbout = (req, res) => {
  res.redirect('/api/about');
};
const getTerms = (req, res) => {
  res.json({
    success: true,
    title: "Terms and Conditions",
    lastUpdated: "May 27, 2026",
    content: "Welcome to Home Services. By registering or using our platform, you agree to comply with and be bound by the following terms of service. Please read them carefully.",
    sections: [
      {
        title: "1. Service Booking & Cancellation",
        body: "All service bookings must be made through our official mobile app or portal. Users can cancel bookings free of charge up to 2 hours before the scheduled time slot. Late cancellations may incur a nominal convenience fee."
      },
      {
        title: "2. Payment & Billing Rules",
        body: "Standard charges are displayed upfront. Any additional materials or spare parts purchased by the technician will be billed separately with user consent. All payments must be processed digitally or through in-app wallet options."
      },
      {
        title: "3. Limitation of Liability",
        body: "While we verify all independent service professionals, Home Services acts as a coordinator. Any dispute or property damage claims are governed by our standard insurance and damage reimbursement guidelines."
      }
    ]
  });
};
const getRefund = (req, res) => {
  res.json({
    success: true,
    title: "Refund Policy",
    lastUpdated: "May 27, 2026",
    content: "Our goal is your complete satisfaction. If you are unsatisfied with a service, we offer a transparent refund and rework policy governed by the following rules.",
    rules: [
      {
        title: "1. Refund Eligibility",
        body: "Refunds are processed if the service was not executed as described, the service partner failed to show up, or severe quality issues are reported within 48 hours of service completion."
      },
      {
        title: "2. Standard Resolution Timeline",
        body: "For verified issues, we initiate a free-of-cost rework by a senior supervisor within 24 hours. If rework is not feasible, a full or partial refund is credited back to your original payment source or wallet within 5-7 business days."
      },
      {
        title: "3. Warranty Cover Limitations",
        body: "Our 30-day post-service warranty covers repairs executed by our partner. Reworks or issues arising due to external damage, misuse, or repairs handled by external non-platform technicians will invalidate refund/warranty claims."
      }
    ]
  });
};

module.exports = {
  getPrivacyPolicy,
  getAbout,
  getPoliciesAbout,
  getTerms,
  getRefund
};
