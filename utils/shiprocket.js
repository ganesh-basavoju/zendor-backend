const axios = require("axios");

let shiprocketToken = null;
let tokenExpiry = null;

const getShiprocketToken = async () => {
  try {
    // Check if we have a valid token
    if (shiprocketToken && tokenExpiry && new Date() < tokenExpiry) {
      console.log("shopping",shiprocketToken);
      return shiprocketToken;
    }

    // Token doesn't exist or expired, get new one
    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        email: "sanjeevireddy520@gmail.com",
        password:"Lalith@19180"
      }
    );

    shiprocketToken = response.data.token;
    // Set expiry to 9 days (token valid for 10 days)
    tokenExpiry = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
    console.log(response,"api ship")
    return shiprocketToken;
  } catch (error) {
    console.error("Error getting Shiprocket token:", error);
    throw new Error("Failed to authenticate with Shiprocket");
  }
};

module.exports = { getShiprocketToken };
