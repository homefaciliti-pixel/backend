const { countriesList } = require('../config/constants');
const { translate } = require('../helpers/translate');
const { getMysqlPool, getMysqlReady, getDbMode } = require('../config/db');

const STATES_CITIES = {
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik"],
  "Delhi": ["New Delhi", "Dwarka", "Rohini", "Vasant Kunj"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubli", "Mangaluru"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Trichy"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Agra", "Varanasi"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
  "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Asansol"]
};

const getCountries = (req, res) => {
  const { search } = req.query;
  if (search) {
    const query = search.toLowerCase();
    const filtered = countriesList.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.code.toLowerCase().includes(query) ||
      c.dialCode.includes(query) ||
      c.dial_code.includes(query)
    );
    return res.json({
      success: true,
      countries: filtered,
      message: `Countries matching "${search}" retrieved successfully`
    });
  }
  res.json({
    success: true,
    countries: countriesList,
    message: "Countries retrieved successfully"
  });
};
const getStates = async (req, res) => {
  if (getDbMode() === "mysql" && getMysqlReady()) {
    try {
      const [rows] = await getMysqlPool().query("SELECT name FROM states WHERE status = 1 AND deleted_at IS NULL");
      const [nodeRows] = await getMysqlPool().query("SELECT name FROM node_states WHERE status = 1");
      const allStatesSet = new Set([
        ...rows.map(r => r.name),
        ...nodeRows.map(r => r.name)
      ]);
      const states = Array.from(allStatesSet).sort();
      return res.json({
        success: true,
        states: states,
        message: "States retrieved successfully from database"
      });
    } catch (err) {
      console.error("Fetch states from MySQL failed:", err);
    }
  }
  
  const states = Object.keys(STATES_CITIES);
  res.json({
    success: true,
    states: states,
    message: "States retrieved successfully"
  });
};
const getCities = async (req, res) => {
  const { state } = req.query;
  
  if (getDbMode() === "mysql" && getMysqlReady()) {
    try {
      let query = "SELECT c.name FROM cities c WHERE c.status = 1 AND c.deleted_at IS NULL";
      const params = [];
      
      let nodeQuery = "SELECT c.cityName as name FROM node_cities c WHERE c.status = 1";
      const nodeParams = [];

      if (state) {
        const [stateRows] = await getMysqlPool().query("SELECT id FROM states WHERE name = ? AND deleted_at IS NULL LIMIT 1", [state]);
        if (stateRows.length > 0) {
          query += " AND c.state_id = ?";
          params.push(stateRows[0].id);
        } else {
          // If state is not found in standard table, Laravel query should return empty
          query += " AND c.state_id = -1";
        }
        
        nodeQuery += " AND LOWER(c.stateName) = ?";
        nodeParams.push(state.toLowerCase());
      }
      
      const [rows] = await getMysqlPool().query(query, params);
      const [nodeRows] = await getMysqlPool().query(nodeQuery, nodeParams);
      
      const allCitiesSet = new Set([
        ...rows.map(r => r.name),
        ...nodeRows.map(r => r.name)
      ]);
      const cities = Array.from(allCitiesSet).sort();

      return res.json({
        success: true,
        cities: cities,
        message: state ? `Cities for state ${state} retrieved successfully` : "All cities retrieved successfully"
      });
    } catch (err) {
      console.error("Fetch cities from MySQL failed:", err);
    }
  }
  
  if (state) {
    const cities = STATES_CITIES[state];
    if (!cities) {
      return res.status(404).json({
        success: false,
        error: "State not found",
        message: "State not found"
      });
    }
    return res.json({
      success: true,
      cities: cities,
      message: `Cities for state ${state} retrieved successfully`
    });
  }
  
  const allCities = Object.values(STATES_CITIES).flat();
  res.json({
    success: true,
    cities: allCities,
    message: "All cities retrieved successfully"
  });
};
const getLocalities = async (req, res) => {
  const { city, state } = req.query;
  
  if (getDbMode() === "mysql" && getMysqlReady()) {
    try {
      let query = "SELECT l.name FROM localities l WHERE l.status = 1 AND l.deleted_at IS NULL";
      const params = [];
      
      let nodeQuery = "SELECT l.localityName as name FROM node_localities l WHERE l.status = 1";
      const nodeParams = [];

      if (city) {
        const [cityRows] = await getMysqlPool().query("SELECT id FROM cities WHERE name = ? AND deleted_at IS NULL LIMIT 1", [city]);
        if (cityRows.length > 0) {
          query += " AND l.city_id = ?";
          params.push(cityRows[0].id);
        } else {
          query += " AND l.city_id = -1";
        }
        
        nodeQuery += " AND LOWER(l.cityName) = ?";
        nodeParams.push(city.toLowerCase());
      } else if (state) {
        const [stateRows] = await getMysqlPool().query("SELECT id FROM states WHERE name = ? AND deleted_at IS NULL LIMIT 1", [state]);
        if (stateRows.length > 0) {
          query += " AND l.state_id = ?";
          params.push(stateRows[0].id);
        } else {
          query += " AND l.state_id = -1";
        }
        
        nodeQuery += " AND LOWER(l.stateName) = ?";
        nodeParams.push(state.toLowerCase());
      }
      
      const [rows] = await getMysqlPool().query(query, params);
      const [nodeRows] = await getMysqlPool().query(nodeQuery, nodeParams);
      
      const allLocalitiesSet = new Set([
        ...rows.map(r => r.name),
        ...nodeRows.map(r => r.name)
      ]);
      const names = Array.from(allLocalitiesSet).sort();

      return res.json({
        success: true,
        localities: names,
        message: "Localities retrieved successfully"
      });
    } catch (err) {
      console.error("Fetch localities from MySQL failed:", err);
    }
  }
  
  const fallbackLocalities = [
    "Pratap Nagar", "Mansarovar", "Adarsh Nagar", "Raja Park", "Jagat Pura",
    "Andheri East", "Andheri West", "Bandra", "Koramangala", "Indiranagar"
  ];
  res.json({
    success: true,
    localities: fallbackLocalities,
    message: "Localities retrieved successfully (JSON fallback)"
  });
};

module.exports = {
  getCountries,
  getStates,
  getCities,
  getLocalities
};
