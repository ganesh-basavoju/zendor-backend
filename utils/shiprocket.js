const axios = require("axios");

let shiprocketToken = null;
let tokenExpiry = null;

const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;

const getShiprocketToken = async () => {
  const now = Date.now();

  // Check if token exists and not expired
  if (shiprocketToken && tokenExpiry && now < tokenExpiry) {
    return shiprocketToken;
  }

  try {
    const response = await axios.post("https://apiv2.shiprocket.in/v1/external/auth/login", {
      email: SHIPROCKET_EMAIL,
      password: SHIPROCKET_PASSWORD,
    });

    shiprocketToken = response.data.token;
    tokenExpiry = now + 3600 * 1000; // Set expiry 1 hour later (Shiprocket token valid for 1 hour)

    return shiprocketToken;
  } catch (error) {
    console.error("Failed to fetch Shiprocket token:", error.response?.data || error.message);
    throw new Error("Unable to authenticate with Shiprocket");
  }
};

module.exports = {
  getShiprocketToken
};
