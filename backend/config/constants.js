const path = require('path');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'super_secret_jwt_key_123';
const ADMIN_FETCH_TTL = 10000; // 10s cache for fast admin sync
const DB_FILE = path.join(__dirname, '..', 'database.json');

const defaultSubCategoryPresets = {
  "ac repair": [
    { title: "AC Service & Checkup", key: "ac_service" },
    { title: "AC Repair & Installation", key: "ac_repair_inst" }
  ],
  "acrepair": [
    { title: "AC Service & Checkup", key: "ac_service" },
    { title: "AC Repair & Installation", key: "ac_repair_inst" }
  ],
  "car washing": [
    { title: "Interior Car Wash", key: "car_interior" },
    { title: "Exterior Foam Wash", key: "car_exterior" }
  ],
  "plumber": [
    { title: "Tap & Pipe Repair", key: "tap_pipe" },
    { title: "Drainage & Bathroom Fitting", key: "drainage_fitting" }
  ],
  "cleaning": [
    { title: "Full Home Deep Cleaning", key: "home_cleaning" },
    { title: "Sofa & Carpet Cleaning", key: "sofa_cleaning" }
  ],
  "electrician": [
    { title: "Switchboard & Wiring", key: "switch_wiring" },
    { title: "Fan & Light Appliance Repair", key: "appliance_repair" }
  ],
  "salon and spa": [
    { title: "Haircut & Styling", key: "hair_styling" },
    { title: "Facial & Skin Care", key: "facial_care" }
  ],
  "painter": [
    { title: "Interior Wall Painting", key: "interior_painting" },
    { title: "Exterior & Waterproofing", key: "waterproofing" }
  ],
  "carpenter": [
    { title: "Furniture Repair & Assembly", key: "furniture_repair" },
    { title: "Door & Window Fitting", key: "door_fitting" }
  ],
  "bike services": [
    { title: "General Bike Service", key: "bike_general" },
    { title: "Engine & Brake Repair", key: "engine_repair" }
  ],
  "architecture": [
    { title: "2D & 3D House Design", key: "house_design" },
    { title: "Interior Elevation Planning", key: "elevation_planning" }
  ],
  "contractor": [
    { title: "Home Renovation Work", key: "renovation_work" },
    { title: "Civil Construction", key: "civil_construction" }
  ],
  "mechanic": [
    { title: "Engine Diagnostics", key: "engine_diagnostics" },
    { title: "Brake & Suspension Repair", key: "suspension_repair" }
  ],
  "pandit ji": [
    { title: "Puja & Hawan Service", key: "puja_hawan" },
    { title: "Astrology & Vastu Consultation", key: "astrology_vastu" }
  ],
  "driver": [
    { title: "Hourly City Driver", key: "hourly_driver" },
    { title: "Outstation Trip Driver", key: "outstation_driver" }
  ],
  "photographer": [
    { title: "Wedding & Event Shoot", key: "event_shoot" },
    { title: "Portrait & Portfolio Shoot", key: "portfolio_shoot" }
  ],
  "doctors": [
    { title: "General Health Checkup", key: "health_checkup" },
    { title: "Specialist Consultation", key: "specialist_consult" }
  ],
  "compounder": [
    { title: "Home Nursing & Dressing", key: "nursing_dressing" },
    { title: "Elderly Care & Injections", key: "elderly_injections" }
  ],
  "halwai": [
    { title: "Party Catering & Buffet", key: "party_catering" },
    { title: "Wedding Sweets & Snacks", key: "wedding_sweets" }
  ]
};

const defaultSubCatServicePresets = {
  "ac service & checkup": [
    { title: "AC Power Saver Service", price: 599, cutPrice: 899 },
    { title: "AC Foam & Jet Wash Service", price: 799, cutPrice: 1199 },
    { title: "AC Anti-Bacterial Checkup", price: 399, cutPrice: 599 }
  ],
  "ac repair & installation": [
    { title: "Split AC Installation", price: 1499, cutPrice: 1999 },
    { title: "Window AC Installation", price: 999, cutPrice: 1499 },
    { title: "AC Gas Charging (R32/R410)", price: 2299, cutPrice: 2999 }
  ],
  "interior car wash": [
    { title: "Car Interior Vacuum & Sanitization", price: 499, cutPrice: 799 },
    { title: "Car Seat Shampoo & Upholstery Clean", price: 899, cutPrice: 1299 },
    { title: "Dashboard & Console Polish", price: 349, cutPrice: 499 }
  ],
  "exterior foam wash": [
    { title: "High-Pressure Foam Wash & Wax", price: 399, cutPrice: 599 },
    { title: "Complete Exterior Polish & Shine", price: 799, cutPrice: 1199 },
    { title: "Tire & Alloy Wheel Detailing", price: 299, cutPrice: 499 }
  ],
  "tap & pipe repair": [
    { title: "Tap Leakage & Washer Repair", price: 199, cutPrice: 299 },
    { title: "Mixer & Shower Installation", price: 399, cutPrice: 599 },
    { title: "Pipeline Fitting & Leakage Fix", price: 499, cutPrice: 799 }
  ],
  "drainage & bathroom fitting": [
    { title: "Bathroom Waste Pipe Unclogging", price: 399, cutPrice: 599 },
    { title: "Commode & Flush Tank Repair", price: 499, cutPrice: 799 },
    { title: "Washbasin & Sink Drain Repair", price: 299, cutPrice: 499 }
  ],
  "full home deep cleaning": [
    { title: "2 BHK Full Home Deep Cleaning", price: 2499, cutPrice: 3499 },
    { title: "3 BHK Full Home Deep Cleaning", price: 3499, cutPrice: 4499 },
    { title: "Kitchen & Bathroom Deep Cleaning", price: 1499, cutPrice: 1999 }
  ],
  "sofa & carpet cleaning": [
    { title: "5 Seater Sofa Shampoo & Cleaning", price: 799, cutPrice: 1199 },
    { title: "Living Room Carpet Dry Cleaning", price: 599, cutPrice: 899 },
    { title: "Dining Chair & Mattress Cleaning", price: 499, cutPrice: 699 }
  ],
  "switchboard & wiring": [
    { title: "Switch & Socket Replacement", price: 149, cutPrice: 249 },
    { title: "MCB & Main Line Fuse Repair", price: 299, cutPrice: 499 },
    { title: "Complete Room Wiring & Checkup", price: 799, cutPrice: 1199 }
  ],
  "fan & light appliance repair": [
    { title: "Ceiling Fan Installation & Repair", price: 199, cutPrice: 299 },
    { title: "LED Light & Chandelier Fitting", price: 249, cutPrice: 399 },
    { title: "Exhaust Fan & Geyser Checkup", price: 349, cutPrice: 499 }
  ],
  "haircut & styling": [
    { title: "Men's Haircut & Beard Styling", price: 299, cutPrice: 499 },
    { title: "Hair Spa & Scalp Massage", price: 599, cutPrice: 899 },
    { title: "Hair Color & Organic Treatment", price: 899, cutPrice: 1299 }
  ],
  "facial & skin care": [
    { title: "Gold Glow Facial & Clean-up", price: 799, cutPrice: 1199 },
    { title: "Detan Face & Neck Pack", price: 499, cutPrice: 699 },
    { title: "Full Body Scrub & Massage", price: 1499, cutPrice: 1999 }
  ],
  "interior wall painting": [
    { title: "Single Room Express Paint", price: 1999, cutPrice: 2799 },
    { title: "Full House Wall Touchup & Paint", price: 4999, cutPrice: 6999 },
    { title: "Designer Texture & Accent Wall", price: 2999, cutPrice: 3999 }
  ],
  "exterior & waterproofing": [
    { title: "Roof Waterproofing Coating", price: 3499, cutPrice: 4999 },
    { title: "Wall Dampness Treatment", price: 2499, cutPrice: 3499 }
  ],
  "furniture repair & assembly": [
    { title: "Bed & Sofa Repair / Tightening", price: 399, cutPrice: 599 },
    { title: "Modular Furniture Assembly", price: 699, cutPrice: 999 },
    { title: "Wardrobe Lock & Hinge Fix", price: 299, cutPrice: 449 }
  ],
  "door & window fitting": [
    { title: "Door Lock & Handle Fitting", price: 249, cutPrice: 399 },
    { title: "Wooden Door Channel Repair", price: 349, cutPrice: 499 }
  ],
  "general bike service": [
    { title: "Complete Bike Tune-up & Oil Change", price: 499, cutPrice: 799 },
    { title: "Carburetor Clean & Chain Lube", price: 299, cutPrice: 449 },
    { title: "Brake Shoe & Cable Replacement", price: 249, cutPrice: 399 }
  ],
  "engine & brake repair": [
    { title: "Bike Engine Overhaul & Servicing", price: 1499, cutPrice: 2199 },
    { title: "Disc Brake Pad Replacement", price: 399, cutPrice: 599 }
  ]
};

const DEFAULT_CATEGORIES = [
  { id: "ac_repair", name: "AcRepair", image: "/assets/categories/ac_repair_3d.jpg" },
  { id: "car_washing", name: "Car Washing", image: "/assets/categories/car_washing_3d.jpg" },
  { id: "plumber", name: "Plumber", image: "/assets/categories/plumber_3d.png" },
  { id: "cleaning", name: "Cleaning", image: "/assets/categories/cleaning_3d.jpg" },
  { id: "electrician", name: "Electrician", image: "/assets/categories/electrician_3d.png" },
  { id: "salon_and_spa", name: "Salon And Spa", image: "/assets/categories/salon_3d.jpg" },
  { id: "painter", name: "Painter", image: "/assets/categories/painter_3d.jpg" },
  { id: "carpenter", name: "Carpenter", image: "/assets/categories/carpenter_3d.jpg" },
  { id: "bike_services", name: "Bike Services", image: "/assets/categories/bike_services_3d.jpg" },
  { id: "architecture", name: "Architecture", image: "/assets/categories/architecture_3d.png" },
  { id: "contractor", name: "Contractor", image: "/assets/categories/contractor_3d.png" },
  { id: "mechanic", name: "Mechanic", image: "/assets/categories/mechanic_3d.png" },
  { id: "pandit_ji", name: "Pandit ji", image: "/assets/categories/pandat_ji_3d.png" },
  { id: "driver", name: "Driver", image: "/assets/categories/driver_3d.jpg" },
  { id: "photographer", name: "Photographer", image: "/assets/categories/photographer_3d.jpg" },
  { id: "doctors", name: "Doctors", image: "/assets/categories/doctor_3d.png" },
  { id: "compounder", name: "Compounder", image: "/assets/categories/compounder_3d.png" },
  { id: "halwai", name: "Halwai", image: "/assets/categories/caters_3d.jpg" }
];

const CATEGORIES_DATA = [
  "AcRepair", "Car Washing", "Plumber", "Cleaning",
  "Electrician", "Salon And Spa", "Painter", "Carpenter",
  "Bike Services", "Architecture", "Contractor", "Mechanic",
  "Pandit ji", "Driver", "Photographer", "Doctors", "Compounder", "Halwai", "Pest Control", "Repairing"
];

const AMC_SUPPORTED_CATEGORIES = [
  "Repairing", "Plumber", "Electrician", "Painter", "Carpenter", "Architecture", "Contractor", "Pest Control"
];

const SERVICES_DATA = {
  "Plumber": [
    { title: "Tap Repair", price: 299, description: "Fix leaking taps and water issues", image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.7, reviewsCount: 142, cutPrice: 399 },
    { title: "Pipe Fix", price: 499, description: "Repair damaged pipes", image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.5, reviewsCount: 88, cutPrice: 599 }
  ],
  "Electrician": [
    { title: "Fan Repair", price: 199, description: "Fix fan issues", image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.6, reviewsCount: 230, cutPrice: 249 },
    { title: "Switch Repair", price: 149, description: "Repair switches and boards", image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.4, reviewsCount: 95, cutPrice: 199 },
    { title: "Wiring Work", price: 799, description: "Complete wiring setup", image: "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.9, reviewsCount: 180, cutPrice: 999 }
  ],
  "Cleaning": [
    { title: "Home Cleaning", price: 999, description: "Full house cleaning service", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400&auto=format&fit=crop", discount: 23, rating: 4.9, reviewsCount: 312, cutPrice: 1299 },
    { title: "Sofa & Carpet Cleaning", price: 799, description: "Vacuuming and steam sanitizing fabric surfaces", image: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.6, reviewsCount: 120, cutPrice: 999 },
    { title: "Window Cleaning", price: 299, description: "Sparkling glass and pane washing inside-out", image: "https://images.unsplash.com/photo-1528740561666-bd247e66a20c?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.5, reviewsCount: 74, cutPrice: 399 }
  ],
  "AcRepair": [
    { title: "Ac Service", price: 500, description: "Full filter and coil cleaning", image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.8, reviewsCount: 420, cutPrice: 599 },
    { title: "AC Installation", price: 1, description: "Mount and configure split or window AC unit", image: "https://images.unsplash.com/photo-1621905252507-b354bc25edac?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.9, reviewsCount: 165, cutPrice: 1499 },
    { title: "AC Leakage Repair", price: 600, description: "Identify and plug water or gas leak issues", image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.6, reviewsCount: 98, cutPrice: 799 },
    { title: "AC Condenser Replacement", price: 2500, description: "Install brand new copper condenser unit", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.8, reviewsCount: 84, cutPrice: 2999 }
  ],
  "Salon And Spa": [
    { title: "Facial & Grooming", price: 1, description: "Deep cleansing facial treatment and face massage", image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.7, reviewsCount: 280, cutPrice: 599 },
    { title: "Massage Therapy", price: 899, description: "Stress-relieving full body Swedish massage", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.8, reviewsCount: 310, cutPrice: 1199 },
    { title: "Pedicure & Manicure", price: 399, description: "Hand and foot grooming and nail clean spa", image: "https://images.unsplash.com/photo-1604654894610-df490651e56c?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.7, reviewsCount: 185, cutPrice: 499 }
  ],
  "Painter": [
    { title: "Wall Paint", price: 1999, description: "Single room wall painting with premium finishes", image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.8, reviewsCount: 76, cutPrice: 2499 }
  ],
  "Carpenter": [],
  "Bike Services": [],
  "Architecture": [
    { title: "Design Draft", price: 4999, description: "Floor plans and basic architectural layout mapping", image: "/assets/services/design_draft.png", discount: 16, rating: 4.9, reviewsCount: 52, cutPrice: 5999 }
  ],
  "Car Washing": [
    { title: "Car Wash Deep", price: 599, description: "Interior vacuuming and exterior premium pressure wash", image: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.7, reviewsCount: 220, cutPrice: 799 },
    { title: "Exterior Shine", price: 299, description: "Quick foam wash and tire polish", image: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.5, reviewsCount: 104, cutPrice: 399 }
  ],
  "Contractor": [
    { title: "Renovation Consultation", price: 1499, description: "Detailed cost analysis and project discussion", image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.8, reviewsCount: 45, cutPrice: 1999 }
  ],
  "Mechanic": [
    { title: "Engine Tuning", price: 1299, description: "Spark plugs clean, filter wash, and tuning", image: "/assets/services/engine_tuning.png", discount: 23, rating: 4.8, reviewsCount: 112, cutPrice: 1699 },
    { title: "General Inspection", price: 399, description: "Brakes, fluids, suspension safety check", image: "https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?q=80&w=400&auto=format&fit=crop", discount: 20, rating: 4.6, reviewsCount: 135, cutPrice: 499 }
  ],
  "Pandit ji": [
    { title: "Pooja Service", price: 1100, description: "Pooja with traditional rituals and mantras", image: "/assets/services/pooja_service.png", discount: 26, rating: 4.9, reviewsCount: 88, cutPrice: 1499 }
  ],
  "Driver": [
    { title: "One-way Trip", price: 499, description: "Hourly driver service for safe in-city transit", image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.7, reviewsCount: 160, cutPrice: 599 }
  ],
  "Photographer": [
    { title: "Event Shoot", price: 2999, description: "2 hours high-res photography package for local events", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400&auto=format&fit=crop", discount: 25, rating: 4.9, reviewsCount: 72, cutPrice: 3999 }
  ],
  "Doctors": [
    { title: "General Consultation", price: 500, description: "GP health consultation and prescription writing", image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&auto=format&fit=crop", discount: 16, rating: 4.8, reviewsCount: 290, cutPrice: 599 }
  ],
  "Compounder": [
    { title: "Dressing & Injection", price: 150, description: "Basic nursing assistance, wound cleaning, dressings", image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=400&auto=format&fit=crop", discount: 24, rating: 4.5, reviewsCount: 105, cutPrice: 199 }
  ],
  "Halwai": [
    { title: "Catering Service", price: 3500, description: "Private chef/catering help for medium family dinners", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=400&auto=format&fit=crop", discount: 22, rating: 4.7, reviewsCount: 64, cutPrice: 4500 }
  ]
};

const STATIC_BOOKING_SLOTS = [
  { id: "slot_1",  time: "9:00 AM - 10:00 AM",  start: 9  },
  { id: "slot_2",  time: "10:00 AM - 11:00 AM", start: 10 },
  { id: "slot_3",  time: "11:00 AM - 12:00 PM", start: 11 },
  { id: "slot_4",  time: "12:00 PM - 1:00 PM",  start: 12 },
  { id: "slot_5",  time: "1:00 PM - 2:00 PM",   start: 13 },
  { id: "slot_6",  time: "2:00 PM - 3:00 PM",   start: 14 },
  { id: "slot_7",  time: "3:00 PM - 4:00 PM",   start: 15 },
  { id: "slot_8",  time: "4:00 PM - 5:00 PM",   start: 16 },
  { id: "slot_9",  time: "5:00 PM - 6:00 PM",   start: 17 },
  { id: "slot_10", time: "6:00 PM - 7:00 PM",   start: 18 },
  { id: "slot_11", time: "7:00 PM - 8:00 PM",   start: 19 }
];

const BANNERS_DATA = [
  {
    id: "banner1",
    image: "/assets/banners/ac_services_banner.png",
    title: "AC Foam Jet Service",
    category: "AcRepair",
    badge: "100% FREE",
    subtitle: "Professional foam jet deep cleaning for your AC - absolutely FREE!",
    buttonText: "Book Now"
  },
  {
    id: "banner2",
    image: "/assets/banners/refer_earn_banner.png",
    title: "Refer Friends, Earn Cash",
    category: "refer",
    badge: "REFER & EARN",
    subtitle: "Invite your friends and earn instant rewards",
    buttonText: "Refer Now"
  },
  {
    id: "banner3",
    image: "/assets/banners/amc_services_banner.png",
    title: "Annual Maintenance Cover",
    category: "",
    badge: "COMING SOON",
    subtitle: "Complete peace of mind for your home, coming soon",
    buttonText: "Learn More"
  }
];

const countriesList = [
  {
    "name": "Afghanistan",
    "code": "AF",
    "dial_code": "+93",
    "dialCode": "+93",
    "flag": "🇦🇫",
    "flagUrl": "https://flagcdn.com/w80/af.png",
    "flag_url": "https://flagcdn.com/w80/af.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Åland Islands",
    "code": "AX",
    "dial_code": "+358",
    "dialCode": "+358",
    "flag": "🇦🇽",
    "flagUrl": "https://flagcdn.com/w80/ax.png",
    "flag_url": "https://flagcdn.com/w80/ax.png",
    "phoneLength": 9,
    "phoneLengths": [
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ]
  },
  {
    "name": "Albania",
    "code": "AL",
    "dial_code": "+355",
    "dialCode": "+355",
    "flag": "🇦🇱",
    "flagUrl": "https://flagcdn.com/w80/al.png",
    "flag_url": "https://flagcdn.com/w80/al.png",
    "phoneLength": 9,
    "phoneLengths": [
      6,
      7,
      8,
      9
    ]
  },
  {
    "name": "Algeria",
    "code": "DZ",
    "dial_code": "+213",
    "dialCode": "+213",
    "flag": "🇩🇿",
    "flagUrl": "https://flagcdn.com/w80/dz.png",
    "flag_url": "https://flagcdn.com/w80/dz.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "American Samoa",
    "code": "AS",
    "dial_code": "+1684",
    "dialCode": "+1684",
    "flag": "🇦🇸",
    "flagUrl": "https://flagcdn.com/w80/as.png",
    "flag_url": "https://flagcdn.com/w80/as.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Andorra",
    "code": "AD",
    "dial_code": "+376",
    "dialCode": "+376",
    "flag": "🇦🇩",
    "flagUrl": "https://flagcdn.com/w80/ad.png",
    "flag_url": "https://flagcdn.com/w80/ad.png",
    "phoneLength": 6,
    "phoneLengths": [
      6,
      8,
      9
    ]
  },
  {
    "name": "Angola",
    "code": "AO",
    "dial_code": "+244",
    "dialCode": "+244",
    "flag": "🇦🇴",
    "flagUrl": "https://flagcdn.com/w80/ao.png",
    "flag_url": "https://flagcdn.com/w80/ao.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Anguilla",
    "code": "AI",
    "dial_code": "+1264",
    "dialCode": "+1264",
    "flag": "🇦🇮",
    "flagUrl": "https://flagcdn.com/w80/ai.png",
    "flag_url": "https://flagcdn.com/w80/ai.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Antarctica",
    "code": "AQ",
    "dial_code": "+672",
    "dialCode": "+672",
    "flag": "🇦🇶",
    "flagUrl": "https://flagcdn.com/w80/aq.png",
    "flag_url": "https://flagcdn.com/w80/aq.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Antigua and Barbuda",
    "code": "AG",
    "dial_code": "+1268",
    "dialCode": "+1268",
    "flag": "🇦🇬",
    "flagUrl": "https://flagcdn.com/w80/ag.png",
    "flag_url": "https://flagcdn.com/w80/ag.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Argentina",
    "code": "AR",
    "dial_code": "+54",
    "dialCode": "+54",
    "flag": "🇦🇷",
    "flagUrl": "https://flagcdn.com/w80/ar.png",
    "flag_url": "https://flagcdn.com/w80/ar.png",
    "phoneLength": 11,
    "phoneLengths": [
      10,
      11
    ]
  },
  {
    "name": "Armenia",
    "code": "AM",
    "dial_code": "+374",
    "dialCode": "+374",
    "flag": "🇦🇲",
    "flagUrl": "https://flagcdn.com/w80/am.png",
    "flag_url": "https://flagcdn.com/w80/am.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Aruba",
    "code": "AW",
    "dial_code": "+297",
    "dialCode": "+297",
    "flag": "🇦🇼",
    "flagUrl": "https://flagcdn.com/w80/aw.png",
    "flag_url": "https://flagcdn.com/w80/aw.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Australia",
    "code": "AU",
    "dial_code": "+61",
    "dialCode": "+61",
    "flag": "🇦🇺",
    "flagUrl": "https://flagcdn.com/w80/au.png",
    "flag_url": "https://flagcdn.com/w80/au.png",
    "phoneLength": 9,
    "phoneLengths": [
      5,
      6,
      7,
      8,
      9,
      10,
      12
    ]
  },
  {
    "name": "Austria",
    "code": "AT",
    "dial_code": "+43",
    "dialCode": "+43",
    "flag": "🇦🇹",
    "flagUrl": "https://flagcdn.com/w80/at.png",
    "flag_url": "https://flagcdn.com/w80/at.png",
    "phoneLength": 9,
    "phoneLengths": [
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13
    ]
  },
  {
    "name": "Azerbaijan",
    "code": "AZ",
    "dial_code": "+994",
    "dialCode": "+994",
    "flag": "🇦🇿",
    "flagUrl": "https://flagcdn.com/w80/az.png",
    "flag_url": "https://flagcdn.com/w80/az.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Bahamas",
    "code": "BS",
    "dial_code": "+1242",
    "dialCode": "+1242",
    "flag": "🇧🇸",
    "flagUrl": "https://flagcdn.com/w80/bs.png",
    "flag_url": "https://flagcdn.com/w80/bs.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Bahrain",
    "code": "BH",
    "dial_code": "+973",
    "dialCode": "+973",
    "flag": "🇧🇭",
    "flagUrl": "https://flagcdn.com/w80/bh.png",
    "flag_url": "https://flagcdn.com/w80/bh.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Bangladesh",
    "code": "BD",
    "dial_code": "+880",
    "dialCode": "+880",
    "flag": "🇧🇩",
    "flagUrl": "https://flagcdn.com/w80/bd.png",
    "flag_url": "https://flagcdn.com/w80/bd.png",
    "phoneLength": 10,
    "phoneLengths": [
      6,
      7,
      8,
      9,
      10
    ]
  },
  {
    "name": "Barbados",
    "code": "BB",
    "dial_code": "+1246",
    "dialCode": "+1246",
    "flag": "🇧🇧",
    "flagUrl": "https://flagcdn.com/w80/bb.png",
    "flag_url": "https://flagcdn.com/w80/bb.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Belarus",
    "code": "BY",
    "dial_code": "+375",
    "dialCode": "+375",
    "flag": "🇧🇾",
    "flagUrl": "https://flagcdn.com/w80/by.png",
    "flag_url": "https://flagcdn.com/w80/by.png",
    "phoneLength": 9,
    "phoneLengths": [
      6,
      7,
      8,
      9,
      10,
      11
    ]
  },
  {
    "name": "Belgium",
    "code": "BE",
    "dial_code": "+32",
    "dialCode": "+32",
    "flag": "🇧🇪",
    "flagUrl": "https://flagcdn.com/w80/be.png",
    "flag_url": "https://flagcdn.com/w80/be.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Belize",
    "code": "BZ",
    "dial_code": "+501",
    "dialCode": "+501",
    "flag": "🇧🇿",
    "flagUrl": "https://flagcdn.com/w80/bz.png",
    "flag_url": "https://flagcdn.com/w80/bz.png",
    "phoneLength": 7,
    "phoneLengths": [
      7,
      11
    ]
  },
  {
    "name": "Benin",
    "code": "BJ",
    "dial_code": "+229",
    "dialCode": "+229",
    "flag": "🇧🇯",
    "flagUrl": "https://flagcdn.com/w80/bj.png",
    "flag_url": "https://flagcdn.com/w80/bj.png",
    "phoneLength": 10,
    "phoneLengths": [
      8,
      10
    ]
  },
  {
    "name": "Bermuda",
    "code": "BM",
    "dial_code": "+1441",
    "dialCode": "+1441",
    "flag": "🇧🇲",
    "flagUrl": "https://flagcdn.com/w80/bm.png",
    "flag_url": "https://flagcdn.com/w80/bm.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Bhutan",
    "code": "BT",
    "dial_code": "+975",
    "dialCode": "+975",
    "flag": "🇧🇹",
    "flagUrl": "https://flagcdn.com/w80/bt.png",
    "flag_url": "https://flagcdn.com/w80/bt.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8
    ]
  },
  {
    "name": "Bolivia, Plurinational State of bolivia",
    "code": "BO",
    "dial_code": "+591",
    "dialCode": "+591",
    "flag": "🇧🇴",
    "flagUrl": "https://flagcdn.com/w80/bo.png",
    "flag_url": "https://flagcdn.com/w80/bo.png",
    "phoneLength": 8,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Bosnia and Herzegovina",
    "code": "BA",
    "dial_code": "+387",
    "dialCode": "+387",
    "flag": "🇧🇦",
    "flagUrl": "https://flagcdn.com/w80/ba.png",
    "flag_url": "https://flagcdn.com/w80/ba.png",
    "phoneLength": 8,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Botswana",
    "code": "BW",
    "dial_code": "+267",
    "dialCode": "+267",
    "flag": "🇧🇼",
    "flagUrl": "https://flagcdn.com/w80/bw.png",
    "flag_url": "https://flagcdn.com/w80/bw.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8,
      10
    ]
  },
  {
    "name": "Bouvet Island",
    "code": "BV",
    "dial_code": "+47",
    "dialCode": "+47",
    "flag": "🇧🇻",
    "flagUrl": "https://flagcdn.com/w80/bv.png",
    "flag_url": "https://flagcdn.com/w80/bv.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Brazil",
    "code": "BR",
    "dial_code": "+55",
    "dialCode": "+55",
    "flag": "🇧🇷",
    "flagUrl": "https://flagcdn.com/w80/br.png",
    "flag_url": "https://flagcdn.com/w80/br.png",
    "phoneLength": 11,
    "phoneLengths": [
      8,
      9,
      10,
      11
    ]
  },
  {
    "name": "British Indian Ocean Territory",
    "code": "IO",
    "dial_code": "+246",
    "dialCode": "+246",
    "flag": "🇮🇴",
    "flagUrl": "https://flagcdn.com/w80/io.png",
    "flag_url": "https://flagcdn.com/w80/io.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Brunei Darussalam",
    "code": "BN",
    "dial_code": "+673",
    "dialCode": "+673",
    "flag": "🇧🇳",
    "flagUrl": "https://flagcdn.com/w80/bn.png",
    "flag_url": "https://flagcdn.com/w80/bn.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Bulgaria",
    "code": "BG",
    "dial_code": "+359",
    "dialCode": "+359",
    "flag": "🇧🇬",
    "flagUrl": "https://flagcdn.com/w80/bg.png",
    "flag_url": "https://flagcdn.com/w80/bg.png",
    "phoneLength": 8,
    "phoneLengths": [
      6,
      7,
      8,
      9,
      12
    ]
  },
  {
    "name": "Burkina Faso",
    "code": "BF",
    "dial_code": "+226",
    "dialCode": "+226",
    "flag": "🇧🇫",
    "flagUrl": "https://flagcdn.com/w80/bf.png",
    "flag_url": "https://flagcdn.com/w80/bf.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Burundi",
    "code": "BI",
    "dial_code": "+257",
    "dialCode": "+257",
    "flag": "🇧🇮",
    "flagUrl": "https://flagcdn.com/w80/bi.png",
    "flag_url": "https://flagcdn.com/w80/bi.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Cambodia",
    "code": "KH",
    "dial_code": "+855",
    "dialCode": "+855",
    "flag": "🇰🇭",
    "flagUrl": "https://flagcdn.com/w80/kh.png",
    "flag_url": "https://flagcdn.com/w80/kh.png",
    "phoneLength": 8,
    "phoneLengths": [
      8,
      9,
      10
    ]
  },
  {
    "name": "Cameroon",
    "code": "CM",
    "dial_code": "+237",
    "dialCode": "+237",
    "flag": "🇨🇲",
    "flagUrl": "https://flagcdn.com/w80/cm.png",
    "flag_url": "https://flagcdn.com/w80/cm.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Canada",
    "code": "CA",
    "dial_code": "+1",
    "dialCode": "+1",
    "flag": "🇨🇦",
    "flagUrl": "https://flagcdn.com/w80/ca.png",
    "flag_url": "https://flagcdn.com/w80/ca.png",
    "phoneLength": 10,
    "phoneLengths": [
      7,
      10
    ]
  },
  {
    "name": "Cape Verde",
    "code": "CV",
    "dial_code": "+238",
    "dialCode": "+238",
    "flag": "🇨🇻",
    "flagUrl": "https://flagcdn.com/w80/cv.png",
    "flag_url": "https://flagcdn.com/w80/cv.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Cayman Islands",
    "code": "KY",
    "dial_code": "+345",
    "dialCode": "+345",
    "flag": "🇰🇾",
    "flagUrl": "https://flagcdn.com/w80/ky.png",
    "flag_url": "https://flagcdn.com/w80/ky.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Central African Republic",
    "code": "CF",
    "dial_code": "+236",
    "dialCode": "+236",
    "flag": "🇨🇫",
    "flagUrl": "https://flagcdn.com/w80/cf.png",
    "flag_url": "https://flagcdn.com/w80/cf.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Chad",
    "code": "TD",
    "dial_code": "+235",
    "dialCode": "+235",
    "flag": "🇹🇩",
    "flagUrl": "https://flagcdn.com/w80/td.png",
    "flag_url": "https://flagcdn.com/w80/td.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Chile",
    "code": "CL",
    "dial_code": "+56",
    "dialCode": "+56",
    "flag": "🇨🇱",
    "flagUrl": "https://flagcdn.com/w80/cl.png",
    "flag_url": "https://flagcdn.com/w80/cl.png",
    "phoneLength": 9,
    "phoneLengths": [
      9,
      10,
      11
    ]
  },
  {
    "name": "China",
    "code": "CN",
    "dial_code": "+86",
    "dialCode": "+86",
    "flag": "🇨🇳",
    "flagUrl": "https://flagcdn.com/w80/cn.png",
    "flag_url": "https://flagcdn.com/w80/cn.png",
    "phoneLength": 11,
    "phoneLengths": [
      7,
      8,
      9,
      10,
      11,
      12
    ]
  },
  {
    "name": "Christmas Island",
    "code": "CX",
    "dial_code": "+61",
    "dialCode": "+61",
    "flag": "🇨🇽",
    "flagUrl": "https://flagcdn.com/w80/cx.png",
    "flag_url": "https://flagcdn.com/w80/cx.png",
    "phoneLength": 9,
    "phoneLengths": [
      6,
      7,
      8,
      9,
      10,
      12
    ]
  },
  {
    "name": "Cocos (Keeling) Islands",
    "code": "CC",
    "dial_code": "+61",
    "dialCode": "+61",
    "flag": "🇨🇨",
    "flagUrl": "https://flagcdn.com/w80/cc.png",
    "flag_url": "https://flagcdn.com/w80/cc.png",
    "phoneLength": 9,
    "phoneLengths": [
      6,
      7,
      8,
      9,
      10,
      12
    ]
  },
  {
    "name": "Colombia",
    "code": "CO",
    "dial_code": "+57",
    "dialCode": "+57",
    "flag": "🇨🇴",
    "flagUrl": "https://flagcdn.com/w80/co.png",
    "flag_url": "https://flagcdn.com/w80/co.png",
    "phoneLength": 10,
    "phoneLengths": [
      8,
      10,
      11
    ]
  },
  {
    "name": "Comoros",
    "code": "KM",
    "dial_code": "+269",
    "dialCode": "+269",
    "flag": "🇰🇲",
    "flagUrl": "https://flagcdn.com/w80/km.png",
    "flag_url": "https://flagcdn.com/w80/km.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Congo",
    "code": "CG",
    "dial_code": "+242",
    "dialCode": "+242",
    "flag": "🇨🇬",
    "flagUrl": "https://flagcdn.com/w80/cg.png",
    "flag_url": "https://flagcdn.com/w80/cg.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Congo, The Democratic Republic of the Congo",
    "code": "CD",
    "dial_code": "+243",
    "dialCode": "+243",
    "flag": "🇨🇩",
    "flagUrl": "https://flagcdn.com/w80/cd.png",
    "flag_url": "https://flagcdn.com/w80/cd.png",
    "phoneLength": 9,
    "phoneLengths": [
      7,
      8,
      9,
      10
    ]
  },
  {
    "name": "Cook Islands",
    "code": "CK",
    "dial_code": "+682",
    "dialCode": "+682",
    "flag": "🇨🇰",
    "flagUrl": "https://flagcdn.com/w80/ck.png",
    "flag_url": "https://flagcdn.com/w80/ck.png",
    "phoneLength": 5,
    "phoneLengths": [
      5
    ]
  },
  {
    "name": "Costa Rica",
    "code": "CR",
    "dial_code": "+506",
    "dialCode": "+506",
    "flag": "🇨🇷",
    "flagUrl": "https://flagcdn.com/w80/cr.png",
    "flag_url": "https://flagcdn.com/w80/cr.png",
    "phoneLength": 8,
    "phoneLengths": [
      8,
      10
    ]
  },
  {
    "name": "Cote d'Ivoire",
    "code": "CI",
    "dial_code": "+225",
    "dialCode": "+225",
    "flag": "🇨🇮",
    "flagUrl": "https://flagcdn.com/w80/ci.png",
    "flag_url": "https://flagcdn.com/w80/ci.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Croatia",
    "code": "HR",
    "dial_code": "+385",
    "dialCode": "+385",
    "flag": "🇭🇷",
    "flagUrl": "https://flagcdn.com/w80/hr.png",
    "flag_url": "https://flagcdn.com/w80/hr.png",
    "phoneLength": 9,
    "phoneLengths": [
      7,
      8,
      9
    ]
  },
  {
    "name": "Cuba",
    "code": "CU",
    "dial_code": "+53",
    "dialCode": "+53",
    "flag": "🇨🇺",
    "flagUrl": "https://flagcdn.com/w80/cu.png",
    "flag_url": "https://flagcdn.com/w80/cu.png",
    "phoneLength": 8,
    "phoneLengths": [
      6,
      7,
      8,
      10
    ]
  },
  {
    "name": "Cyprus",
    "code": "CY",
    "dial_code": "+357",
    "dialCode": "+357",
    "flag": "🇨🇾",
    "flagUrl": "https://flagcdn.com/w80/cy.png",
    "flag_url": "https://flagcdn.com/w80/cy.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Czech Republic",
    "code": "CZ",
    "dial_code": "+420",
    "dialCode": "+420",
    "flag": "🇨🇿",
    "flagUrl": "https://flagcdn.com/w80/cz.png",
    "flag_url": "https://flagcdn.com/w80/cz.png",
    "phoneLength": 9,
    "phoneLengths": [
      9,
      10,
      11,
      12
    ]
  },
  {
    "name": "Denmark",
    "code": "DK",
    "dial_code": "+45",
    "dialCode": "+45",
    "flag": "🇩🇰",
    "flagUrl": "https://flagcdn.com/w80/dk.png",
    "flag_url": "https://flagcdn.com/w80/dk.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Djibouti",
    "code": "DJ",
    "dial_code": "+253",
    "dialCode": "+253",
    "flag": "🇩🇯",
    "flagUrl": "https://flagcdn.com/w80/dj.png",
    "flag_url": "https://flagcdn.com/w80/dj.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Dominica",
    "code": "DM",
    "dial_code": "+1767",
    "dialCode": "+1767",
    "flag": "🇩🇲",
    "flagUrl": "https://flagcdn.com/w80/dm.png",
    "flag_url": "https://flagcdn.com/w80/dm.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Dominican Republic",
    "code": "DO",
    "dial_code": "+1849",
    "dialCode": "+1849",
    "flag": "🇩🇴",
    "flagUrl": "https://flagcdn.com/w80/do.png",
    "flag_url": "https://flagcdn.com/w80/do.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Ecuador",
    "code": "EC",
    "dial_code": "+593",
    "dialCode": "+593",
    "flag": "🇪🇨",
    "flagUrl": "https://flagcdn.com/w80/ec.png",
    "flag_url": "https://flagcdn.com/w80/ec.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9,
      10,
      11
    ]
  },
  {
    "name": "Egypt",
    "code": "EG",
    "dial_code": "+20",
    "dialCode": "+20",
    "flag": "🇪🇬",
    "flagUrl": "https://flagcdn.com/w80/eg.png",
    "flag_url": "https://flagcdn.com/w80/eg.png",
    "phoneLength": 10,
    "phoneLengths": [
      8,
      9,
      10
    ]
  },
  {
    "name": "El Salvador",
    "code": "SV",
    "dial_code": "+503",
    "dialCode": "+503",
    "flag": "🇸🇻",
    "flagUrl": "https://flagcdn.com/w80/sv.png",
    "flag_url": "https://flagcdn.com/w80/sv.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8,
      11
    ]
  },
  {
    "name": "Equatorial Guinea",
    "code": "GQ",
    "dial_code": "+240",
    "dialCode": "+240",
    "flag": "🇬🇶",
    "flagUrl": "https://flagcdn.com/w80/gq.png",
    "flag_url": "https://flagcdn.com/w80/gq.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Eritrea",
    "code": "ER",
    "dial_code": "+291",
    "dialCode": "+291",
    "flag": "🇪🇷",
    "flagUrl": "https://flagcdn.com/w80/er.png",
    "flag_url": "https://flagcdn.com/w80/er.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Estonia",
    "code": "EE",
    "dial_code": "+372",
    "dialCode": "+372",
    "flag": "🇪🇪",
    "flagUrl": "https://flagcdn.com/w80/ee.png",
    "flag_url": "https://flagcdn.com/w80/ee.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8,
      10
    ]
  },
  {
    "name": "Eswatini",
    "code": "SZ",
    "dial_code": "+268",
    "dialCode": "+268",
    "flag": "🇸🇿",
    "flagUrl": "https://flagcdn.com/w80/sz.png",
    "flag_url": "https://flagcdn.com/w80/sz.png",
    "phoneLength": 8,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Ethiopia",
    "code": "ET",
    "dial_code": "+251",
    "dialCode": "+251",
    "flag": "🇪🇹",
    "flagUrl": "https://flagcdn.com/w80/et.png",
    "flag_url": "https://flagcdn.com/w80/et.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Falkland Islands (Malvinas)",
    "code": "FK",
    "dial_code": "+500",
    "dialCode": "+500",
    "flag": "🇫🇰",
    "flagUrl": "https://flagcdn.com/w80/fk.png",
    "flag_url": "https://flagcdn.com/w80/fk.png",
    "phoneLength": 5,
    "phoneLengths": [
      5
    ]
  },
  {
    "name": "Faroe Islands",
    "code": "FO",
    "dial_code": "+298",
    "dialCode": "+298",
    "flag": "🇫🇴",
    "flagUrl": "https://flagcdn.com/w80/fo.png",
    "flag_url": "https://flagcdn.com/w80/fo.png",
    "phoneLength": 6,
    "phoneLengths": [
      6
    ]
  },
  {
    "name": "Fiji",
    "code": "FJ",
    "dial_code": "+679",
    "dialCode": "+679",
    "flag": "🇫🇯",
    "flagUrl": "https://flagcdn.com/w80/fj.png",
    "flag_url": "https://flagcdn.com/w80/fj.png",
    "phoneLength": 7,
    "phoneLengths": [
      7,
      11
    ]
  },
  {
    "name": "Finland",
    "code": "FI",
    "dial_code": "+358",
    "dialCode": "+358",
    "flag": "🇫🇮",
    "flagUrl": "https://flagcdn.com/w80/fi.png",
    "flag_url": "https://flagcdn.com/w80/fi.png",
    "phoneLength": 9,
    "phoneLengths": [
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ]
  },
  {
    "name": "France",
    "code": "FR",
    "dial_code": "+33",
    "dialCode": "+33",
    "flag": "🇫🇷",
    "flagUrl": "https://flagcdn.com/w80/fr.png",
    "flag_url": "https://flagcdn.com/w80/fr.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "French Guiana",
    "code": "GF",
    "dial_code": "+594",
    "dialCode": "+594",
    "flag": "🇬🇫",
    "flagUrl": "https://flagcdn.com/w80/gf.png",
    "flag_url": "https://flagcdn.com/w80/gf.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "French Polynesia",
    "code": "PF",
    "dial_code": "+689",
    "dialCode": "+689",
    "flag": "🇵🇫",
    "flagUrl": "https://flagcdn.com/w80/pf.png",
    "flag_url": "https://flagcdn.com/w80/pf.png",
    "phoneLength": 8,
    "phoneLengths": [
      6,
      8,
      9
    ]
  },
  {
    "name": "French Southern Territories",
    "code": "TF",
    "dial_code": "+262",
    "dialCode": "+262",
    "flag": "🇹🇫",
    "flagUrl": "https://flagcdn.com/w80/tf.png",
    "flag_url": "https://flagcdn.com/w80/tf.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Gabon",
    "code": "GA",
    "dial_code": "+241",
    "dialCode": "+241",
    "flag": "🇬🇦",
    "flagUrl": "https://flagcdn.com/w80/ga.png",
    "flag_url": "https://flagcdn.com/w80/ga.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8
    ]
  },
  {
    "name": "Gambia",
    "code": "GM",
    "dial_code": "+220",
    "dialCode": "+220",
    "flag": "🇬🇲",
    "flagUrl": "https://flagcdn.com/w80/gm.png",
    "flag_url": "https://flagcdn.com/w80/gm.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Georgia",
    "code": "GE",
    "dial_code": "+995",
    "dialCode": "+995",
    "flag": "🇬🇪",
    "flagUrl": "https://flagcdn.com/w80/ge.png",
    "flag_url": "https://flagcdn.com/w80/ge.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Germany",
    "code": "DE",
    "dial_code": "+49",
    "dialCode": "+49",
    "flag": "🇩🇪",
    "flagUrl": "https://flagcdn.com/w80/de.png",
    "flag_url": "https://flagcdn.com/w80/de.png",
    "phoneLength": 11,
    "phoneLengths": [
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15
    ]
  },
  {
    "name": "Ghana",
    "code": "GH",
    "dial_code": "+233",
    "dialCode": "+233",
    "flag": "🇬🇭",
    "flagUrl": "https://flagcdn.com/w80/gh.png",
    "flag_url": "https://flagcdn.com/w80/gh.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Gibraltar",
    "code": "GI",
    "dial_code": "+350",
    "dialCode": "+350",
    "flag": "🇬🇮",
    "flagUrl": "https://flagcdn.com/w80/gi.png",
    "flag_url": "https://flagcdn.com/w80/gi.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Greece",
    "code": "GR",
    "dial_code": "+30",
    "dialCode": "+30",
    "flag": "🇬🇷",
    "flagUrl": "https://flagcdn.com/w80/gr.png",
    "flag_url": "https://flagcdn.com/w80/gr.png",
    "phoneLength": 10,
    "phoneLengths": [
      10,
      11,
      12
    ]
  },
  {
    "name": "Greenland",
    "code": "GL",
    "dial_code": "+299",
    "dialCode": "+299",
    "flag": "🇬🇱",
    "flagUrl": "https://flagcdn.com/w80/gl.png",
    "flag_url": "https://flagcdn.com/w80/gl.png",
    "phoneLength": 6,
    "phoneLengths": [
      6
    ]
  },
  {
    "name": "Grenada",
    "code": "GD",
    "dial_code": "+1473",
    "dialCode": "+1473",
    "flag": "🇬🇩",
    "flagUrl": "https://flagcdn.com/w80/gd.png",
    "flag_url": "https://flagcdn.com/w80/gd.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Guadeloupe",
    "code": "GP",
    "dial_code": "+590",
    "dialCode": "+590",
    "flag": "🇬🇵",
    "flagUrl": "https://flagcdn.com/w80/gp.png",
    "flag_url": "https://flagcdn.com/w80/gp.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Guam",
    "code": "GU",
    "dial_code": "+1671",
    "dialCode": "+1671",
    "flag": "🇬🇺",
    "flagUrl": "https://flagcdn.com/w80/gu.png",
    "flag_url": "https://flagcdn.com/w80/gu.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Guatemala",
    "code": "GT",
    "dial_code": "+502",
    "dialCode": "+502",
    "flag": "🇬🇹",
    "flagUrl": "https://flagcdn.com/w80/gt.png",
    "flag_url": "https://flagcdn.com/w80/gt.png",
    "phoneLength": 8,
    "phoneLengths": [
      8,
      11
    ]
  },
  {
    "name": "Guernsey",
    "code": "GG",
    "dial_code": "+44",
    "dialCode": "+44",
    "flag": "🇬🇬",
    "flagUrl": "https://flagcdn.com/w80/gg.png",
    "flag_url": "https://flagcdn.com/w80/gg.png",
    "phoneLength": 10,
    "phoneLengths": [
      7,
      9,
      10
    ]
  },
  {
    "name": "Guinea",
    "code": "GN",
    "dial_code": "+224",
    "dialCode": "+224",
    "flag": "🇬🇳",
    "flagUrl": "https://flagcdn.com/w80/gn.png",
    "flag_url": "https://flagcdn.com/w80/gn.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Guinea-Bissau",
    "code": "GW",
    "dial_code": "+245",
    "dialCode": "+245",
    "flag": "🇬🇼",
    "flagUrl": "https://flagcdn.com/w80/gw.png",
    "flag_url": "https://flagcdn.com/w80/gw.png",
    "phoneLength": 9,
    "phoneLengths": [
      7,
      9
    ]
  },
  {
    "name": "Guyana",
    "code": "GY",
    "dial_code": "+592",
    "dialCode": "+592",
    "flag": "🇬🇾",
    "flagUrl": "https://flagcdn.com/w80/gy.png",
    "flag_url": "https://flagcdn.com/w80/gy.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Haiti",
    "code": "HT",
    "dial_code": "+509",
    "dialCode": "+509",
    "flag": "🇭🇹",
    "flagUrl": "https://flagcdn.com/w80/ht.png",
    "flag_url": "https://flagcdn.com/w80/ht.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Heard Island and Mcdonald Islands",
    "code": "HM",
    "dial_code": "+672",
    "dialCode": "+672",
    "flag": "🇭🇲",
    "flagUrl": "https://flagcdn.com/w80/hm.png",
    "flag_url": "https://flagcdn.com/w80/hm.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Holy See (Vatican City State)",
    "code": "VA",
    "dial_code": "+379",
    "dialCode": "+379",
    "flag": "🇻🇦",
    "flagUrl": "https://flagcdn.com/w80/va.png",
    "flag_url": "https://flagcdn.com/w80/va.png",
    "phoneLength": 10,
    "phoneLengths": [
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ]
  },
  {
    "name": "Honduras",
    "code": "HN",
    "dial_code": "+504",
    "dialCode": "+504",
    "flag": "🇭🇳",
    "flagUrl": "https://flagcdn.com/w80/hn.png",
    "flag_url": "https://flagcdn.com/w80/hn.png",
    "phoneLength": 8,
    "phoneLengths": [
      8,
      11
    ]
  },
  {
    "name": "Hong Kong",
    "code": "HK",
    "dial_code": "+852",
    "dialCode": "+852",
    "flag": "🇭🇰",
    "flagUrl": "https://flagcdn.com/w80/hk.png",
    "flag_url": "https://flagcdn.com/w80/hk.png",
    "phoneLength": 8,
    "phoneLengths": [
      5,
      6,
      7,
      8,
      9,
      11
    ]
  },
  {
    "name": "Hungary",
    "code": "HU",
    "dial_code": "+36",
    "dialCode": "+36",
    "flag": "🇭🇺",
    "flagUrl": "https://flagcdn.com/w80/hu.png",
    "flag_url": "https://flagcdn.com/w80/hu.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Iceland",
    "code": "IS",
    "dial_code": "+354",
    "dialCode": "+354",
    "flag": "🇮🇸",
    "flagUrl": "https://flagcdn.com/w80/is.png",
    "flag_url": "https://flagcdn.com/w80/is.png",
    "phoneLength": 7,
    "phoneLengths": [
      7,
      9
    ]
  },
  {
    "name": "India",
    "code": "IN",
    "dial_code": "+91",
    "dialCode": "+91",
    "flag": "🇮🇳",
    "flagUrl": "https://flagcdn.com/w80/in.png",
    "flag_url": "https://flagcdn.com/w80/in.png",
    "phoneLength": 10,
    "phoneLengths": [
      8,
      9,
      10,
      11,
      12,
      13
    ]
  },
  {
    "name": "Indonesia",
    "code": "ID",
    "dial_code": "+62",
    "dialCode": "+62",
    "flag": "🇮🇩",
    "flagUrl": "https://flagcdn.com/w80/id.png",
    "flag_url": "https://flagcdn.com/w80/id.png",
    "phoneLength": 9,
    "phoneLengths": [
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17
    ]
  },
  {
    "name": "Iran, Islamic Republic of Persian Gulf",
    "code": "IR",
    "dial_code": "+98",
    "dialCode": "+98",
    "flag": "🇮🇷",
    "flagUrl": "https://flagcdn.com/w80/ir.png",
    "flag_url": "https://flagcdn.com/w80/ir.png",
    "phoneLength": 10,
    "phoneLengths": [
      4,
      5,
      6,
      7,
      10
    ]
  },
  {
    "name": "Iraq",
    "code": "IQ",
    "dial_code": "+964",
    "dialCode": "+964",
    "flag": "🇮🇶",
    "flagUrl": "https://flagcdn.com/w80/iq.png",
    "flag_url": "https://flagcdn.com/w80/iq.png",
    "phoneLength": 10,
    "phoneLengths": [
      8,
      9,
      10
    ]
  },
  {
    "name": "Ireland",
    "code": "IE",
    "dial_code": "+353",
    "dialCode": "+353",
    "flag": "🇮🇪",
    "flagUrl": "https://flagcdn.com/w80/ie.png",
    "flag_url": "https://flagcdn.com/w80/ie.png",
    "phoneLength": 9,
    "phoneLengths": [
      7,
      8,
      9,
      10
    ]
  },
  {
    "name": "Isle of Man",
    "code": "IM",
    "dial_code": "+44",
    "dialCode": "+44",
    "flag": "🇮🇲",
    "flagUrl": "https://flagcdn.com/w80/im.png",
    "flag_url": "https://flagcdn.com/w80/im.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Israel",
    "code": "IL",
    "dial_code": "+972",
    "dialCode": "+972",
    "flag": "🇮🇱",
    "flagUrl": "https://flagcdn.com/w80/il.png",
    "flag_url": "https://flagcdn.com/w80/il.png",
    "phoneLength": 9,
    "phoneLengths": [
      7,
      8,
      9,
      10,
      11,
      12
    ]
  },
  {
    "name": "Italy",
    "code": "IT",
    "dial_code": "+39",
    "dialCode": "+39",
    "flag": "🇮🇹",
    "flagUrl": "https://flagcdn.com/w80/it.png",
    "flag_url": "https://flagcdn.com/w80/it.png",
    "phoneLength": 10,
    "phoneLengths": [
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ]
  },
  {
    "name": "Jamaica",
    "code": "JM",
    "dial_code": "+1876",
    "dialCode": "+1876",
    "flag": "🇯🇲",
    "flagUrl": "https://flagcdn.com/w80/jm.png",
    "flag_url": "https://flagcdn.com/w80/jm.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Japan",
    "code": "JP",
    "dial_code": "+81",
    "dialCode": "+81",
    "flag": "🇯🇵",
    "flagUrl": "https://flagcdn.com/w80/jp.png",
    "flag_url": "https://flagcdn.com/w80/jp.png",
    "phoneLength": 10,
    "phoneLengths": [
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17
    ]
  },
  {
    "name": "Jersey",
    "code": "JE",
    "dial_code": "+44",
    "dialCode": "+44",
    "flag": "🇯🇪",
    "flagUrl": "https://flagcdn.com/w80/je.png",
    "flag_url": "https://flagcdn.com/w80/je.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Jordan",
    "code": "JO",
    "dial_code": "+962",
    "dialCode": "+962",
    "flag": "🇯🇴",
    "flagUrl": "https://flagcdn.com/w80/jo.png",
    "flag_url": "https://flagcdn.com/w80/jo.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Kazakhstan",
    "code": "KZ",
    "dial_code": "+7",
    "dialCode": "+7",
    "flag": "🇰🇿",
    "flagUrl": "https://flagcdn.com/w80/kz.png",
    "flag_url": "https://flagcdn.com/w80/kz.png",
    "phoneLength": 10,
    "phoneLengths": [
      10,
      14
    ]
  },
  {
    "name": "Kenya",
    "code": "KE",
    "dial_code": "+254",
    "dialCode": "+254",
    "flag": "🇰🇪",
    "flagUrl": "https://flagcdn.com/w80/ke.png",
    "flag_url": "https://flagcdn.com/w80/ke.png",
    "phoneLength": 9,
    "phoneLengths": [
      7,
      8,
      9,
      10
    ]
  },
  {
    "name": "Kiribati",
    "code": "KI",
    "dial_code": "+686",
    "dialCode": "+686",
    "flag": "🇰🇮",
    "flagUrl": "https://flagcdn.com/w80/ki.png",
    "flag_url": "https://flagcdn.com/w80/ki.png",
    "phoneLength": 8,
    "phoneLengths": [
      5,
      8
    ]
  },
  {
    "name": "Korea, Democratic People's Republic of Korea",
    "code": "KP",
    "dial_code": "+850",
    "dialCode": "+850",
    "flag": "🇰🇵",
    "flagUrl": "https://flagcdn.com/w80/kp.png",
    "flag_url": "https://flagcdn.com/w80/kp.png",
    "phoneLength": 10,
    "phoneLengths": [
      8,
      10
    ]
  },
  {
    "name": "Korea, Republic of South Korea",
    "code": "KR",
    "dial_code": "+82",
    "dialCode": "+82",
    "flag": "🇰🇷",
    "flagUrl": "https://flagcdn.com/w80/kr.png",
    "flag_url": "https://flagcdn.com/w80/kr.png",
    "phoneLength": 10,
    "phoneLengths": [
      5,
      6,
      8,
      9,
      10,
      11,
      12,
      13,
      14
    ]
  },
  {
    "name": "Kosovo",
    "code": "XK",
    "dial_code": "+383",
    "dialCode": "+383",
    "flag": "🇽🇰",
    "flagUrl": "https://flagcdn.com/w80/xk.png",
    "flag_url": "https://flagcdn.com/w80/xk.png",
    "phoneLength": 8,
    "phoneLengths": [
      8,
      9,
      10,
      11,
      12
    ]
  },
  {
    "name": "Kuwait",
    "code": "KW",
    "dial_code": "+965",
    "dialCode": "+965",
    "flag": "🇰🇼",
    "flagUrl": "https://flagcdn.com/w80/kw.png",
    "flag_url": "https://flagcdn.com/w80/kw.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8
    ]
  },
  {
    "name": "Kyrgyzstan",
    "code": "KG",
    "dial_code": "+996",
    "dialCode": "+996",
    "flag": "🇰🇬",
    "flagUrl": "https://flagcdn.com/w80/kg.png",
    "flag_url": "https://flagcdn.com/w80/kg.png",
    "phoneLength": 9,
    "phoneLengths": [
      9,
      10
    ]
  },
  {
    "name": "Laos",
    "code": "LA",
    "dial_code": "+856",
    "dialCode": "+856",
    "flag": "🇱🇦",
    "flagUrl": "https://flagcdn.com/w80/la.png",
    "flag_url": "https://flagcdn.com/w80/la.png",
    "phoneLength": 10,
    "phoneLengths": [
      8,
      9,
      10
    ]
  },
  {
    "name": "Latvia",
    "code": "LV",
    "dial_code": "+371",
    "dialCode": "+371",
    "flag": "🇱🇻",
    "flagUrl": "https://flagcdn.com/w80/lv.png",
    "flag_url": "https://flagcdn.com/w80/lv.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Lebanon",
    "code": "LB",
    "dial_code": "+961",
    "dialCode": "+961",
    "flag": "🇱🇧",
    "flagUrl": "https://flagcdn.com/w80/lb.png",
    "flag_url": "https://flagcdn.com/w80/lb.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8
    ]
  },
  {
    "name": "Lesotho",
    "code": "LS",
    "dial_code": "+266",
    "dialCode": "+266",
    "flag": "🇱🇸",
    "flagUrl": "https://flagcdn.com/w80/ls.png",
    "flag_url": "https://flagcdn.com/w80/ls.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Liberia",
    "code": "LR",
    "dial_code": "+231",
    "dialCode": "+231",
    "flag": "🇱🇷",
    "flagUrl": "https://flagcdn.com/w80/lr.png",
    "flag_url": "https://flagcdn.com/w80/lr.png",
    "phoneLength": 9,
    "phoneLengths": [
      7,
      8,
      9
    ]
  },
  {
    "name": "Libyan Arab Jamahiriya",
    "code": "LY",
    "dial_code": "+218",
    "dialCode": "+218",
    "flag": "🇱🇾",
    "flagUrl": "https://flagcdn.com/w80/ly.png",
    "flag_url": "https://flagcdn.com/w80/ly.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Liechtenstein",
    "code": "LI",
    "dial_code": "+423",
    "dialCode": "+423",
    "flag": "🇱🇮",
    "flagUrl": "https://flagcdn.com/w80/li.png",
    "flag_url": "https://flagcdn.com/w80/li.png",
    "phoneLength": 9,
    "phoneLengths": [
      7,
      9
    ]
  },
  {
    "name": "Lithuania",
    "code": "LT",
    "dial_code": "+370",
    "dialCode": "+370",
    "flag": "🇱🇹",
    "flagUrl": "https://flagcdn.com/w80/lt.png",
    "flag_url": "https://flagcdn.com/w80/lt.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Luxembourg",
    "code": "LU",
    "dial_code": "+352",
    "dialCode": "+352",
    "flag": "🇱🇺",
    "flagUrl": "https://flagcdn.com/w80/lu.png",
    "flag_url": "https://flagcdn.com/w80/lu.png",
    "phoneLength": 9,
    "phoneLengths": [
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11
    ]
  },
  {
    "name": "Macao",
    "code": "MO",
    "dial_code": "+853",
    "dialCode": "+853",
    "flag": "🇲🇴",
    "flagUrl": "https://flagcdn.com/w80/mo.png",
    "flag_url": "https://flagcdn.com/w80/mo.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8
    ]
  },
  {
    "name": "Macedonia",
    "code": "MK",
    "dial_code": "+389",
    "dialCode": "+389",
    "flag": "🇲🇰",
    "flagUrl": "https://flagcdn.com/w80/mk.png",
    "flag_url": "https://flagcdn.com/w80/mk.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Madagascar",
    "code": "MG",
    "dial_code": "+261",
    "dialCode": "+261",
    "flag": "🇲🇬",
    "flagUrl": "https://flagcdn.com/w80/mg.png",
    "flag_url": "https://flagcdn.com/w80/mg.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Malawi",
    "code": "MW",
    "dial_code": "+265",
    "dialCode": "+265",
    "flag": "🇲🇼",
    "flagUrl": "https://flagcdn.com/w80/mw.png",
    "flag_url": "https://flagcdn.com/w80/mw.png",
    "phoneLength": 9,
    "phoneLengths": [
      7,
      9
    ]
  },
  {
    "name": "Malaysia",
    "code": "MY",
    "dial_code": "+60",
    "dialCode": "+60",
    "flag": "🇲🇾",
    "flagUrl": "https://flagcdn.com/w80/my.png",
    "flag_url": "https://flagcdn.com/w80/my.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9,
      10
    ]
  },
  {
    "name": "Maldives",
    "code": "MV",
    "dial_code": "+960",
    "dialCode": "+960",
    "flag": "🇲🇻",
    "flagUrl": "https://flagcdn.com/w80/mv.png",
    "flag_url": "https://flagcdn.com/w80/mv.png",
    "phoneLength": 7,
    "phoneLengths": [
      7,
      10
    ]
  },
  {
    "name": "Mali",
    "code": "ML",
    "dial_code": "+223",
    "dialCode": "+223",
    "flag": "🇲🇱",
    "flagUrl": "https://flagcdn.com/w80/ml.png",
    "flag_url": "https://flagcdn.com/w80/ml.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Malta",
    "code": "MT",
    "dial_code": "+356",
    "dialCode": "+356",
    "flag": "🇲🇹",
    "flagUrl": "https://flagcdn.com/w80/mt.png",
    "flag_url": "https://flagcdn.com/w80/mt.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Marshall Islands",
    "code": "MH",
    "dial_code": "+692",
    "dialCode": "+692",
    "flag": "🇲🇭",
    "flagUrl": "https://flagcdn.com/w80/mh.png",
    "flag_url": "https://flagcdn.com/w80/mh.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Martinique",
    "code": "MQ",
    "dial_code": "+596",
    "dialCode": "+596",
    "flag": "🇲🇶",
    "flagUrl": "https://flagcdn.com/w80/mq.png",
    "flag_url": "https://flagcdn.com/w80/mq.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Mauritania",
    "code": "MR",
    "dial_code": "+222",
    "dialCode": "+222",
    "flag": "🇲🇷",
    "flagUrl": "https://flagcdn.com/w80/mr.png",
    "flag_url": "https://flagcdn.com/w80/mr.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Mauritius",
    "code": "MU",
    "dial_code": "+230",
    "dialCode": "+230",
    "flag": "🇲🇺",
    "flagUrl": "https://flagcdn.com/w80/mu.png",
    "flag_url": "https://flagcdn.com/w80/mu.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8,
      10
    ]
  },
  {
    "name": "Mayotte",
    "code": "YT",
    "dial_code": "+262",
    "dialCode": "+262",
    "flag": "🇾🇹",
    "flagUrl": "https://flagcdn.com/w80/yt.png",
    "flag_url": "https://flagcdn.com/w80/yt.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Mexico",
    "code": "MX",
    "dial_code": "+52",
    "dialCode": "+52",
    "flag": "🇲🇽",
    "flagUrl": "https://flagcdn.com/w80/mx.png",
    "flag_url": "https://flagcdn.com/w80/mx.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Micronesia, Federated States of Micronesia",
    "code": "FM",
    "dial_code": "+691",
    "dialCode": "+691",
    "flag": "🇫🇲",
    "flagUrl": "https://flagcdn.com/w80/fm.png",
    "flag_url": "https://flagcdn.com/w80/fm.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Moldova",
    "code": "MD",
    "dial_code": "+373",
    "dialCode": "+373",
    "flag": "🇲🇩",
    "flagUrl": "https://flagcdn.com/w80/md.png",
    "flag_url": "https://flagcdn.com/w80/md.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Monaco",
    "code": "MC",
    "dial_code": "+377",
    "dialCode": "+377",
    "flag": "🇲🇨",
    "flagUrl": "https://flagcdn.com/w80/mc.png",
    "flag_url": "https://flagcdn.com/w80/mc.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Mongolia",
    "code": "MN",
    "dial_code": "+976",
    "dialCode": "+976",
    "flag": "🇲🇳",
    "flagUrl": "https://flagcdn.com/w80/mn.png",
    "flag_url": "https://flagcdn.com/w80/mn.png",
    "phoneLength": 8,
    "phoneLengths": [
      8,
      9,
      10
    ]
  },
  {
    "name": "Montenegro",
    "code": "ME",
    "dial_code": "+382",
    "dialCode": "+382",
    "flag": "🇲🇪",
    "flagUrl": "https://flagcdn.com/w80/me.png",
    "flag_url": "https://flagcdn.com/w80/me.png",
    "phoneLength": 8,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Montserrat",
    "code": "MS",
    "dial_code": "+1664",
    "dialCode": "+1664",
    "flag": "🇲🇸",
    "flagUrl": "https://flagcdn.com/w80/ms.png",
    "flag_url": "https://flagcdn.com/w80/ms.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Morocco",
    "code": "MA",
    "dial_code": "+212",
    "dialCode": "+212",
    "flag": "🇲🇦",
    "flagUrl": "https://flagcdn.com/w80/ma.png",
    "flag_url": "https://flagcdn.com/w80/ma.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Mozambique",
    "code": "MZ",
    "dial_code": "+258",
    "dialCode": "+258",
    "flag": "🇲🇿",
    "flagUrl": "https://flagcdn.com/w80/mz.png",
    "flag_url": "https://flagcdn.com/w80/mz.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Myanmar",
    "code": "MM",
    "dial_code": "+95",
    "dialCode": "+95",
    "flag": "🇲🇲",
    "flagUrl": "https://flagcdn.com/w80/mm.png",
    "flag_url": "https://flagcdn.com/w80/mm.png",
    "phoneLength": 8,
    "phoneLengths": [
      6,
      7,
      8,
      9,
      10
    ]
  },
  {
    "name": "Namibia",
    "code": "NA",
    "dial_code": "+264",
    "dialCode": "+264",
    "flag": "🇳🇦",
    "flagUrl": "https://flagcdn.com/w80/na.png",
    "flag_url": "https://flagcdn.com/w80/na.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Nauru",
    "code": "NR",
    "dial_code": "+674",
    "dialCode": "+674",
    "flag": "🇳🇷",
    "flagUrl": "https://flagcdn.com/w80/nr.png",
    "flag_url": "https://flagcdn.com/w80/nr.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Nepal",
    "code": "NP",
    "dial_code": "+977",
    "dialCode": "+977",
    "flag": "🇳🇵",
    "flagUrl": "https://flagcdn.com/w80/np.png",
    "flag_url": "https://flagcdn.com/w80/np.png",
    "phoneLength": 10,
    "phoneLengths": [
      8,
      10,
      11
    ]
  },
  {
    "name": "Netherlands",
    "code": "NL",
    "dial_code": "+31",
    "dialCode": "+31",
    "flag": "🇳🇱",
    "flagUrl": "https://flagcdn.com/w80/nl.png",
    "flag_url": "https://flagcdn.com/w80/nl.png",
    "phoneLength": 9,
    "phoneLengths": [
      5,
      6,
      7,
      8,
      9,
      10,
      11
    ]
  },
  {
    "name": "Netherlands Antilles",
    "code": "AN",
    "dial_code": "+599",
    "dialCode": "+599",
    "flag": "",
    "flagUrl": "https://flagcdn.com/w80/an.png",
    "flag_url": "https://flagcdn.com/w80/an.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "New Caledonia",
    "code": "NC",
    "dial_code": "+687",
    "dialCode": "+687",
    "flag": "🇳🇨",
    "flagUrl": "https://flagcdn.com/w80/nc.png",
    "flag_url": "https://flagcdn.com/w80/nc.png",
    "phoneLength": 6,
    "phoneLengths": [
      6
    ]
  },
  {
    "name": "New Zealand",
    "code": "NZ",
    "dial_code": "+64",
    "dialCode": "+64",
    "flag": "🇳🇿",
    "flagUrl": "https://flagcdn.com/w80/nz.png",
    "flag_url": "https://flagcdn.com/w80/nz.png",
    "phoneLength": 9,
    "phoneLengths": [
      5,
      6,
      7,
      8,
      9,
      10
    ]
  },
  {
    "name": "Nicaragua",
    "code": "NI",
    "dial_code": "+505",
    "dialCode": "+505",
    "flag": "🇳🇮",
    "flagUrl": "https://flagcdn.com/w80/ni.png",
    "flag_url": "https://flagcdn.com/w80/ni.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Niger",
    "code": "NE",
    "dial_code": "+227",
    "dialCode": "+227",
    "flag": "🇳🇪",
    "flagUrl": "https://flagcdn.com/w80/ne.png",
    "flag_url": "https://flagcdn.com/w80/ne.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Nigeria",
    "code": "NG",
    "dial_code": "+234",
    "dialCode": "+234",
    "flag": "🇳🇬",
    "flagUrl": "https://flagcdn.com/w80/ng.png",
    "flag_url": "https://flagcdn.com/w80/ng.png",
    "phoneLength": 10,
    "phoneLengths": [
      10,
      11,
      12,
      13,
      14
    ]
  },
  {
    "name": "Niue",
    "code": "NU",
    "dial_code": "+683",
    "dialCode": "+683",
    "flag": "🇳🇺",
    "flagUrl": "https://flagcdn.com/w80/nu.png",
    "flag_url": "https://flagcdn.com/w80/nu.png",
    "phoneLength": 7,
    "phoneLengths": [
      4,
      7
    ]
  },
  {
    "name": "Norfolk Island",
    "code": "NF",
    "dial_code": "+672",
    "dialCode": "+672",
    "flag": "🇳🇫",
    "flagUrl": "https://flagcdn.com/w80/nf.png",
    "flag_url": "https://flagcdn.com/w80/nf.png",
    "phoneLength": 6,
    "phoneLengths": [
      6
    ]
  },
  {
    "name": "Northern Mariana Islands",
    "code": "MP",
    "dial_code": "+1670",
    "dialCode": "+1670",
    "flag": "🇲🇵",
    "flagUrl": "https://flagcdn.com/w80/mp.png",
    "flag_url": "https://flagcdn.com/w80/mp.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Norway",
    "code": "NO",
    "dial_code": "+47",
    "dialCode": "+47",
    "flag": "🇳🇴",
    "flagUrl": "https://flagcdn.com/w80/no.png",
    "flag_url": "https://flagcdn.com/w80/no.png",
    "phoneLength": 8,
    "phoneLengths": [
      5,
      8
    ]
  },
  {
    "name": "Oman",
    "code": "OM",
    "dial_code": "+968",
    "dialCode": "+968",
    "flag": "🇴🇲",
    "flagUrl": "https://flagcdn.com/w80/om.png",
    "flag_url": "https://flagcdn.com/w80/om.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8,
      9
    ]
  },
  {
    "name": "Pakistan",
    "code": "PK",
    "dial_code": "+92",
    "dialCode": "+92",
    "flag": "🇵🇰",
    "flagUrl": "https://flagcdn.com/w80/pk.png",
    "flag_url": "https://flagcdn.com/w80/pk.png",
    "phoneLength": 10,
    "phoneLengths": [
      8,
      9,
      10,
      11,
      12
    ]
  },
  {
    "name": "Palau",
    "code": "PW",
    "dial_code": "+680",
    "dialCode": "+680",
    "flag": "🇵🇼",
    "flagUrl": "https://flagcdn.com/w80/pw.png",
    "flag_url": "https://flagcdn.com/w80/pw.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Palestinian Territory, Occupied",
    "code": "PS",
    "dial_code": "+970",
    "dialCode": "+970",
    "flag": "🇵🇸",
    "flagUrl": "https://flagcdn.com/w80/ps.png",
    "flag_url": "https://flagcdn.com/w80/ps.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9,
      10
    ]
  },
  {
    "name": "Panama",
    "code": "PA",
    "dial_code": "+507",
    "dialCode": "+507",
    "flag": "🇵🇦",
    "flagUrl": "https://flagcdn.com/w80/pa.png",
    "flag_url": "https://flagcdn.com/w80/pa.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8,
      10,
      11
    ]
  },
  {
    "name": "Papua New Guinea",
    "code": "PG",
    "dial_code": "+675",
    "dialCode": "+675",
    "flag": "🇵🇬",
    "flagUrl": "https://flagcdn.com/w80/pg.png",
    "flag_url": "https://flagcdn.com/w80/pg.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8
    ]
  },
  {
    "name": "Paraguay",
    "code": "PY",
    "dial_code": "+595",
    "dialCode": "+595",
    "flag": "🇵🇾",
    "flagUrl": "https://flagcdn.com/w80/py.png",
    "flag_url": "https://flagcdn.com/w80/py.png",
    "phoneLength": 9,
    "phoneLengths": [
      6,
      7,
      8,
      9,
      10,
      11
    ]
  },
  {
    "name": "Peru",
    "code": "PE",
    "dial_code": "+51",
    "dialCode": "+51",
    "flag": "🇵🇪",
    "flagUrl": "https://flagcdn.com/w80/pe.png",
    "flag_url": "https://flagcdn.com/w80/pe.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Philippines",
    "code": "PH",
    "dial_code": "+63",
    "dialCode": "+63",
    "flag": "🇵🇭",
    "flagUrl": "https://flagcdn.com/w80/ph.png",
    "flag_url": "https://flagcdn.com/w80/ph.png",
    "phoneLength": 10,
    "phoneLengths": [
      6,
      8,
      9,
      10,
      11,
      12,
      13
    ]
  },
  {
    "name": "Pitcairn",
    "code": "PN",
    "dial_code": "+64",
    "dialCode": "+64",
    "flag": "🇵🇳",
    "flagUrl": "https://flagcdn.com/w80/pn.png",
    "flag_url": "https://flagcdn.com/w80/pn.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Poland",
    "code": "PL",
    "dial_code": "+48",
    "dialCode": "+48",
    "flag": "🇵🇱",
    "flagUrl": "https://flagcdn.com/w80/pl.png",
    "flag_url": "https://flagcdn.com/w80/pl.png",
    "phoneLength": 9,
    "phoneLengths": [
      6,
      7,
      8,
      9,
      10
    ]
  },
  {
    "name": "Portugal",
    "code": "PT",
    "dial_code": "+351",
    "dialCode": "+351",
    "flag": "🇵🇹",
    "flagUrl": "https://flagcdn.com/w80/pt.png",
    "flag_url": "https://flagcdn.com/w80/pt.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Puerto Rico",
    "code": "PR",
    "dial_code": "+1939",
    "dialCode": "+1939",
    "flag": "🇵🇷",
    "flagUrl": "https://flagcdn.com/w80/pr.png",
    "flag_url": "https://flagcdn.com/w80/pr.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Qatar",
    "code": "QA",
    "dial_code": "+974",
    "dialCode": "+974",
    "flag": "🇶🇦",
    "flagUrl": "https://flagcdn.com/w80/qa.png",
    "flag_url": "https://flagcdn.com/w80/qa.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8,
      9,
      11
    ]
  },
  {
    "name": "Reunion",
    "code": "RE",
    "dial_code": "+262",
    "dialCode": "+262",
    "flag": "🇷🇪",
    "flagUrl": "https://flagcdn.com/w80/re.png",
    "flag_url": "https://flagcdn.com/w80/re.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Romania",
    "code": "RO",
    "dial_code": "+40",
    "dialCode": "+40",
    "flag": "🇷🇴",
    "flagUrl": "https://flagcdn.com/w80/ro.png",
    "flag_url": "https://flagcdn.com/w80/ro.png",
    "phoneLength": 9,
    "phoneLengths": [
      6,
      9
    ]
  },
  {
    "name": "Russia",
    "code": "RU",
    "dial_code": "+7",
    "dialCode": "+7",
    "flag": "🇷����",
    "flagUrl": "https://flagcdn.com/w80/ru.png",
    "flag_url": "https://flagcdn.com/w80/ru.png",
    "phoneLength": 10,
    "phoneLengths": [
      10,
      14
    ]
  },
  {
    "name": "Rwanda",
    "code": "RW",
    "dial_code": "+250",
    "dialCode": "+250",
    "flag": "🇷🇼",
    "flagUrl": "https://flagcdn.com/w80/rw.png",
    "flag_url": "https://flagcdn.com/w80/rw.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Saint Barthelemy",
    "code": "BL",
    "dial_code": "+590",
    "dialCode": "+590",
    "flag": "🇧🇱",
    "flagUrl": "https://flagcdn.com/w80/bl.png",
    "flag_url": "https://flagcdn.com/w80/bl.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Saint Helena, Ascension and Tristan Da Cunha",
    "code": "SH",
    "dial_code": "+290",
    "dialCode": "+290",
    "flag": "🇸🇭",
    "flagUrl": "https://flagcdn.com/w80/sh.png",
    "flag_url": "https://flagcdn.com/w80/sh.png",
    "phoneLength": 5,
    "phoneLengths": [
      4,
      5
    ]
  },
  {
    "name": "Saint Kitts and Nevis",
    "code": "KN",
    "dial_code": "+1869",
    "dialCode": "+1869",
    "flag": "🇰🇳",
    "flagUrl": "https://flagcdn.com/w80/kn.png",
    "flag_url": "https://flagcdn.com/w80/kn.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Saint Lucia",
    "code": "LC",
    "dial_code": "+1758",
    "dialCode": "+1758",
    "flag": "🇱🇨",
    "flagUrl": "https://flagcdn.com/w80/lc.png",
    "flag_url": "https://flagcdn.com/w80/lc.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Saint Martin",
    "code": "MF",
    "dial_code": "+590",
    "dialCode": "+590",
    "flag": "🇲🇫",
    "flagUrl": "https://flagcdn.com/w80/mf.png",
    "flag_url": "https://flagcdn.com/w80/mf.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Saint Pierre and Miquelon",
    "code": "PM",
    "dial_code": "+508",
    "dialCode": "+508",
    "flag": "🇵🇲",
    "flagUrl": "https://flagcdn.com/w80/pm.png",
    "flag_url": "https://flagcdn.com/w80/pm.png",
    "phoneLength": 6,
    "phoneLengths": [
      6,
      9
    ]
  },
  {
    "name": "Saint Vincent and the Grenadines",
    "code": "VC",
    "dial_code": "+1784",
    "dialCode": "+1784",
    "flag": "🇻🇨",
    "flagUrl": "https://flagcdn.com/w80/vc.png",
    "flag_url": "https://flagcdn.com/w80/vc.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Samoa",
    "code": "WS",
    "dial_code": "+685",
    "dialCode": "+685",
    "flag": "🇼🇸",
    "flagUrl": "https://flagcdn.com/w80/ws.png",
    "flag_url": "https://flagcdn.com/w80/ws.png",
    "phoneLength": 7,
    "phoneLengths": [
      5,
      6,
      7,
      10
    ]
  },
  {
    "name": "San Marino",
    "code": "SM",
    "dial_code": "+378",
    "dialCode": "+378",
    "flag": "🇸🇲",
    "flagUrl": "https://flagcdn.com/w80/sm.png",
    "flag_url": "https://flagcdn.com/w80/sm.png",
    "phoneLength": 8,
    "phoneLengths": [
      8,
      10
    ]
  },
  {
    "name": "Sao Tome and Principe",
    "code": "ST",
    "dial_code": "+239",
    "dialCode": "+239",
    "flag": "🇸🇹",
    "flagUrl": "https://flagcdn.com/w80/st.png",
    "flag_url": "https://flagcdn.com/w80/st.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Saudi Arabia",
    "code": "SA",
    "dial_code": "+966",
    "dialCode": "+966",
    "flag": "🇸🇦",
    "flagUrl": "https://flagcdn.com/w80/sa.png",
    "flag_url": "https://flagcdn.com/w80/sa.png",
    "phoneLength": 9,
    "phoneLengths": [
      9,
      10
    ]
  },
  {
    "name": "Senegal",
    "code": "SN",
    "dial_code": "+221",
    "dialCode": "+221",
    "flag": "🇸🇳",
    "flagUrl": "https://flagcdn.com/w80/sn.png",
    "flag_url": "https://flagcdn.com/w80/sn.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Serbia",
    "code": "RS",
    "dial_code": "+381",
    "dialCode": "+381",
    "flag": "🇷🇸",
    "flagUrl": "https://flagcdn.com/w80/rs.png",
    "flag_url": "https://flagcdn.com/w80/rs.png",
    "phoneLength": 9,
    "phoneLengths": [
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ]
  },
  {
    "name": "Seychelles",
    "code": "SC",
    "dial_code": "+248",
    "dialCode": "+248",
    "flag": "🇸🇨",
    "flagUrl": "https://flagcdn.com/w80/sc.png",
    "flag_url": "https://flagcdn.com/w80/sc.png",
    "phoneLength": 7,
    "phoneLengths": [
      7
    ]
  },
  {
    "name": "Sierra Leone",
    "code": "SL",
    "dial_code": "+232",
    "dialCode": "+232",
    "flag": "🇸🇱",
    "flagUrl": "https://flagcdn.com/w80/sl.png",
    "flag_url": "https://flagcdn.com/w80/sl.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Singapore",
    "code": "SG",
    "dial_code": "+65",
    "dialCode": "+65",
    "flag": "🇸🇬",
    "flagUrl": "https://flagcdn.com/w80/sg.png",
    "flag_url": "https://flagcdn.com/w80/sg.png",
    "phoneLength": 8,
    "phoneLengths": [
      8,
      10,
      11
    ]
  },
  {
    "name": "Slovakia",
    "code": "SK",
    "dial_code": "+421",
    "dialCode": "+421",
    "flag": "🇸🇰",
    "flagUrl": "https://flagcdn.com/w80/sk.png",
    "flag_url": "https://flagcdn.com/w80/sk.png",
    "phoneLength": 9,
    "phoneLengths": [
      6,
      7,
      9
    ]
  },
  {
    "name": "Slovenia",
    "code": "SI",
    "dial_code": "+386",
    "dialCode": "+386",
    "flag": "🇸🇮",
    "flagUrl": "https://flagcdn.com/w80/si.png",
    "flag_url": "https://flagcdn.com/w80/si.png",
    "phoneLength": 8,
    "phoneLengths": [
      5,
      6,
      7,
      8
    ]
  },
  {
    "name": "Solomon Islands",
    "code": "SB",
    "dial_code": "+677",
    "dialCode": "+677",
    "flag": "🇸🇧",
    "flagUrl": "https://flagcdn.com/w80/sb.png",
    "flag_url": "https://flagcdn.com/w80/sb.png",
    "phoneLength": 7,
    "phoneLengths": [
      5,
      7
    ]
  },
  {
    "name": "Somalia",
    "code": "SO",
    "dial_code": "+252",
    "dialCode": "+252",
    "flag": "🇸🇴",
    "flagUrl": "https://flagcdn.com/w80/so.png",
    "flag_url": "https://flagcdn.com/w80/so.png",
    "phoneLength": 8,
    "phoneLengths": [
      6,
      7,
      8,
      9
    ]
  },
  {
    "name": "South Africa",
    "code": "ZA",
    "dial_code": "+27",
    "dialCode": "+27",
    "flag": "🇿🇦",
    "flagUrl": "https://flagcdn.com/w80/za.png",
    "flag_url": "https://flagcdn.com/w80/za.png",
    "phoneLength": 9,
    "phoneLengths": [
      5,
      6,
      7,
      8,
      9,
      10
    ]
  },
  {
    "name": "South Georgia and the South Sandwich Islands",
    "code": "GS",
    "dial_code": "+500",
    "dialCode": "+500",
    "flag": "🇬🇸",
    "flagUrl": "https://flagcdn.com/w80/gs.png",
    "flag_url": "https://flagcdn.com/w80/gs.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "South Sudan",
    "code": "SS",
    "dial_code": "+211",
    "dialCode": "+211",
    "flag": "🇸🇸",
    "flagUrl": "https://flagcdn.com/w80/ss.png",
    "flag_url": "https://flagcdn.com/w80/ss.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Spain",
    "code": "ES",
    "dial_code": "+34",
    "dialCode": "+34",
    "flag": "🇪🇸",
    "flagUrl": "https://flagcdn.com/w80/es.png",
    "flag_url": "https://flagcdn.com/w80/es.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Sri Lanka",
    "code": "LK",
    "dial_code": "+94",
    "dialCode": "+94",
    "flag": "🇱🇰",
    "flagUrl": "https://flagcdn.com/w80/lk.png",
    "flag_url": "https://flagcdn.com/w80/lk.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Sudan",
    "code": "SD",
    "dial_code": "+249",
    "dialCode": "+249",
    "flag": "🇸🇩",
    "flagUrl": "https://flagcdn.com/w80/sd.png",
    "flag_url": "https://flagcdn.com/w80/sd.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Suriname",
    "code": "SR",
    "dial_code": "+597",
    "dialCode": "+597",
    "flag": "🇸🇷",
    "flagUrl": "https://flagcdn.com/w80/sr.png",
    "flag_url": "https://flagcdn.com/w80/sr.png",
    "phoneLength": 7,
    "phoneLengths": [
      6,
      7
    ]
  },
  {
    "name": "Svalbard and Jan Mayen",
    "code": "SJ",
    "dial_code": "+47",
    "dialCode": "+47",
    "flag": "🇸🇯",
    "flagUrl": "https://flagcdn.com/w80/sj.png",
    "flag_url": "https://flagcdn.com/w80/sj.png",
    "phoneLength": 8,
    "phoneLengths": [
      5,
      8
    ]
  },
  {
    "name": "Sweden",
    "code": "SE",
    "dial_code": "+46",
    "dialCode": "+46",
    "flag": "🇸🇪",
    "flagUrl": "https://flagcdn.com/w80/se.png",
    "flag_url": "https://flagcdn.com/w80/se.png",
    "phoneLength": 9,
    "phoneLengths": [
      6,
      7,
      8,
      9,
      10,
      12
    ]
  },
  {
    "name": "Switzerland",
    "code": "CH",
    "dial_code": "+41",
    "dialCode": "+41",
    "flag": "🇨🇭",
    "flagUrl": "https://flagcdn.com/w80/ch.png",
    "flag_url": "https://flagcdn.com/w80/ch.png",
    "phoneLength": 9,
    "phoneLengths": [
      9,
      12
    ]
  },
  {
    "name": "Syrian Arab Republic",
    "code": "SY",
    "dial_code": "+963",
    "dialCode": "+963",
    "flag": "🇸🇾",
    "flagUrl": "https://flagcdn.com/w80/sy.png",
    "flag_url": "https://flagcdn.com/w80/sy.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9
    ]
  },
  {
    "name": "Taiwan",
    "code": "TW",
    "dial_code": "+886",
    "dialCode": "+886",
    "flag": "🇹🇼",
    "flagUrl": "https://flagcdn.com/w80/tw.png",
    "flag_url": "https://flagcdn.com/w80/tw.png",
    "phoneLength": 9,
    "phoneLengths": [
      7,
      8,
      9,
      10,
      11
    ]
  },
  {
    "name": "Tajikistan",
    "code": "TJ",
    "dial_code": "+992",
    "dialCode": "+992",
    "flag": "🇹🇯",
    "flagUrl": "https://flagcdn.com/w80/tj.png",
    "flag_url": "https://flagcdn.com/w80/tj.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Tanzania, United Republic of Tanzania",
    "code": "TZ",
    "dial_code": "+255",
    "dialCode": "+255",
    "flag": "🇹🇿",
    "flagUrl": "https://flagcdn.com/w80/tz.png",
    "flag_url": "https://flagcdn.com/w80/tz.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Thailand",
    "code": "TH",
    "dial_code": "+66",
    "dialCode": "+66",
    "flag": "🇹🇭",
    "flagUrl": "https://flagcdn.com/w80/th.png",
    "flag_url": "https://flagcdn.com/w80/th.png",
    "phoneLength": 9,
    "phoneLengths": [
      8,
      9,
      10,
      13
    ]
  },
  {
    "name": "Timor-Leste",
    "code": "TL",
    "dial_code": "+670",
    "dialCode": "+670",
    "flag": "🇹🇱",
    "flagUrl": "https://flagcdn.com/w80/tl.png",
    "flag_url": "https://flagcdn.com/w80/tl.png",
    "phoneLength": 8,
    "phoneLengths": [
      7,
      8
    ]
  },
  {
    "name": "Togo",
    "code": "TG",
    "dial_code": "+228",
    "dialCode": "+228",
    "flag": "🇹🇬",
    "flagUrl": "https://flagcdn.com/w80/tg.png",
    "flag_url": "https://flagcdn.com/w80/tg.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Tokelau",
    "code": "TK",
    "dial_code": "+690",
    "dialCode": "+690",
    "flag": "🇹🇰",
    "flagUrl": "https://flagcdn.com/w80/tk.png",
    "flag_url": "https://flagcdn.com/w80/tk.png",
    "phoneLength": 4,
    "phoneLengths": [
      4,
      5,
      6,
      7
    ]
  },
  {
    "name": "Tonga",
    "code": "TO",
    "dial_code": "+676",
    "dialCode": "+676",
    "flag": "🇹🇴",
    "flagUrl": "https://flagcdn.com/w80/to.png",
    "flag_url": "https://flagcdn.com/w80/to.png",
    "phoneLength": 7,
    "phoneLengths": [
      5,
      7
    ]
  },
  {
    "name": "Trinidad and Tobago",
    "code": "TT",
    "dial_code": "+1868",
    "dialCode": "+1868",
    "flag": "🇹🇹",
    "flagUrl": "https://flagcdn.com/w80/tt.png",
    "flag_url": "https://flagcdn.com/w80/tt.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Tunisia",
    "code": "TN",
    "dial_code": "+216",
    "dialCode": "+216",
    "flag": "🇹🇳",
    "flagUrl": "https://flagcdn.com/w80/tn.png",
    "flag_url": "https://flagcdn.com/w80/tn.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Turkey",
    "code": "TR",
    "dial_code": "+90",
    "dialCode": "+90",
    "flag": "🇹🇷",
    "flagUrl": "https://flagcdn.com/w80/tr.png",
    "flag_url": "https://flagcdn.com/w80/tr.png",
    "phoneLength": 10,
    "phoneLengths": [
      7,
      10,
      12,
      13
    ]
  },
  {
    "name": "Turkmenistan",
    "code": "TM",
    "dial_code": "+993",
    "dialCode": "+993",
    "flag": "🇹🇲",
    "flagUrl": "https://flagcdn.com/w80/tm.png",
    "flag_url": "https://flagcdn.com/w80/tm.png",
    "phoneLength": 8,
    "phoneLengths": [
      8
    ]
  },
  {
    "name": "Turks and Caicos Islands",
    "code": "TC",
    "dial_code": "+1649",
    "dialCode": "+1649",
    "flag": "🇹🇨",
    "flagUrl": "https://flagcdn.com/w80/tc.png",
    "flag_url": "https://flagcdn.com/w80/tc.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Tuvalu",
    "code": "TV",
    "dial_code": "+688",
    "dialCode": "+688",
    "flag": "🇹🇻",
    "flagUrl": "https://flagcdn.com/w80/tv.png",
    "flag_url": "https://flagcdn.com/w80/tv.png",
    "phoneLength": 6,
    "phoneLengths": [
      5,
      6,
      7
    ]
  },
  {
    "name": "Uganda",
    "code": "UG",
    "dial_code": "+256",
    "dialCode": "+256",
    "flag": "🇺🇬",
    "flagUrl": "https://flagcdn.com/w80/ug.png",
    "flag_url": "https://flagcdn.com/w80/ug.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Ukraine",
    "code": "UA",
    "dial_code": "+380",
    "dialCode": "+380",
    "flag": "🇺🇦",
    "flagUrl": "https://flagcdn.com/w80/ua.png",
    "flag_url": "https://flagcdn.com/w80/ua.png",
    "phoneLength": 9,
    "phoneLengths": [
      9,
      10
    ]
  },
  {
    "name": "United Arab Emirates",
    "code": "AE",
    "dial_code": "+971",
    "dialCode": "+971",
    "flag": "🇦🇪",
    "flagUrl": "https://flagcdn.com/w80/ae.png",
    "flag_url": "https://flagcdn.com/w80/ae.png",
    "phoneLength": 9,
    "phoneLengths": [
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ]
  },
  {
    "name": "United Kingdom",
    "code": "GB",
    "dial_code": "+44",
    "dialCode": "+44",
    "flag": "🇬🇧",
    "flagUrl": "https://flagcdn.com/w80/gb.png",
    "flag_url": "https://flagcdn.com/w80/gb.png",
    "phoneLength": 10,
    "phoneLengths": [
      7,
      9,
      10
    ]
  },
  {
    "name": "United States",
    "code": "US",
    "dial_code": "+1",
    "dialCode": "+1",
    "flag": "🇺🇸",
    "flagUrl": "https://flagcdn.com/w80/us.png",
    "flag_url": "https://flagcdn.com/w80/us.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Uruguay",
    "code": "UY",
    "dial_code": "+598",
    "dialCode": "+598",
    "flag": "🇺🇾",
    "flagUrl": "https://flagcdn.com/w80/uy.png",
    "flag_url": "https://flagcdn.com/w80/uy.png",
    "phoneLength": 8,
    "phoneLengths": [
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13
    ]
  },
  {
    "name": "Uzbekistan",
    "code": "UZ",
    "dial_code": "+998",
    "dialCode": "+998",
    "flag": "🇺🇿",
    "flagUrl": "https://flagcdn.com/w80/uz.png",
    "flag_url": "https://flagcdn.com/w80/uz.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Vanuatu",
    "code": "VU",
    "dial_code": "+678",
    "dialCode": "+678",
    "flag": "🇻🇺",
    "flagUrl": "https://flagcdn.com/w80/vu.png",
    "flag_url": "https://flagcdn.com/w80/vu.png",
    "phoneLength": 7,
    "phoneLengths": [
      5,
      7
    ]
  },
  {
    "name": "Venezuela, Bolivarian Republic of Venezuela",
    "code": "VE",
    "dial_code": "+58",
    "dialCode": "+58",
    "flag": "🇻🇪",
    "flagUrl": "https://flagcdn.com/w80/ve.png",
    "flag_url": "https://flagcdn.com/w80/ve.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Vietnam",
    "code": "VN",
    "dial_code": "+84",
    "dialCode": "+84",
    "flag": "🇻🇳",
    "flagUrl": "https://flagcdn.com/w80/vn.png",
    "flag_url": "https://flagcdn.com/w80/vn.png",
    "phoneLength": 9,
    "phoneLengths": [
      7,
      8,
      9,
      10
    ]
  },
  {
    "name": "Virgin Islands, British",
    "code": "VG",
    "dial_code": "+1284",
    "dialCode": "+1284",
    "flag": "🇻🇬",
    "flagUrl": "https://flagcdn.com/w80/vg.png",
    "flag_url": "https://flagcdn.com/w80/vg.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Virgin Islands, U.S.",
    "code": "VI",
    "dial_code": "+1340",
    "dialCode": "+1340",
    "flag": "🇻🇮",
    "flagUrl": "https://flagcdn.com/w80/vi.png",
    "flag_url": "https://flagcdn.com/w80/vi.png",
    "phoneLength": 10,
    "phoneLengths": [
      10
    ]
  },
  {
    "name": "Wallis and Futuna",
    "code": "WF",
    "dial_code": "+681",
    "dialCode": "+681",
    "flag": "🇼🇫",
    "flagUrl": "https://flagcdn.com/w80/wf.png",
    "flag_url": "https://flagcdn.com/w80/wf.png",
    "phoneLength": 6,
    "phoneLengths": [
      6,
      9
    ]
  },
  {
    "name": "Yemen",
    "code": "YE",
    "dial_code": "+967",
    "dialCode": "+967",
    "flag": "🇾🇪",
    "flagUrl": "https://flagcdn.com/w80/ye.png",
    "flag_url": "https://flagcdn.com/w80/ye.png",
    "phoneLength": 9,
    "phoneLengths": [
      7,
      8,
      9
    ]
  },
  {
    "name": "Zambia",
    "code": "ZM",
    "dial_code": "+260",
    "dialCode": "+260",
    "flag": "🇿🇲",
    "flagUrl": "https://flagcdn.com/w80/zm.png",
    "flag_url": "https://flagcdn.com/w80/zm.png",
    "phoneLength": 9,
    "phoneLengths": [
      9
    ]
  },
  {
    "name": "Zimbabwe",
    "code": "ZW",
    "dial_code": "+263",
    "dialCode": "+263",
    "flag": "🇿🇼",
    "flagUrl": "https://flagcdn.com/w80/zw.png",
    "flag_url": "https://flagcdn.com/w80/zw.png",
    "phoneLength": 9,
    "phoneLengths": [
      5,
      6,
      7,
      8,
      9,
      10
    ]
  }
];


module.exports = {
  PORT,
  JWT_SECRET,
  ADMIN_FETCH_TTL,
  DB_FILE,
  defaultSubCategoryPresets,
  defaultSubCatServicePresets,
  DEFAULT_CATEGORIES,
  CATEGORIES_DATA,
  AMC_SUPPORTED_CATEGORIES,
  SERVICES_DATA,
  STATIC_BOOKING_SLOTS,
  BANNERS_DATA,
  countriesList
};
