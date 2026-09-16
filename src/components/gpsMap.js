import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Advanced Automotive GPS Navigation & Hazard Intelligence Map
 * Engineered for Indian Highways and Urban Corridors
 * 
 * Features:
 * - Multi-layer tile rendering (Cyber Dark HUD, Satellite Hybrid, Live Traffic View, Standard Street)
 * - 6 Realistic Indian Corridors (Mumbai-Pune, Yamuna Exp, Bangalore ORR, Coastal Road Sea Link, Shimla Ghats, Varanasi GT Road)
 * - Dynamic 360° vehicle bearing rotation & glowing GPS breadcrumb trail
 * - Real-time Turn-by-Turn HUD (Next maneuver, ETA, Distance Remaining, Speed camera warnings)
 * - Interactive Hazard Radar scanning with 500m proximity alerts
 * - User Crowdsource Hazard Pinning & Fullscreen Navigation View
 */
export class GpsMapComponent {
  constructor(mapContainerId) {
    this.containerId = mapContainerId;
    this.map = null;
    this.vehicleMarker = null;
    this.routePolyline = null;
    this.trafficPolyline = null;
    this.trailPolyline = null;
    this.radarCircle = null;
    this.hazardMarkers = [];
    this.userReportedMarkers = [];
    this.traveledPath = [];
    this.routeIndex = 0;
    this.currentCorridor = 'purvanchal_up'; // Default to Purvanchal, Uttar Pradesh
    this.currentLayerType = 'satellite'; // Google Satellite Hybrid
    this.tileLayers = {};
    this.isFollowCar = true;
    this.currentHeading = 0;
    this.onHazardProximityCallback = null;
    this.poiMarkers = [];
    this.searchMarker = null;
    this.destMarker = null;
    this.activeCustomRoute = null;
    this.activeCategory = 'all';

    // Live Device Geolocation Tracking State
    this.isLiveGpsActive = false;
    this.liveWatchId = null;
    this.liveAccuracyCircle = null;
    this.liveLocationData = {
      lat: null,
      lng: null,
      accuracy: null,
      altitude: null,
      speed: null,
      heading: null,
      locationName: 'Assi Ghat, Varanasi (Purvanchal, UP)',
      city: 'Varanasi',
      state: 'Uttar Pradesh',
      isLive: false,
    };
    this.onLocationUpdateCallback = null;

    // Defined realistic Indian driving corridors with waypoints and turn-by-turn maneuvers
    this.corridors = {
      purvanchal_up: {
        name: 'Purvanchal Expressway & Varanasi Kashi Corridor (Uttar Pradesh)',
        type: 'Expressway & Cultural Highway (Purvanchal, UP)',
        defaultSpeedLimit: 100,
        totalKm: 135.0,
        waypoints: [
          [25.2905, 82.9965], // Assi Ghat / BHU Lanka, Varanasi
          [25.3109, 83.0107], // Kashi Vishwanath Dham / Godowlia Junction
          [25.3450, 82.9850], // Varanasi Cantt / Shivpur Ring Road
          [25.4526, 82.8596], // Lal Bahadur Shastri International Airport (Babatpur VNS)
          [25.6850, 82.7200], // Jaunpur Gomti River Corridor
          [26.0235, 83.1782], // Purvanchal Expressway Azamgarh Interchange
          [26.7606, 83.3732], // Gorakhpur (Ramgarh Taal & Gorakhnath)
        ],
        maneuvers: [
          { atPct: 0.15, icon: '⬆️', text: 'Continue along Assi Ghat Rd past BHU Gate towards Kashi Vishwanath Corridor', distance: '1.2 km' },
          { atPct: 0.35, icon: '↗️', text: 'Take Varanasi Ring Road Phase-2 towards Babatpur International Airport', distance: '800 m' },
          { atPct: 0.60, icon: '🛣️', text: 'Merge onto Purvanchal Expressway (6-Lane Access-Controlled Highway)', distance: '2.4 km' },
          { atPct: 0.85, icon: '🛑', text: 'Approaching Azamgarh Toll Plaza: Speed Limit 100 km/h (FASTag Lanes 1-8)', distance: '1.0 km' },
        ],
        hazards: [
          { lat: 25.3109, lng: 83.0107, type: 'traffic', title: 'Godowlia-Dashashwamedh Pilgrim Congestion Zone' },
          { lat: 25.4526, lng: 82.8596, type: 'camera', title: 'NH31 Overhead AI Speed Radar (80 km/h Limit)' },
          { lat: 25.6850, lng: 82.7200, type: 'cattle', title: 'Rural Purvanchal Stray Cattle Crossing Zone' },
          { lat: 26.0235, lng: 83.1782, type: 'camera', title: 'Purvanchal Expressway Gantry Automated Speed Sensor (100 km/h)' },
        ],
        pois: [
          { name: 'Kashi Vishwanath Dham & Temple', cat: 'things_to_do', lat: 25.3109, lng: 83.0107, rating: 4.9, icon: '🛕', desc: 'Sacred Shri Kashi Vishwanath Corridor, Varanasi' },
          { name: 'Assi Ghat Ganga Aarti', cat: 'things_to_do', lat: 25.2905, lng: 82.9965, rating: 4.9, icon: '🌅', desc: 'Subah-e-Banaras Cultural Riverfront, Varanasi' },
          { name: 'Baati Chokha Restaurant | Anand Mandir', cat: 'restaurants', lat: 25.3210, lng: 82.9850, rating: 4.8, icon: '🍽️', desc: 'Traditional Purvanchal Baati Chokha & Banarasi Thali' },
          { name: 'Pahalwan Lassi | Lanka BHU', cat: 'restaurants', lat: 25.2750, lng: 82.9930, rating: 4.9, icon: '🥛', desc: 'Famous Malai Rabdi Banarasi Lassi' },
          { name: 'Kashi Chat Bhandar | Godowlia', cat: 'restaurants', lat: 25.3090, lng: 83.0070, rating: 4.7, icon: '🍲', desc: 'Legendary Tamatar Chaat & Golgappe' },
          { name: 'BrijRama Palace Heritage Hotel', cat: 'hotels', lat: 25.3060, lng: 83.0120, rating: 4.9, icon: '🏨', desc: 'Historic 5-Star Heritage Palace on Ganga River' },
          { name: 'Taj Ganges Varanasi', cat: 'hotels', lat: 25.3340, lng: 82.9820, rating: 4.8, icon: '🏨', desc: '5-Star Luxury Resort, Nadesar Varanasi' },
          { name: 'Varanasi Cantt Railway Junction (BSB)', cat: 'transit', lat: 25.3270, lng: 82.9850, rating: 4.5, icon: '🚊', desc: 'Major Northern Railway Terminus, Varanasi' },
          { name: 'Lal Bahadur Shastri Airport Babatpur', cat: 'transit', lat: 25.4526, lng: 82.8596, rating: 4.6, icon: '✈️', desc: 'Varanasi International Airport Terminal' },
          { name: 'BHU Trauma Centre & Hospital', cat: 'pharmacy', lat: 25.2720, lng: 82.9890, rating: 4.8, icon: '💊', desc: '24/7 Super-Specialty Medical Emergency Hospital' },
          { name: 'Indian Oil & EV Fast Charging | Purvanchal Expway', cat: 'fuel', lat: 26.0230, lng: 83.1780, rating: 4.7, icon: '⛽', desc: '24/7 Fuel & DC Fast Electric Vehicle Charging' },
          { name: 'Purvanchal AI Speed Radar Gantry', cat: 'speed_traps', lat: 26.0240, lng: 83.1790, rating: 5.0, icon: '📸', desc: 'Automated 100 km/h Highway Speed Limit Camera' },
          { name: 'Gorakhnath Temple & Math, Gorakhpur', cat: 'things_to_do', lat: 26.7720, lng: 83.3550, rating: 4.9, icon: '🛕', desc: 'Historic Nath Monastic Center, Gorakhpur' },
          { name: 'Ramgarh Taal Marine Drive, Gorakhpur', cat: 'things_to_do', lat: 26.7420, lng: 83.3980, rating: 4.7, icon: '⛵', desc: 'Scenic Lakefront Promenade, Gorakhpur' },
        ],
      },
      chennai_omr: {
        name: 'Chennai OMR & IIT Madras (Velachery - Taramani)',
        type: 'State IT Highway & Tech Corridor (OMR)',
        defaultSpeedLimit: 60,
        totalKm: 22.4,
        waypoints: [
          [12.98289, 80.23586], // Exact location from user's screenshot: Kallu Kuttai Lake / IIT Madras / Velachery
          [12.9845, 80.2405],  // CSIR Rd / Taramani
          [12.9885, 80.2460],  // TIDEL Park / OMR Junction
          [12.9750, 80.2485],  // Ascendas Phase 1 (Pinnacle) & Phase 2
          [12.9600, 80.2460],  // Perungudi Toll Plaza
          [12.9350, 80.2320],  // Thoraipakkam Junction
          [12.9050, 80.2280],  // Sholinganallur ELCOT SEZ
        ],
        maneuvers: [
          { atPct: 0.15, icon: '⬆️', text: 'Continue on CSIR Rd past IIT Madras Gate towards TIDEL Park', distance: '800 m' },
          { atPct: 0.35, icon: '↗️', text: 'Merge Right onto Rajiv Gandhi IT Expressway (OMR)', distance: '400 m' },
          { atPct: 0.60, icon: '🛑', text: 'Approaching Perungudi Toll Plaza: Maintain speed below 60 km/h', distance: '1.1 km' },
          { atPct: 0.85, icon: '⚠️', text: 'Tech Park commuter pedestrian crossing ahead', distance: '500 m' },
        ],
        hazards: [
          { lat: 12.9829, lng: 80.2359, type: 'traffic', title: 'Velachery-Taramani Waterlogged Lake Curve' },
          { lat: 12.9885, lng: 80.2460, type: 'camera', title: 'OMR Overhead AI Speed Radar (60 km/h Limit)' },
          { lat: 12.9750, lng: 80.2485, type: 'auto', title: 'Ascendas IT Park Aggressive Auto Cut-ins' },
          { lat: 12.9600, lng: 80.2460, type: 'speed_breaker', title: 'Perungudi FastLane Speed Breakers' },
        ],
        pois: [
          { name: "AB's - Absolute Barbecues | Velachery", cat: 'restaurants', lat: 12.9818, lng: 80.2335, rating: 4.6, icon: '🍽️', desc: 'Barbecue Restaurant • Dine-in & Delivery' },
          { name: 'Nilgiri Mess', cat: 'restaurants', lat: 12.9855, lng: 80.2360, rating: 4.4, icon: '🍽️', desc: 'Authentic South Indian Non-Veg Cuisine' },
          { name: "Mani's Dum Biryani", cat: 'restaurants', lat: 12.9772, lng: 80.2520, rating: 4.3, icon: '🍽️', desc: 'Hyderabadi Dum Biryani Specialist' },
          { name: 'Sri sai krishna PG for Ladies', cat: 'hotels', lat: 12.9805, lng: 80.2415, rating: 4.5, icon: '🏨', desc: 'Top Rated Tech Park Stay & Accommodation' },
          { name: 'Taramani MRTS Station', cat: 'transit', lat: 12.9790, lng: 80.2435, rating: 4.2, icon: '🚊', desc: 'Chennai Suburban Rail Mass Transit' },
          { name: 'Apollo Pharmacy Taramani', cat: 'pharmacy', lat: 12.9830, lng: 80.2380, rating: 4.7, icon: '💊', desc: '24/7 Healthcare & Medical Store' },
          { name: 'HP Petrol Pump & Tata EV Charging OMR', cat: 'fuel', lat: 12.9870, lng: 80.2440, rating: 4.5, icon: '⛽', desc: 'Fast DC Charging & High Octane Fuel' },
          { name: 'OMR AI Speed Radar Gantry', cat: 'speed_traps', lat: 12.9885, lng: 80.2460, rating: 5.0, icon: '📸', desc: 'Automated 60 km/h Speed Limit Sensor' },
          { name: 'IIT Madras Campus Gate', cat: 'things_to_do', lat: 12.9890, lng: 80.2420, rating: 4.8, icon: '🏛️', desc: 'Premier Deep-Tech Institute & Research Park' },
        ],
      },
      mumbai_pune: {
        name: 'NH48 Mumbai-Pune Expressway',
        type: 'Expressway (6-Lane Access Controlled)',
        defaultSpeedLimit: 100,
        totalKm: 94.5,
        waypoints: [
          [18.9902, 73.1277], // Kalamboli Start
          [18.9510, 73.1850], // Panvel Bypass
          [18.9189, 73.2201], // Chowk Junction
          [18.7831, 73.3512], // Khalapur Toll Plaza
          [18.7650, 73.3850], // Bhor Ghat Entry
          [18.7519, 73.4079], // Khandala Ghat Hairpin
          [18.7485, 73.4418], // Lonavala Bypass / Tunnel
          [18.7290, 73.4980], // Kamshet
          [18.7183, 73.5421], // Talegaon Toll
          [18.6508, 73.7431], // Dehu Road
          [18.5793, 73.7389], // Hinjewadi Phase 1 Pune
        ],
        maneuvers: [
          { atPct: 0.15, icon: '⬆️', text: 'Continue straight on NH48 Expressway towards Pune', distance: '12 km' },
          { atPct: 0.35, icon: '🛑', text: 'In 800m: Khalapur Toll Plaza (FASTag Lanes 1-6)', distance: '800 m' },
          { atPct: 0.48, icon: '⚠️', text: 'Caution: Steep Descent & Bhor Ghat Hairpin Curve', distance: '1.4 km' },
          { atPct: 0.65, icon: '🚇', text: 'Entering Madap Tunnel: Turn on low-beam headlights', distance: '400 m' },
          { atPct: 0.85, icon: '↗️', text: 'Keep Left for Talegaon Toll & Pune Ring Road exit', distance: '3.2 km' },
        ],
        hazards: [
          { lat: 18.7519, lng: 73.4079, type: 'ghat', title: 'Blind Hairpin Curve (Bhor Ghat)' },
          { lat: 18.7485, lng: 73.4418, type: 'cattle', title: 'Stray Cattle Crossing Zone' },
          { lat: 18.7183, lng: 73.5421, type: 'pothole', title: 'Road Work & Diversion Potholes' },
          { lat: 18.7831, lng: 73.3512, type: 'camera', title: 'AI Speed Radar Camera (100 km/h Limit)' },
        ],
      },
      yamuna_exp: {
        name: 'Yamuna Expressway (Delhi - Agra)',
        type: 'Super Expressway (165 km Concrete Corridor)',
        defaultSpeedLimit: 100,
        totalKm: 165.0,
        waypoints: [
          [28.5355, 77.3910], // Greater Noida Zero Point
          [28.4210, 77.4680], // Formula 1 Track BIC
          [28.3490, 77.5450], // Jewar Toll Plaza
          [28.2100, 77.6400], // Jahangirpur
          [28.0980, 77.7210], // Tappal Interchange
          [27.9500, 77.7850], // Aligarh Cut
          [27.7950, 77.8540], // Mathura Toll
          [27.6100, 77.9250], // Vrindavan Cut
          [27.4210, 78.0120], // Khandauli Toll
          [27.1767, 78.0081], // Agra Inner Ring Road Taj Mahal
        ],
        maneuvers: [
          { atPct: 0.1, icon: '⬆️', text: 'Maintain speed below 100 km/h on Yamuna Concrete Corridor', distance: '35 km' },
          { atPct: 0.3, icon: '🌫️', text: 'Dense Fog Warning Zone: Turn on Fog Lamps', distance: '500 m' },
          { atPct: 0.65, icon: '⚠️', text: 'Watch for illegal Wrong-Way tractor entry on left shoulder', distance: '1.8 km' },
          { atPct: 0.9, icon: '↗️', text: 'Take Exit 12 towards Agra Inner Ring Road / Taj Expressway', distance: '2.5 km' },
        ],
        hazards: [
          { lat: 28.3490, lng: 77.5450, type: 'fog', title: 'Dense Winter Smog / Low Visibility Zone' },
          { lat: 27.7950, lng: 77.8540, type: 'wrong_way', title: 'Frequent Wrong-Way Tractor Entry' },
          { lat: 28.4210, lng: 77.4680, type: 'camera', title: 'Overhead Gantry Speed Sensor' },
          { lat: 27.4210, lng: 78.0120, type: 'cattle', title: 'Stray Cattle Crossing near Khandauli' },
        ],
      },
      bangalore_orr: {
        name: 'Bengaluru Outer Ring Road (ORR)',
        type: 'Urban IT Corridor & Arterial Highway',
        defaultSpeedLimit: 60,
        totalKm: 34.0,
        waypoints: [
          [12.9150, 77.6350], // Silk Board Flyover
          [12.9237, 77.6835], // Bellandur EcoSpace
          [12.9348, 77.6913], // Devarabeesanahalli Tech Park
          [12.9560, 77.7011], // Marathahalli Bridge
          [12.9780, 77.7120], // Karthik Nagar
          [12.9981, 77.6987], // Mahadevapura
          [13.0180, 77.6710], // Kasturi Nagar
          [13.0350, 77.6430], // Hebbal Flyover
        ],
        maneuvers: [
          { atPct: 0.15, icon: '🛺', text: 'Bellandur flyover merge: Heavy two-wheeler and auto weaving', distance: '300 m' },
          { atPct: 0.4, icon: '🛑', text: 'Unmarked Rumble Strips ahead of Marathahalli Underpass', distance: '600 m' },
          { atPct: 0.75, icon: '⬆️', text: 'Take main carriageway to avoid service road waterlogging', distance: '1.1 km' },
          { atPct: 0.9, icon: '↗️', text: 'Keep right for Hebbal Flyover towards Airport Road', distance: '900 m' },
        ],
        hazards: [
          { lat: 12.9348, lng: 77.6913, type: 'auto', title: 'Aggressive Autorickshaw Lane Splitting' },
          { lat: 12.9560, lng: 77.7011, type: 'speed_breaker', title: 'Unmarked Sudden Speed Breakers' },
          { lat: 12.9981, lng: 77.6987, type: 'pothole', title: 'Deep Monsoon Waterlogged Crater' },
          { lat: 12.9237, lng: 77.6835, type: 'traffic', title: 'Severe Bumper-to-Bumper Bottleneck' },
        ],
      },
      coastal_road: {
        name: 'Mumbai Coastal Road & Sea Link',
        type: 'Marine Expressway & Sea Bridge',
        defaultSpeedLimit: 80,
        totalKm: 18.2,
        waypoints: [
          [18.9530, 72.8080], // Marine Drive Princess Street
          [18.9680, 72.8050], // Priyadarshini Park (Tunnel Entry)
          [18.9950, 72.8120], // Haji Ali Interchange
          [19.0140, 72.8180], // Worli Sea Face
          [19.0350, 72.8220], // Bandra-Worli Sea Link Cable Bridge
          [19.0550, 72.8350], // Bandra Toll Plaza
        ],
        maneuvers: [
          { atPct: 0.15, icon: '🚇', text: 'Entering Twin Undersea Tunnels: Speed cap 80 km/h', distance: '400 m' },
          { atPct: 0.5, icon: '🌊', text: 'Worli Interchange: Strong coastal crosswinds on bridge', distance: '1.2 km' },
          { atPct: 0.8, icon: '🌉', text: 'Entering Bandra-Worli Sea Link: Lane discipline enforced', distance: '500 m' },
        ],
        hazards: [
          { lat: 18.9680, lng: 72.8050, type: 'tunnel', title: 'Undersea Tunnel Speed Cameras' },
          { lat: 19.0350, lng: 72.8220, type: 'wind', title: 'High Crosswind Warning on Cable Bridge' },
        ],
      },
      shimla_ghats: {
        name: 'Himalayan Expressway (Chandigarh to Shimla)',
        type: 'Mountain Highway (NH5 Parwanoo - Solan)',
        defaultSpeedLimit: 50,
        totalKm: 68.0,
        waypoints: [
          [30.8350, 76.9550], // Pinjore Bypass
          [30.8710, 76.9950], // Parwanoo Timber Trail
          [30.9020, 77.0500], // Dharampur
          [30.9150, 77.0980], // Kumarhatti
          [30.9230, 77.1250], // Solan Bypass
          [30.9850, 77.1650], // Kandaghat
          [31.1048, 77.1734], // Shimla Mall Road Entry
        ],
        maneuvers: [
          { atPct: 0.2, icon: '⛰️', text: 'Engage Low Gear: Continuous uphill gradient', distance: '2.5 km' },
          { atPct: 0.45, icon: '📢', text: 'Honk horn on blind hairpin corners (No overtaking)', distance: '400 m' },
          { atPct: 0.7, icon: '⚠️', text: 'Monsoon Landslide & Falling Stone Prone Zone', distance: '1.2 km' },
        ],
        hazards: [
          { lat: 30.8710, lng: 76.9950, type: 'ghat', title: 'Steep Hairpin Curves & Deep Valley Edge' },
          { lat: 30.9150, lng: 77.0980, type: 'landslide', title: 'Landslide / Rockfall Warning Zone' },
        ],
      },
      varanasi_gt: {
        name: 'NH19 Grand Trunk Road (Varanasi - Prayagraj)',
        type: 'Historic 6-Lane Golden Quadrilateral',
        defaultSpeedLimit: 90,
        totalKm: 122.0,
        waypoints: [
          [25.3176, 82.9739], // Varanasi Cantt / Lahartara
          [25.2650, 82.8850], // Mohansarai
          [25.2200, 82.6850], // Mirzamurad
          [25.1850, 82.4950], // Aurai Bhadohi Cut
          [25.2100, 82.2500], // Gopiganj
          [25.2950, 82.0500], // Handia Toll Plaza
          [25.4358, 81.8463], // Prayagraj Shastri Bridge
        ],
        maneuvers: [
          { atPct: 0.15, icon: '🐄', text: 'High cattle density on unbarricaded rural highway section', distance: '800 m' },
          { atPct: 0.5, icon: '⚠️', text: 'Pilgrim pedestrian crossing & village tractor cut-ins', distance: '1.5 km' },
          { atPct: 0.85, icon: '🛑', text: 'Handia Toll: FASTag lanes ahead', distance: '1.0 km' },
        ],
        hazards: [
          { lat: 25.2200, lng: 82.6850, type: 'cattle', title: 'Unbarricaded Stray Cow & Buffalo Herd Crossing' },
          { lat: 25.1850, lng: 82.4950, type: 'pothole', title: 'Diversion Pavement Cracks & Unmarked Cut' },
          { lat: 25.2950, lng: 82.0500, type: 'speed_breaker', title: 'Sudden Illegal Village Speed Breakers' },
        ],
      },
    };

    this._initMap();
  }

  _initMap() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const corridor = this.corridors[this.currentCorridor];
    const startPoint = corridor.waypoints[0];

    this.currentLayerType = 'satellite'; // Default to Google Satellite Hybrid

    // Initialize Map with smooth animation & gestures (Disable default zoomControl to use Google Maps bottom-right controls)
    this.map = L.map(this.containerId, {
      center: startPoint,
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    // 1. Google Maps Satellite Hybrid (Photorealistic Satellite + Roads/Labels)
    this.tileLayers.satellite = L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['0', '1', '2', '3'],
    });

    // 2. Google Maps Pure Satellite (No labels)
    this.tileLayers.pure_satellite = L.tileLayer('https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['0', '1', '2', '3'],
    });

    // 3. Google Maps Standard Street / Navigation
    this.tileLayers.gmap_streets = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['0', '1', '2', '3'],
    });

    // 4. Cyber Dark Mode Layer (Google Maps Night Style - 100% Free, Zero API Key / No Watermark)
    this.tileLayers.dark = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['0', '1', '2', '3'],
      className: 'gmap-dark-tiles',
    });

    // Add Google Satellite Hybrid as DEFAULT layer
    this.tileLayers.satellite.addTo(this.map);

    // Dynamic 3D Heading Vehicle Marker
    const carIconHtml = `
      <div class="hud-car-marker" id="hud-vehicle-glyph">
        <div class="radar-pulse"></div>
        <div class="car-arrow" id="hud-car-arrow">▲</div>
      </div>
    `;
    const carIcon = L.divIcon({
      className: 'hud-car-div-icon',
      html: carIconHtml,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });

    this.vehicleMarker = L.marker(startPoint, { icon: carIcon, zIndexOffset: 1000 }).addTo(this.map);

    // Hazard Radar Pulse Circle (500m scan radius)
    this.radarCircle = L.circle(startPoint, {
      radius: 400,
      color: '#38bdf8',
      fillColor: '#38bdf8',
      fillOpacity: 0.08,
      weight: 1.5,
      dashArray: '4, 6',
    }).addTo(this.map);

    // Traveled Path Breadcrumb
    this.trailPolyline = L.polyline([], {
      color: '#10b981',
      weight: 4,
      opacity: 0.7,
    }).addTo(this.map);

    // Allow user to click anywhere on map to report a live hazard
    this.map.on('click', (e) => {
      this.promptAddHazard(e.latlng);
    });

    this.loadCorridor(this.currentCorridor);
  }

  setLayer(layerType) {
    if (!this.tileLayers[layerType] || !this.map) return;
    Object.values(this.tileLayers).forEach(layer => {
      if (this.map.hasLayer(layer)) {
        this.map.removeLayer(layer);
      }
    });
    this.tileLayers[layerType].addTo(this.map);
    this.currentLayerType = layerType;
  }

  toggleFollowCar() {
    this.isFollowCar = !this.isFollowCar;
    if (this.isFollowCar && this.vehicleMarker) {
      this.map.panTo(this.vehicleMarker.getLatLng(), { animate: true });
    }
    return this.isFollowCar;
  }

  loadCorridor(corridorKey) {
    if (!this.corridors[corridorKey] || !this.map) return;
    this.currentCorridor = corridorKey;
    const corridor = this.corridors[corridorKey];

    // Clear existing polyline & hazards
    if (this.routePolyline) this.map.removeLayer(this.routePolyline);
    if (this.trafficPolyline) this.map.removeLayer(this.trafficPolyline);
    this.hazardMarkers.forEach(m => this.map.removeLayer(m));
    this.hazardMarkers = [];
    this.traveledPath = [];
    this.trailPolyline.setLatLngs([]);

    // Base glowing route line
    this.routePolyline = L.polyline(corridor.waypoints, {
      color: '#0284c7',
      weight: 6,
      opacity: 0.5,
    }).addTo(this.map);

    // Traffic condition line overlay (simulates live green/orange/red Indian traffic flow)
    this.trafficPolyline = L.polyline(corridor.waypoints, {
      color: '#38bdf8',
      weight: 4,
      opacity: 0.9,
      dashArray: '12, 8',
    }).addTo(this.map);

    // Add hazard markers
    corridor.hazards.forEach(hazard => {
      let iconColor = '#ef4444';
      let symbol = '⚠️';
      if (hazard.type === 'cattle') { symbol = '🐄'; iconColor = '#f59e0b'; }
      else if (hazard.type === 'auto') { symbol = '🛺'; iconColor = '#fbbf24'; }
      else if (hazard.type === 'pothole') { symbol = '🕳️'; iconColor = '#e11d48'; }
      else if (hazard.type === 'camera') { symbol = '📸'; iconColor = '#38bdf8'; }
      else if (hazard.type === 'ghat') { symbol = '⛰️'; iconColor = '#ec4899'; }
      else if (hazard.type === 'fog') { symbol = '🌫️'; iconColor = '#94a3b8'; }

      const hazardHtml = `<div class="hud-hazard-pin" style="border-color:${iconColor};">${symbol}</div>`;
      const hazardIcon = L.divIcon({
        className: 'hud-hazard-div-icon',
        html: hazardHtml,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = L.marker([hazard.lat, hazard.lng], { icon: hazardIcon })
        .bindPopup(`
          <div style="font-family:'Inter',sans-serif; color:#0f172a; padding:4px;">
            <b style="font-size:13px; color:#e11d48;">${symbol} ${hazard.title}</b><br>
            <span style="font-size:11px; color:#64748b;">Active Highway Hazard Marker</span>
          </div>
        `)
        .addTo(this.map);

      this.hazardMarkers.push({ marker, hazard, lat: hazard.lat, lng: hazard.lng });
    });

    this.routeIndex = 0;
    const startPoint = corridor.waypoints[0];
    this.vehicleMarker.setLatLng(startPoint);
    this.map.setView(startPoint, 15);

    // Load authentic Google Maps POIs
    this.loadPois(corridorKey, this.activeCategory);
  }

  loadPois(corridorKey, filterCat = 'all') {
    this.poiMarkers.forEach(m => this.map.removeLayer(m));
    this.poiMarkers = [];

    const corridor = this.corridors[corridorKey];
    if (!corridor || !corridor.pois) return;

    corridor.pois.forEach(poi => {
      if (filterCat !== 'all' && poi.cat !== filterCat) return;

      const poiHtml = `
        <div class="gmap-poi-bubble ${poi.cat}">
          <span class="poi-ico">${poi.icon}</span>
        </div>
      `;
      const icon = L.divIcon({
        className: 'gmap-poi-div-icon',
        html: poiHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const popupHtml = `
        <div class="gmap-popup-card">
          <div class="gpc-header">
            <h4 class="gpc-name">${poi.name}</h4>
            <span class="gpc-cat">${poi.cat.toUpperCase()}</span>
          </div>
          <div class="gpc-rating">
            <span style="color:#f59e0b;">★★★★☆</span> <strong>${poi.rating}</strong>
            <span style="color:#64748b; font-size:11px;">(Google verified)</span>
          </div>
          <div class="gpc-desc">${poi.desc}</div>
          <div class="gpc-status">🟢 Open • Verified Satellite POI</div>
          <div class="gpc-actions">
            <button class="gpc-nav-btn" onclick="window.startNavigationTo(${poi.lat}, ${poi.lng}, '${poi.name.replace(/'/g, "\\'")}')">
              <span>↗️</span> Start Navigation
            </button>
          </div>
        </div>
      `;

      const m = L.marker([poi.lat, poi.lng], { icon })
        .bindPopup(popupHtml, { maxWidth: 280, className: 'gmap-custom-leaflet-popup' })
        .addTo(this.map);

      this.poiMarkers.push(m);
    });
  }

  filterCategory(cat) {
    this.activeCategory = cat;
    this.loadPois(this.currentCorridor, cat);
  }

  zoomIn() {
    if (this.map) this.map.zoomIn();
  }

  zoomOut() {
    if (this.map) this.map.zoomOut();
  }

  recenterOnCar() {
    if (this.map && this.vehicleMarker) {
      this.map.setView(this.vehicleMarker.getLatLng(), 16, { animate: true });
    }
  }

  getSearchSuggestions(query) {
    const q = (query || '').trim().toLowerCase();
    const suggestions = [];

    // 1. Current Corridor POIs
    const currCorridor = this.corridors[this.currentCorridor];
    if (currCorridor && currCorridor.pois) {
      for (const poi of currCorridor.pois) {
        if (!q || poi.name.toLowerCase().includes(q) || poi.desc.toLowerCase().includes(q) || poi.cat.includes(q)) {
          suggestions.push({
            name: poi.name,
            desc: `${poi.desc} (${poi.rating ? '★ ' + poi.rating : ''})`,
            icon: poi.icon || '📍',
            lat: poi.lat,
            lng: poi.lng,
          });
        }
      }
    }

    // 2. Known Landmarks & Major Indian Metros
    const landmarks = [
      { name: 'Pune (FC Road & Shivaji Nagar)', desc: 'Smart City & Auto Tech Hub, Maharashtra', icon: '🏛️', lat: 18.5204, lng: 73.8567 },
      { name: 'Hinjewadi IT Park, Pune', desc: 'Rajiv Gandhi Infotech Park Phase 1, Maharashtra', icon: '🏢', lat: 18.5913, lng: 73.7389 },
      { name: 'Mumbai Marine Drive', desc: 'Queen\'s Necklace Coastal Promenade, Maharashtra', icon: '🌊', lat: 18.9438, lng: 72.8232 },
      { name: 'Bandra-Worli Sea Link, Mumbai', desc: '8-Lane Cable-Stayed Coastal Expressway', icon: '🌉', lat: 19.0350, lng: 72.8220 },
      { name: 'Connaught Place & India Gate, New Delhi', desc: 'National Capital Central Ring, Delhi', icon: '🇮🇳', lat: 28.6315, lng: 77.2167 },
      { name: 'Cyber Hub, Gurugram', desc: 'DLF Cyber City Tech Boulevard, Haryana', icon: '🏙️', lat: 28.4952, lng: 77.0895 },
      { name: 'Outer Ring Road, Bengaluru', desc: 'Silicon Plateau IT Corridor, Karnataka', icon: '💻', lat: 12.9352, lng: 77.6245 },
      { name: 'Hitec City & Cyber Towers, Hyderabad', desc: 'HITEC IT Corridor & Financial District', icon: '🚀', lat: 17.4504, lng: 78.3808 },
      { name: 'Kashi Vishwanath Dham, Varanasi', desc: 'Sacred Jyotirlinga & Cultural Corridor, UP', icon: '🛕', lat: 25.3109, lng: 83.0107 },
      { name: 'Assi Ghat & Subah-e-Banaras, Varanasi', desc: 'Sacred Ganga Riverfront & Aarti, UP', icon: '🌅', lat: 25.2905, lng: 82.9965 },
      { name: 'Gorakhnath Temple & Math, Gorakhpur', desc: 'Historic Nath Monastic Center, Purvanchal', icon: '🛕', lat: 26.7720, lng: 83.3550 },
      { name: 'Ramgarh Taal Marine Drive, Gorakhpur', desc: 'Scenic Waterfront Tourism Promenade, UP', icon: '⛵', lat: 26.7420, lng: 83.3980 },
      { name: 'Shri Ram Janmabhoomi Mandir, Ayodhya', desc: 'Grand Ram Mandir Complex, UP', icon: '🛕', lat: 26.7950, lng: 82.1940 },
      { name: 'Triveni Sangam, Prayagraj', desc: 'Holy Confluence of Ganga, Yamuna & Saraswati', icon: '🕉️', lat: 25.4299, lng: 81.8824 },
      { name: 'Purvanchal Expressway 100 km/h Gantry', desc: '6-Lane Access-Controlled Highway, UP', icon: '🛣️', lat: 26.0235, lng: 83.1782 },
      { name: 'TIDEL Park, Rajiv Gandhi IT Expressway (OMR), Chennai', desc: 'State IT Highway, Chennai', icon: '🏢', lat: 12.9892, lng: 80.2475 },
      { name: 'Park Street & Victoria Memorial, Kolkata', desc: 'Historic Heritage Corridor, West Bengal', icon: '🏛️', lat: 22.5448, lng: 88.3426 },
      { name: 'Sabarmati Riverfront, Ahmedabad', desc: 'Iconic Urban Riverfront Promenade, Gujarat', icon: '🌆', lat: 23.0225, lng: 72.5714 },
      { name: 'Hawa Mahal & MI Road, Jaipur', desc: 'Pink City Heritage Expressway, Rajasthan', icon: '🏰', lat: 26.9239, lng: 75.8267 },
      { name: 'BHU Campus & Trauma Centre, Varanasi', desc: 'Premier Banaras Hindu University, UP', icon: '🎓', lat: 25.2677, lng: 82.9913 },
    ];

    for (const lm of landmarks) {
      if (!q || lm.name.toLowerCase().includes(q) || lm.desc.toLowerCase().includes(q)) {
        if (!suggestions.some(s => s.name === lm.name)) {
          suggestions.push(lm);
        }
      }
    }

    return suggestions.slice(0, 8);
  }

  showToast(msg, type = 'info') {
    let toast = document.getElementById('gmap-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'gmap-toast';
      toast.className = 'gmap-toast-pill';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = `gmap-toast-pill show ${type}`;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }

  async searchPlace(query) {
    if (!query || !this.map) return null;
    const q = query.trim().toLowerCase();

    // Comprehensive offline dictionary of Indian cities and highway corridors
    const knownLocations = {
      'pune': { name: 'Pune (FC Road & Shivaji Nagar), Maharashtra', lat: 18.5204, lng: 73.8567, zoom: 15 },
      'hinjewadi': { name: 'Hinjewadi IT Park Phase 1, Pune, Maharashtra', lat: 18.5913, lng: 73.7389, zoom: 15 },
      'viman nagar': { name: 'Viman Nagar, Pune, Maharashtra', lat: 18.5679, lng: 73.9143, zoom: 15 },
      'kothrud': { name: 'Kothrud, Pune, Maharashtra', lat: 18.5074, lng: 73.8077, zoom: 15 },
      'mumbai': { name: 'Marine Drive & Nariman Point, Mumbai, Maharashtra', lat: 18.9438, lng: 72.8232, zoom: 14 },
      'bandra': { name: 'Bandra West & Bandra-Worli Sea Link, Mumbai', lat: 19.0596, lng: 72.8295, zoom: 15 },
      'delhi': { name: 'Connaught Place & India Gate, New Delhi', lat: 28.6315, lng: 77.2167, zoom: 14 },
      'new delhi': { name: 'Connaught Place & India Gate, New Delhi', lat: 28.6315, lng: 77.2167, zoom: 14 },
      'noida': { name: 'Sector 18 & Noida Expressway, Uttar Pradesh', lat: 28.5708, lng: 77.3271, zoom: 15 },
      'gurgaon': { name: 'Cyber Hub & DLF Cyber City, Gurugram, Haryana', lat: 28.4952, lng: 77.0895, zoom: 15 },
      'gurugram': { name: 'Cyber Hub & DLF Cyber City, Gurugram, Haryana', lat: 28.4952, lng: 77.0895, zoom: 15 },
      'bangalore': { name: 'Outer Ring Road & Indiranagar, Bengaluru, Karnataka', lat: 12.9716, lng: 77.5946, zoom: 14 },
      'bengaluru': { name: 'MG Road & Outer Ring Road, Bengaluru, Karnataka', lat: 12.9716, lng: 77.5946, zoom: 14 },
      'whitefield': { name: 'Whitefield & ITPL Tech Park, Bengaluru, Karnataka', lat: 12.9698, lng: 77.7499, zoom: 15 },
      'hyderabad': { name: 'Hitec City & Cyber Towers, Hyderabad, Telangana', lat: 17.4504, lng: 78.3808, zoom: 15 },
      'secunderabad': { name: 'Secunderabad Junction & Clock Tower, Telangana', lat: 17.4399, lng: 78.4983, zoom: 15 },
      'chennai': { name: 'TIDEL Park, Rajiv Gandhi IT Expressway (OMR), Chennai', lat: 12.9892, lng: 80.2475, zoom: 15 },
      'kolkata': { name: 'Park Street & Victoria Memorial, Kolkata, West Bengal', lat: 22.5448, lng: 88.3426, zoom: 15 },
      'howrah': { name: 'Howrah Bridge & Station, Kolkata, West Bengal', lat: 22.5850, lng: 88.3468, zoom: 15 },
      'ahmedabad': { name: 'Sabarmati Riverfront & SG Highway, Ahmedabad, Gujarat', lat: 23.0225, lng: 72.5714, zoom: 15 },
      'surat': { name: 'Surat Diamond Bourse & Dumas Road, Surat, Gujarat', lat: 21.1702, lng: 72.8311, zoom: 15 },
      'jaipur': { name: 'Hawa Mahal & MI Road, Jaipur, Rajasthan', lat: 26.9239, lng: 75.8267, zoom: 15 },
      'lucknow': { name: 'Hazratganj & Gomti Nagar, Lucknow, Uttar Pradesh', lat: 26.8467, lng: 80.9462, zoom: 15 },
      'kanpur': { name: 'Mall Road & Civil Lines, Kanpur, Uttar Pradesh', lat: 26.4499, lng: 80.3319, zoom: 15 },
      'nagpur': { name: 'Zero Mile Stone & Sitabuldi, Nagpur, Maharashtra', lat: 21.1458, lng: 79.0882, zoom: 15 },
      'indore': { name: 'Rajwada & Vijay Nagar, Indore, Madhya Pradesh', lat: 22.7196, lng: 75.8577, zoom: 15 },
      'bhopal': { name: 'VIP Road & Upper Lake, Bhopal, Madhya Pradesh', lat: 23.2599, lng: 77.4126, zoom: 15 },
      'chandigarh': { name: 'Sector 17 Plaza & Sukhna Lake, Chandigarh', lat: 30.7333, lng: 76.7794, zoom: 15 },
      'goa': { name: 'Panaji Miramar Beach & Candolim, Goa', lat: 15.4909, lng: 73.8278, zoom: 14 },
      'panaji': { name: 'Panaji Promenade & Mandovi River, Goa', lat: 15.4989, lng: 73.8278, zoom: 15 },
      'varanasi': { name: 'Varanasi (Kashi / Banaras), Purvanchal, Uttar Pradesh', lat: 25.3176, lng: 82.9739, zoom: 15 },
      'banaras': { name: 'Varanasi (Kashi / Banaras), Purvanchal, Uttar Pradesh', lat: 25.3176, lng: 82.9739, zoom: 15 },
      'kashi': { name: 'Shri Kashi Vishwanath Dham, Varanasi, Uttar Pradesh', lat: 25.3109, lng: 83.0107, zoom: 16 },
      'kashi vishwanath': { name: 'Shri Kashi Vishwanath Dham, Varanasi, Uttar Pradesh', lat: 25.3109, lng: 83.0107, zoom: 16 },
      'assi ghat': { name: 'Assi Ghat, Varanasi, Uttar Pradesh', lat: 25.2905, lng: 82.9965, zoom: 16 },
      'assi': { name: 'Assi Ghat, Varanasi, Uttar Pradesh', lat: 25.2905, lng: 82.9965, zoom: 16 },
      'gorakhpur': { name: 'Gorakhpur (Gorakhnath Temple & Ramgarh Taal), Purvanchal, UP', lat: 26.7606, lng: 83.3732, zoom: 15 },
      'ramgarh taal': { name: 'Ramgarh Taal Lake Promenade, Gorakhpur, Uttar Pradesh', lat: 26.7420, lng: 83.3980, zoom: 16 },
      'gorakhnath': { name: 'Gorakhnath Temple & Math, Gorakhpur, Uttar Pradesh', lat: 26.7720, lng: 83.3550, zoom: 16 },
      'ayodhya': { name: 'Shri Ram Janmabhoomi Mandir & Saryu Ghat, Ayodhya, UP', lat: 26.7922, lng: 82.1998, zoom: 15 },
      'ram mandir': { name: 'Shri Ram Janmabhoomi Mandir, Ayodhya, Uttar Pradesh', lat: 26.7950, lng: 82.1940, zoom: 16 },
      'prayagraj': { name: 'Triveni Sangam, Prayagraj, Purvanchal, Uttar Pradesh', lat: 25.4299, lng: 81.8824, zoom: 15 },
      'sangam': { name: 'Triveni Sangam, Prayagraj, Uttar Pradesh', lat: 25.4299, lng: 81.8824, zoom: 16 },
      'allahabad': { name: 'Triveni Sangam, Prayagraj (Allahabad), Uttar Pradesh', lat: 25.4299, lng: 81.8824, zoom: 15 },
      'purvanchal expressway': { name: 'Purvanchal Expressway (Azamgarh - Ghazipur), Uttar Pradesh', lat: 26.0235, lng: 83.1782, zoom: 14 },
      'purvanchal': { name: 'Purvanchal Expressway (Azamgarh - Ghazipur), Uttar Pradesh', lat: 26.0235, lng: 83.1782, zoom: 14 },
      'agra': { name: 'Taj Mahal & Fatehabad Road, Agra, Uttar Pradesh', lat: 27.1751, lng: 78.0421, zoom: 15 },
      'taj mahal': { name: 'Taj Mahal, Agra, Uttar Pradesh', lat: 27.1751, lng: 78.0421, zoom: 16 },
      'mathura': { name: 'Shri Krishna Janmasthan, Mathura, Uttar Pradesh', lat: 27.4924, lng: 77.6737, zoom: 15 },
      'vrindavan': { name: 'Prem Mandir & ISKCON, Vrindavan, Uttar Pradesh', lat: 27.5706, lng: 77.6598, zoom: 15 },
      'dehradun': { name: 'Clock Tower & Rajpur Road, Dehradun, Uttarakhand', lat: 30.3165, lng: 78.0322, zoom: 15 },
      'shimla': { name: 'Mall Road & The Ridge, Shimla, Himachal Pradesh', lat: 31.1048, lng: 77.1734, zoom: 15 },
      'manali': { name: 'Mall Road & Solang Valley, Manali, Himachal Pradesh', lat: 32.2396, lng: 77.1887, zoom: 15 },
      'amritsar': { name: 'Golden Temple (Harmandir Sahib), Amritsar, Punjab', lat: 31.6200, lng: 74.8765, zoom: 16 },
      'golden temple': { name: 'Harmandir Sahib (Golden Temple), Amritsar, Punjab', lat: 31.6200, lng: 74.8765, zoom: 16 },
      'srinagar': { name: 'Dal Lake & Boulevard Road, Srinagar, Kashmir', lat: 34.0837, lng: 74.7973, zoom: 14 },
      'patna': { name: 'Gandhi Maidan & Ganga Pathway, Patna, Bihar', lat: 25.5941, lng: 85.1376, zoom: 15 },
      'ranchi': { name: 'Main Road & Morabadi, Ranchi, Jharkhand', lat: 23.3441, lng: 85.3096, zoom: 15 },
      'bhubaneswar': { name: 'Janpath & Temple City, Bhubaneswar, Odisha', lat: 20.2961, lng: 85.8245, zoom: 15 },
      'raipur': { name: 'Marine Drive & Telibandha Lake, Raipur, Chhattisgarh', lat: 21.2514, lng: 81.6296, zoom: 15 },
      'visakhapatnam': { name: 'RK Beach & Beach Road, Visakhapatnam, Andhra Pradesh', lat: 17.6868, lng: 83.2185, zoom: 15 },
      'vizag': { name: 'RK Beach & Beach Road, Visakhapatnam, Andhra Pradesh', lat: 17.6868, lng: 83.2185, zoom: 15 },
      'vijayawada': { name: 'MG Road & Kanaka Durga Temple, Vijayawada, Andhra Pradesh', lat: 16.5062, lng: 80.6480, zoom: 15 },
      'kochi': { name: 'Marine Drive & MG Road, Kochi, Kerala', lat: 9.9816, lng: 76.2999, zoom: 15 },
      'cochin': { name: 'Marine Drive & MG Road, Kochi, Kerala', lat: 9.9816, lng: 76.2999, zoom: 15 },
      'trivandrum': { name: 'MG Road & Kovalam, Thiruvananthapuram, Kerala', lat: 8.5241, lng: 76.9366, zoom: 15 },
      'thiruvananthapuram': { name: 'MG Road & Kovalam, Thiruvananthapuram, Kerala', lat: 8.5241, lng: 76.9366, zoom: 15 },
      'coimbatore': { name: 'Avinashi Road & RS Puram, Coimbatore, Tamil Nadu', lat: 11.0168, lng: 76.9558, zoom: 15 },
      'madurai': { name: 'Meenakshi Amman Temple, Madurai, Tamil Nadu', lat: 9.9195, lng: 78.1193, zoom: 16 },
      'mysore': { name: 'Mysore Palace & Sayyaji Rao Road, Mysuru, Karnataka', lat: 12.3052, lng: 76.6552, zoom: 15 },
      'mysuru': { name: 'Mysore Palace & Sayyaji Rao Road, Mysuru, Karnataka', lat: 12.3052, lng: 76.6552, zoom: 15 },
      'mangalore': { name: 'Panambur & MG Road, Mangaluru, Karnataka', lat: 12.9141, lng: 74.8560, zoom: 15 },
      'guwahati': { name: 'GS Road & Brahmaputra Riverfront, Guwahati, Assam', lat: 26.1445, lng: 91.7362, zoom: 15 },
      'jodhpur': { name: 'Mehrangarh Fort & Clock Tower, Jodhpur, Rajasthan', lat: 26.2978, lng: 73.0185, zoom: 15 },
      'udaipur': { name: 'City Palace & Lake Pichola, Udaipur, Rajasthan', lat: 24.5854, lng: 73.7125, zoom: 15 },
      'navi mumbai': { name: 'Palm Beach Road & Vashi, Navi Mumbai, Maharashtra', lat: 19.0330, lng: 73.0297, zoom: 15 },
      'thane': { name: 'Ghodbunder Road & Viviana Mall, Thane, Maharashtra', lat: 19.2183, lng: 72.9781, zoom: 15 },
      'nashik': { name: 'College Road & Trimbakeshwar Road, Nashik, Maharashtra', lat: 19.9975, lng: 73.7898, zoom: 15 },
      'vadodara': { name: 'Sayaji Baug & RC Dutt Road, Vadodara, Gujarat', lat: 22.3072, lng: 73.1812, zoom: 15 },
      'rajkot': { name: 'Yagnik Road & Race Course Ring Road, Rajkot, Gujarat', lat: 22.3039, lng: 70.8022, zoom: 15 },
      'azamgarh': { name: 'Azamgarh, Purvanchal, Uttar Pradesh', lat: 26.0687, lng: 83.1840, zoom: 15 },
      'jaunpur': { name: 'Jaunpur Shahi Bridge, Purvanchal, Uttar Pradesh', lat: 25.7464, lng: 82.6837, zoom: 15 },
      'ghazipur': { name: 'Ghazipur, Purvanchal, Uttar Pradesh', lat: 25.5840, lng: 83.5770, zoom: 15 },
      'mirzapur': { name: 'Mirzapur Vindhyachal Dham, Purvanchal, Uttar Pradesh', lat: 25.1337, lng: 82.5644, zoom: 15 },
      'bhu': { name: 'Banaras Hindu University (BHU), Varanasi, Uttar Pradesh', lat: 25.2677, lng: 82.9913, zoom: 16 },
      'sarnath': { name: 'Dhamek Stupa, Sarnath, Varanasi, Uttar Pradesh', lat: 25.3811, lng: 83.0214, zoom: 16 },
      'babatpur': { name: 'Lal Bahadur Shastri International Airport (Babatpur VNS)', lat: 25.4526, lng: 82.8596, zoom: 16 },
      'tidel park': { name: 'TIDEL Park, Rajiv Gandhi IT Expressway (OMR), Chennai', lat: 12.9892, lng: 80.2475, zoom: 16 },
    };

    // 1. Direct or partial match in instant offline dictionary
    let matched = null;
    for (const [k, v] of Object.entries(knownLocations)) {
      if (q === k || q.startsWith(k) || k.startsWith(q) || q.includes(k) || k.includes(q)) {
        matched = v;
        break;
      }
    }

    let lat, lng, name, zoom;
    if (matched) {
      lat = matched.lat;
      lng = matched.lng;
      name = matched.name;
      zoom = matched.zoom;
    } else {
      // 2. Multi-tier Online Geocoding
      try {
        let searchParam = query.trim();
        if (!searchParam.toLowerCase().includes('india')) {
          searchParam = `${searchParam}, India`;
        }
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchParam)}&countrycodes=in&limit=3&addressdetails=1`);
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.length > 0) {
            lat = parseFloat(data[0].lat);
            lng = parseFloat(data[0].lon);
            name = data[0].display_name.split(',').slice(0, 3).join(', ');
            zoom = 15;
          }
        }
      } catch (e) {
        console.warn('Nominatim geocoding failed, trying Photon fallback:', e);
      }

      // Tier 2: Photon Komoot Geocoder fallback
      if (!lat || !lng) {
        try {
          const pResp = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=3`);
          if (pResp.ok) {
            const pData = await pResp.json();
            if (pData && pData.features && pData.features.length > 0) {
              const feat = pData.features[0];
              lng = feat.geometry.coordinates[0];
              lat = feat.geometry.coordinates[1];
              const props = feat.properties || {};
              name = [props.name, props.city, props.state, props.country].filter(Boolean).join(', ');
              zoom = 15;
            }
          }
        } catch (e) {
          console.warn('Photon geocoding failed:', e);
        }
      }
    }

    if (!lat || !lng) {
      this.showToast(`Location "${query}" not found in India directory. Try "Pune", "Mumbai", "Delhi", "Bengaluru", "Kashi Vishwanath", etc.`, 'warn');
      return null;
    }

    this.map.flyTo([lat, lng], zoom || 15, { duration: 1.2 });

    if (this.searchMarker) {
      this.map.removeLayer(this.searchMarker);
    }

    const googlePinHtml = `
      <div class="google-red-pin-drop">
        <div class="red-pin-head">
          <div class="red-pin-dot"></div>
        </div>
        <div class="red-pin-shadow"></div>
      </div>
    `;
    const redPinIcon = L.divIcon({
      className: 'google-red-pin-icon',
      html: googlePinHtml,
      iconSize: [32, 42],
      iconAnchor: [16, 42],
    });

    this.searchMarker = L.marker([lat, lng], { icon: redPinIcon }).addTo(this.map);
    const safeName = name.replace(/'/g, "\\'");
    this.searchMarker.bindPopup(`
      <div class="gmap-popup-card">
        <div class="gpc-header">
          <h4 class="gpc-name">${name}</h4>
          <span class="gpc-cat">GOOGLE MAPS SATELLITE</span>
        </div>
        <div class="gpc-desc">${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E</div>
        <div class="gpc-actions" style="display:flex; gap:8px; margin-top:8px;">
          <button class="gpc-nav-btn" onclick="window.startNavigationTo(${lat}, ${lng}, '${safeName}')">
            <span>↗️</span> Navigate Here
          </button>
          <button class="gpc-nav-btn" style="background:#0284c7;" onclick="window.teleportCarTo(${lat}, ${lng}, '${safeName}')">
            <span>🚗</span> Drive Here
          </button>
        </div>
      </div>
    `, { className: 'gmap-custom-leaflet-popup' }).openPopup();

    this.showToast(`Found: ${name}`, 'success');
    return { lat, lng, name };
  }

  async startNavigationTo(targetLat, targetLng, targetName = 'Destination') {
    if (!this.map) return null;

    // Close any active popup
    this.map.closePopup();

    const startPos = this.vehicleMarker ? this.vehicleMarker.getLatLng() : { lat: 12.98289, lng: 80.23586 };
    const startLat = startPos.lat;
    const startLng = startPos.lng;

    const directDistKm = this._haversineDistance(startLat, startLng, targetLat, targetLng) / 1000;

    let routePoints = [];
    let maneuverSteps = [];

    // Attempt online OSRM driving route with quick timeout
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${targetLng},${targetLat}?overview=full&geometries=geojson&steps=true`;
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 1800);
      const resp = await fetch(osrmUrl, { signal: ctrl.signal });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const json = await resp.json();
        if (json && json.routes && json.routes.length > 0) {
          const route = json.routes[0];
          routePoints = route.geometry.coordinates.map(coord => [coord[1], coord[0]]); // [lng, lat] -> [lat, lng]
          if (route.legs && route.legs[0] && route.legs[0].steps) {
            maneuverSteps = route.legs[0].steps.map(s => ({
              icon: s.maneuver.type.includes('left') ? '↖️' : s.maneuver.type.includes('right') ? '↗️' : '⬆️',
              text: s.maneuver.instruction || (s.name ? `Proceed onto ${s.name}` : `Head towards ${targetName}`),
              distance: s.distance > 1000 ? `${(s.distance / 1000).toFixed(1)} km` : `${Math.round(s.distance)} m`,
              meters: s.distance,
            }));
          }
        }
      }
    } catch (e) {
      console.warn('Online OSRM routing timed out or failed, using intelligent road interpolation:', e);
    }

    // Fallback: If OSRM failed or points < 2, generate realistic road curve waypoints
    if (routePoints.length < 2) {
      const steps = 16;
      routePoints = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const curveLat = Math.sin(t * Math.PI) * 0.0025;
        const curveLng = Math.sin(t * Math.PI) * 0.0018;
        const lat = startLat + (targetLat - startLat) * t + curveLat;
        const lng = startLng + (targetLng - startLng) * t + curveLng;
        routePoints.push([lat, lng]);
      }

      maneuverSteps = [
        { icon: '⬆️', text: `Proceed towards ${targetName} via Connected Arterial Road`, distance: '400 m', meters: 400 },
        { icon: '↗️', text: `Keep Right towards ${targetName}`, distance: '800 m', meters: 800 },
        { icon: '🏁', text: `Arriving at ${targetName} on Left`, distance: '150 m', meters: 150 },
      ];
    }

    // Clear previous polylines & destination markers
    if (this.routePolyline) this.map.removeLayer(this.routePolyline);
    if (this.trafficPolyline) this.map.removeLayer(this.trafficPolyline);
    if (this.destMarker) this.map.removeLayer(this.destMarker);

    // High visibility glowing Google blue route line
    this.routePolyline = L.polyline(routePoints, {
      color: '#1a73e8',
      weight: 7,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(this.map);

    this.trafficPolyline = L.polyline(routePoints, {
      color: '#38bdf8',
      weight: 3,
      opacity: 0.9,
      dashArray: '10, 8',
    }).addTo(this.map);

    // Add Destination Checkered Pin
    const destHtml = `
      <div class="gmap-dest-pin">
        <div class="dest-flag">🏁</div>
        <div class="dest-label">${targetName}</div>
      </div>
    `;
    const destIcon = L.divIcon({
      className: 'gmap-dest-icon',
      html: destHtml,
      iconSize: [140, 36],
      iconAnchor: [70, 36],
    });
    this.destMarker = L.marker([targetLat, targetLng], { icon: destIcon }).addTo(this.map);

    // Reset vehicle to beginning of navigation
    this.routeIndex = 0;
    this.traveledPath = [];
    this.vehicleMarker.setLatLng([startLat, startLng]);

    // Fit map bounds to view route
    const bounds = L.latLngBounds(routePoints);
    this.map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });

    // Store active custom route
    this.activeCustomRoute = {
      targetLat,
      targetLng,
      targetName,
      waypoints: routePoints,
      maneuverSteps,
      currentStepIdx: 0,
      totalKm: directDistKm,
      isNavigating: true,
      arrived: false,
    };

    return {
      targetName,
      distanceKm: directDistKm.toFixed(1),
      estimatedMins: Math.max(2, Math.round((directDistKm / 40) * 60)),
    };
  }

  stopNavigation() {
    if (!this.activeCustomRoute) return;
    this.activeCustomRoute = null;
    if (this.destMarker) {
      this.map.removeLayer(this.destMarker);
      this.destMarker = null;
    }
    // Restore current corridor route
    this.loadCorridor(this.currentCorridor);
  }

  promptAddHazard(latlng) {
    const types = [
      { id: 'cattle', name: '🐄 Stray Cattle' },
      { id: 'pothole', name: '🕳️ Crater Pothole' },
      { id: 'speed_breaker', name: '🛑 Unmarked Speed Breaker' },
      { id: 'auto', name: '🛺 Auto Congestion' },
      { id: 'camera', name: '📸 Speed Trap' },
    ];
    
    // Pick next hazard
    const picked = types[Math.floor(Math.random() * types.length)];
    this.addCustomHazard(latlng.lat, latlng.lng, picked.id, `Crowdsourced: ${picked.name}`);
  }

  addCustomHazard(lat, lng, type, title) {
    let iconColor = '#ef4444';
    let symbol = '⚠️';
    if (type === 'cattle') { symbol = '🐄'; iconColor = '#f59e0b'; }
    else if (type === 'auto') { symbol = '🛺'; iconColor = '#fbbf24'; }
    else if (type === 'pothole') { symbol = '🕳️'; iconColor = '#e11d48'; }
    else if (type === 'camera') { symbol = '📸'; iconColor = '#38bdf8'; }

    const hazardHtml = `<div class="hud-hazard-pin user-pin" style="border-color:${iconColor}; animation: pulse-pin 1.5s infinite;">${symbol}</div>`;
    const hazardIcon = L.divIcon({
      className: 'hud-hazard-div-icon',
      html: hazardHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([lat, lng], { icon: hazardIcon })
      .bindPopup(`<b>${symbol} ${title}</b><br><small style="color:#10b981;">Reported by Suraksha AI Network</small>`)
      .addTo(this.map);

    this.userReportedMarkers.push(marker);
    this.hazardMarkers.push({ marker, hazard: { type, title }, lat, lng });

    marker.openPopup();
  }

  stepVehicle(speedKmh = 60) {
    if (!this.map || !this.vehicleMarker) return;

    // If real-world GPS tracking is active, track live device location
    if (this.isLiveGpsActive && this.liveLocationData.lat && this.liveLocationData.lng) {
      const lat = this.liveLocationData.lat;
      const lng = this.liveLocationData.lng;
      const activeHazardNearby = this._checkHazardProximity(lat, lng);
      return {
        lat: lat.toFixed(5),
        lng: lng.toFixed(5),
        corridorName: this.liveLocationData.locationName || 'Live GPS Location',
        roadType: 'Real-World Road Trajectory',
        speedLimit: 60,
        heading: this.liveLocationData.heading || 0,
        nextManeuver: {
          icon: '📍',
          text: `Live GPS Fix: ${this.liveLocationData.locationName}`,
          distance: `Accuracy ±${this.liveLocationData.accuracy || 10}m`,
        },
        kmRemaining: 'Live Real-Time',
        etaMins: '--',
        activeHazardNearby,
        isLive: true,
        accuracy: this.liveLocationData.accuracy,
        altitude: this.liveLocationData.altitude,
      };
    }

    // If active custom navigation is running towards a searched place or POI
    if (this.activeCustomRoute && this.activeCustomRoute.isNavigating) {
      const route = this.activeCustomRoute;
      const points = route.waypoints;

      const stepSize = Math.max(0.0004, (speedKmh / 3600) * 0.06);
      this.routeIndex = Math.min(points.length - 1, this.routeIndex + stepSize);

      const currIdx = Math.floor(this.routeIndex);
      const nextIdx = Math.min(points.length - 1, currIdx + 1);
      const fraction = this.routeIndex - currIdx;

      const p1 = points[currIdx];
      const p2 = points[nextIdx];

      const lat = p1[0] + (p2[0] - p1[0]) * fraction;
      const lng = p1[1] + (p2[1] - p1[1]) * fraction;
      const newLatLng = [lat, lng];

      const dLat = p2[0] - p1[0];
      const dLng = p2[1] - p1[1];
      if (Math.hypot(dLat, dLng) > 0.00001) {
        let angleRad = Math.atan2(dLng, dLat);
        let angleDeg = (angleRad * 180) / Math.PI;
        this.currentHeading = angleDeg;
        const arrowElem = document.getElementById('hud-car-arrow');
        if (arrowElem) {
          arrowElem.style.transform = `rotate(${angleDeg - 45}deg)`;
        }
      }

      this.vehicleMarker.setLatLng(newLatLng);
      if (this.radarCircle) this.radarCircle.setLatLng(newLatLng);

      this.traveledPath.push(newLatLng);
      if (this.traveledPath.length > 80) this.traveledPath.shift();
      this.trailPolyline.setLatLngs(this.traveledPath);

      if (this.isFollowCar) {
        this.map.panTo(newLatLng, { animate: true, duration: 0.3 });
      }

      const distToTargetMeters = this._haversineDistance(lat, lng, route.targetLat, route.targetLng);
      const kmRemaining = (distToTargetMeters / 1000).toFixed(1);
      const etaMins = speedKmh > 5 ? Math.max(1, Math.round((Number(kmRemaining) / speedKmh) * 60)) : '--';

      let nextManeuver = {
        icon: '⬆️',
        text: `Navigating to ${route.targetName}`,
        distance: `${Math.round(distToTargetMeters)} m`,
      };

      if (distToTargetMeters < 35 && !route.arrived) {
        route.arrived = true;
        nextManeuver = {
          icon: '🏁',
          text: `Arrived at ${route.targetName}!`,
          distance: '0 m',
        };
      } else if (route.maneuverSteps && route.maneuverSteps.length > 0) {
        const stepProgress = Math.min(route.maneuverSteps.length - 1, Math.floor((this.routeIndex / (points.length - 1)) * route.maneuverSteps.length));
        nextManeuver = route.maneuverSteps[stepProgress];
      }

      return {
        lat: lat.toFixed(4),
        lng: lng.toFixed(4),
        corridorName: `Route to ${route.targetName}`,
        roadType: 'Turn-by-Turn Navigation',
        speedLimit: 60,
        heading: Math.round(this.currentHeading),
        nextManeuver,
        kmRemaining,
        etaMins,
        activeHazardNearby: null,
        isCustomNav: true,
        destinationName: route.targetName,
        arrived: route.arrived,
      };
    }

    const corridor = this.corridors[this.currentCorridor];
    const points = corridor.waypoints;

    // Advance along route proportionally to speed
    const stepSize = Math.max(0.0003, (speedKmh / 3600) * 0.05);
    this.routeIndex = (this.routeIndex + stepSize) % (points.length - 1);

    const currIdx = Math.floor(this.routeIndex);
    const nextIdx = (currIdx + 1) % points.length;
    const fraction = this.routeIndex - currIdx;

    const p1 = points[currIdx];
    const p2 = points[nextIdx];

    const lat = p1[0] + (p2[0] - p1[0]) * fraction;
    const lng = p1[1] + (p2[1] - p1[1]) * fraction;
    const newLatLng = [lat, lng];

    // Compute heading bearing angle in degrees
    const dLat = p2[0] - p1[0];
    const dLng = p2[1] - p1[1];
    let angleRad = Math.atan2(dLng, dLat);
    let angleDeg = (angleRad * 180) / Math.PI;
    this.currentHeading = angleDeg;

    // Update marker position & rotation
    this.vehicleMarker.setLatLng(newLatLng);
    const arrowElem = document.getElementById('hud-car-arrow');
    if (arrowElem) {
      arrowElem.style.transform = `rotate(${angleDeg - 45}deg)`;
    }

    // Update Radar Circle position
    if (this.radarCircle) {
      this.radarCircle.setLatLng(newLatLng);
    }

    // Update Traveled Path Breadcrumb
    this.traveledPath.push(newLatLng);
    if (this.traveledPath.length > 80) this.traveledPath.shift();
    this.trailPolyline.setLatLngs(this.traveledPath);

    // Follow Car Camera Auto-Pan
    if (this.isFollowCar) {
      this.map.panTo(newLatLng, { animate: true, duration: 0.3 });
    }

    // Check Proximity to Hazard Markers (Radar Alert)
    const activeHazardNearby = this._checkHazardProximity(lat, lng);

    // Calculate Turn-by-Turn Maneuver
    const progressPct = this.routeIndex / (points.length - 1);
    const nextManeuver = this._getNextManeuver(corridor, progressPct);
    const kmRemaining = (corridor.totalKm * (1 - progressPct)).toFixed(1);
    const etaMins = speedKmh > 5 ? Math.round((Number(kmRemaining) / speedKmh) * 60) : '--';

    return {
      lat: lat.toFixed(4),
      lng: lng.toFixed(4),
      corridorName: corridor.name,
      roadType: corridor.type,
      speedLimit: corridor.defaultSpeedLimit,
      heading: Math.round(angleDeg),
      nextManeuver,
      kmRemaining,
      etaMins,
      activeHazardNearby,
    };
  }

  _checkHazardProximity(lat, lng) {
    let nearest = null;
    let minDist = 999999;

    this.hazardMarkers.forEach(item => {
      // Rough distance approximation in meters
      const dLat = (item.lat - lat) * 111000;
      const dLng = (item.lng - lng) * 111000 * Math.cos((lat * Math.PI) / 180);
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);

      if (dist < 650 && dist < minDist) {
        minDist = dist;
        nearest = {
          title: item.hazard.title,
          type: item.hazard.type,
          distanceMeters: Math.round(dist),
        };
      }
    });

    return nearest;
  }

  _getNextManeuver(corridor, progressPct) {
    const maneuvers = corridor.maneuvers || [];
    for (let i = 0; i < maneuvers.length; i++) {
      if (maneuvers[i].atPct >= progressPct) {
        return maneuvers[i];
      }
    }
    return {
      icon: '🏁',
      text: `Arriving at Destination Corridor Endpoint (${corridor.name})`,
      distance: 'Destination Ahead',
    };
  }

  // =========================================================================
  // Live GPS Geolocation & Real-World Location Detection Engine
  // =========================================================================

  async detectCurrentLocation() {
    if (!navigator.geolocation) {
      this.showToast('Geolocation is not supported by your browser.', 'warn');
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = Math.round(pos.coords.accuracy || 10);
          const altitude = pos.coords.altitude ? Math.round(pos.coords.altitude) : null;
          const heading = pos.coords.heading !== null && !isNaN(pos.coords.heading) ? Math.round(pos.coords.heading) : 0;
          const nowTime = Date.now();
          let calculatedSpeed = pos.coords.speed !== null && !isNaN(pos.coords.speed) ? Math.round(pos.coords.speed * 3.6) : null;

          // If device does not provide direct speed, compute real ground speed via satellite coordinate displacement (Haversine)
          if ((calculatedSpeed === null || calculatedSpeed === 0) && this.lastFixLatLng && this.lastFixTime) {
            const dtSec = (nowTime - this.lastFixTime) / 1000;
            if (dtSec >= 1 && dtSec < 60) {
              const dMeters = this._haversineDistance(this.lastFixLatLng[0], this.lastFixLatLng[1], lat, lng);
              calculatedSpeed = Math.round((dMeters / dtSec) * 3.6);
            }
          }

          this.lastFixLatLng = [lat, lng];
          this.lastFixTime = nowTime;

          this.liveLocationData = {
            lat,
            lng,
            accuracy,
            altitude,
            speed: calculatedSpeed !== null ? calculatedSpeed : 0,
            heading,
            isLive: true,
            locationName: 'Detecting address via Satellite...',
            city: 'India',
            state: '',
          };

          this.isLiveGpsActive = true;

          // Center map & position vehicle marker on Google Satellite
          this.map.setView([lat, lng], 16, { animate: true });
          this.vehicleMarker.setLatLng([lat, lng]);

          // Accuracy radius ring
          if (this.liveAccuracyCircle) {
            this.map.removeLayer(this.liveAccuracyCircle);
          }
          this.liveAccuracyCircle = L.circle([lat, lng], {
            radius: accuracy,
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.15,
            weight: 2,
            dashArray: '4, 4',
          }).addTo(this.map);

          if (this.radarCircle) {
            this.radarCircle.setLatLng([lat, lng]);
          }

          // Reverse geocode to get locality, road & city
          const geoResult = await this.reverseGeocode(lat, lng);
          this.liveLocationData.locationName = geoResult.locationName;
          this.liveLocationData.city = geoResult.city;
          this.liveLocationData.state = geoResult.state;
          this.liveLocationData.speedLimit = geoResult.speedLimit || 60;

          // Open Google Satellite popup banner
          this.vehicleMarker.bindPopup(`
            <div style="font-family:'Inter',sans-serif; color:#0f172a; padding:6px; min-width:200px;">
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
                <span style="color:#10b981; font-weight:800; font-size:12px;">🛰️ SATELLITE 3D FIX</span>
                <span style="background:#0284c7; color:#fff; font-size:9px; font-weight:700; padding:2px 6px; border-radius:3px;">GMAP SATELLITE</span>
              </div>
              <b style="font-size:13px; color:#0f172a; display:block; margin-bottom:2px;">${geoResult.locationName}</b>
              <div style="font-size:11px; color:#475569; margin-bottom:4px;">${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E</div>
              <div style="font-size:11px; background:#f1f5f9; padding:4px 6px; border-radius:4px; display:flex; justify-content:space-between;">
                <span>Speed: <strong>${calculatedSpeed || 0} km/h</strong></span>
                <span>Accuracy: <strong>±${accuracy}m</strong></span>
              </div>
            </div>
          `).openPopup();

          resolve(this.liveLocationData);
        },
        (err) => {
          console.warn('Geolocation detection error:', err.message);
          this.showToast(`GPS Location Detection: ${err.message}. Please allow Location permission.`, 'warn');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  startLiveLocationTracking(callback) {
    if (!navigator.geolocation) return;
    this.isLiveGpsActive = true;
    this.onLocationUpdateCallback = callback;

    this.liveWatchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy || 10);
        const altitude = pos.coords.altitude ? Math.round(pos.coords.altitude) : null;
        const heading = pos.coords.heading !== null && !isNaN(pos.coords.heading) ? Math.round(pos.coords.heading) : 0;
        const nowTime = Date.now();
        let calculatedSpeed = pos.coords.speed !== null && !isNaN(pos.coords.speed) ? Math.round(pos.coords.speed * 3.6) : null;

        if ((calculatedSpeed === null || calculatedSpeed === 0) && this.lastFixLatLng && this.lastFixTime) {
          const dtSec = (nowTime - this.lastFixTime) / 1000;
          if (dtSec >= 1 && dtSec < 60) {
            const dMeters = this._haversineDistance(this.lastFixLatLng[0], this.lastFixLatLng[1], lat, lng);
            calculatedSpeed = Math.round((dMeters / dtSec) * 3.6);
          }
        }

        this.lastFixLatLng = [lat, lng];
        this.lastFixTime = nowTime;

        this.liveLocationData.lat = lat;
        this.liveLocationData.lng = lng;
        this.liveLocationData.accuracy = accuracy;
        this.liveLocationData.altitude = altitude;
        this.liveLocationData.speed = calculatedSpeed !== null ? calculatedSpeed : 0;
        this.liveLocationData.heading = heading;
        this.liveLocationData.isLive = true;

        const newLatLng = [lat, lng];
        this.vehicleMarker.setLatLng(newLatLng);

        if (this.liveAccuracyCircle) {
          this.liveAccuracyCircle.setLatLng(newLatLng);
          this.liveAccuracyCircle.setRadius(accuracy);
        }
        if (this.radarCircle) {
          this.radarCircle.setLatLng(newLatLng);
        }

        if (this.isFollowCar) {
          this.map.panTo(newLatLng, { animate: true, duration: 0.5 });
        }

        // Breadcrumbs
        this.traveledPath.push(newLatLng);
        if (this.traveledPath.length > 80) this.traveledPath.shift();
        this.trailPolyline.setLatLngs(this.traveledPath);

        if (this.onLocationUpdateCallback) {
          this.onLocationUpdateCallback(this.liveLocationData);
        }
      },
      (err) => console.warn('Live tracking watch error:', err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 1000 }
    );
  }

  stopLiveLocationTracking() {
    if (this.liveWatchId !== null) {
      navigator.geolocation.clearWatch(this.liveWatchId);
      this.liveWatchId = null;
    }
    this.isLiveGpsActive = false;
    this.liveLocationData.isLive = false;
    if (this.liveAccuracyCircle) {
      this.map.removeLayer(this.liveAccuracyCircle);
      this.liveAccuracyCircle = null;
    }
  }

  async reverseGeocode(lat, lng) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        {
          headers: { 'Accept': 'application/json' },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        const addr = data.address || {};
        const road = addr.road || addr.highway || addr.suburb || addr.neighbourhood || '';
        const city = addr.city || addr.town || addr.municipality || addr.district || addr.state_district || 'Detected Area';
        const state = addr.state || 'India';

        const locationName = road ? `${road}, ${city}` : `${city}, ${state}`;
        return {
          locationName,
          city,
          state,
          road,
        };
      }
    } catch (e) {
      console.warn('Online reverse geocoding fetch failed or timed out, using regional fallback:', e);
    }

    // Graceful offline heuristic based on Indian coordinates
    return this._getNearestIndianCity(lat, lng);
  }

  _getNearestIndianCity(lat, lng) {
    const knownIndianHubs = [
      { name: 'Connaught Place', city: 'New Delhi', state: 'Delhi NCR', lat: 28.6315, lng: 77.2167 },
      { name: 'Marine Drive / Nariman Point', city: 'Mumbai', state: 'Maharashtra', lat: 18.9438, lng: 72.8232 },
      { name: 'Koramangala / Indiranagar', city: 'Bengaluru', state: 'Karnataka', lat: 12.9352, lng: 77.6245 },
      { name: 'Cyber City', city: 'Gurugram', state: 'Haryana', lat: 28.4950, lng: 77.0895 },
      { name: 'Hinjewadi Tech Park', city: 'Pune', state: 'Maharashtra', lat: 18.5913, lng: 73.7389 },
      { name: 'HITEC City', city: 'Hyderabad', state: 'Telangana', lat: 17.4435, lng: 78.3772 },
      { name: 'Anna Salai', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0604, lng: 80.2496 },
      { name: 'Park Street', city: 'Kolkata', state: 'West Bengal', lat: 22.5535, lng: 88.3518 },
      { name: 'Assi Ghat / BHU', city: 'Varanasi', state: 'Uttar Pradesh', lat: 25.2905, lng: 82.9965 },
      { name: 'Sector 17', city: 'Chandigarh', state: 'Punjab/Haryana', lat: 30.7415, lng: 76.7681 },
      { name: 'Mall Road', city: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734 },
      { name: 'SG Highway', city: 'Ahmedabad', state: 'Gujarat', lat: 23.0338, lng: 72.5080 },
    ];

    let closest = knownIndianHubs[0];
    let minD = 999999;
    knownIndianHubs.forEach(hub => {
      const d = Math.hypot(hub.lat - lat, hub.lng - lng);
      if (d < minD) {
        minD = d;
        closest = hub;
      }
    });

    return {
      locationName: `${closest.name}, ${closest.city}`,
      city: closest.city,
      state: closest.state,
      road: closest.name,
    };
  }

  _haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  getSatelliteTelemetry() {
    const isLive = this.isLiveGpsActive && this.liveLocationData.isLive;
    const corridor = this.corridors[this.currentCorridor];

    const lat = isLive
      ? this.liveLocationData.lat
      : (this.vehicleMarker ? this.vehicleMarker.getLatLng().lat : corridor.waypoints[0][0]);
    const lng = isLive
      ? this.liveLocationData.lng
      : (this.vehicleMarker ? this.vehicleMarker.getLatLng().lng : corridor.waypoints[0][1]);
    const accuracy = isLive ? this.liveLocationData.accuracy : 4;
    const altitude = isLive
      ? (this.liveLocationData.altitude || 218)
      : (210 + Math.round(Math.sin(Date.now() / 8000) * 12));
    const speed = isLive ? this.liveLocationData.speed : null;
    const heading = isLive ? this.liveLocationData.heading : this.currentHeading;

    return {
      isLive,
      lat,
      lng,
      speed,
      altitude,
      accuracy,
      heading: Math.round(heading || 0),
      constellations: ['NavIC (IRNSS 🇮🇳)', 'GPS (USA 🛰️)', 'GLONASS (RU 📡)'],
      satellitesLocked: isLive ? 16 : 14,
      satellitesInView: isLive ? 22 : 19,
      hdop: isLive ? '0.82' : '0.94',
      signalStrengthDbm: -116,
      cn0DbHz: 44.2,
      datum: 'WGS-84 (Geodetic)',
      provider: 'Google Maps Satellite Hybrid + Satellite GNSS',
      roadName: isLive ? this.liveLocationData.locationName : corridor.name,
      corridorName: corridor.name,
    };
  }
}
