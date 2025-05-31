// const axios = require("axios");

// let shiprocketToken = null;
// let tokenExpiry = null;

// const getShiprocketToken = async () => {
//   try {
//     // Check if we have a valid token
//     if (shiprocketToken && tokenExpiry && new Date() < tokenExpiry) {
//       console.log("shopping",shiprocketToken);
//       return shiprocketToken;
//     }

//     // Token doesn't exist or expired, get new one
//     const response = await axios.post(
//       "https://apiv2.shiprocket.in/v1/external/auth/login",
//       {
//         email: "sanjeevireddy520@gmail.com",
//         password:"Lalith@19180"
//       }
//     );

//     shiprocketToken = response.data.token;
//     // Set expiry to 9 days (token valid for 10 days)
//     tokenExpiry = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
//     console.log(response,"api ship")
//     return shiprocketToken;
//   } catch (error) {
//     console.error("Error getting Shiprocket token:", error);
//     throw new Error("Failed to authenticate with Shiprocket");
//   }
// };

// module.exports = { getShiprocketToken };
const axios = require("axios");

// Token management with auto-refresh
let shiprocketToken = null;
let tokenRefreshTimer = null;

const getShiprocketToken = async () => {
  try {
    // If we have a valid token, return it immediately
    if (shiprocketToken) {
      return shiprocketToken;
    }
    
    return await refreshShiprocketToken();
  } catch (error) {
    console.error("Error in getShiprocketToken:", error);
    throw new Error("Failed to get Shiprocket token");
  }
};

const refreshShiprocketToken = async () => {
  try {
    console.log("Refreshing Shiprocket token...");
    
    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        email: "sanjeevireddy520@gmail.com",
        password: "Lalith@19180"
      },
      {
        timeout: 5000, // 5 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data.token) {
      throw new Error("No token received in response");
    }

    shiprocketToken = response.data.token;
    console.log("Successfully refreshed Shiprocket token");

    // Schedule token refresh 1 hour before expiry (Shiprocket tokens typically expire in 24 hours)
    const tokenExpiryMs = 23 * 60 * 60 * 1000; // 23 hours
    if (tokenRefreshTimer) {
      clearTimeout(tokenRefreshTimer);
    }
    tokenRefreshTimer = setTimeout(() => {
      shiprocketToken = null; // Force refresh next time
    }, tokenExpiryMs);

    return shiprocketToken;
  } catch (error) {
    console.error("Error refreshing Shiprocket token:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // Clear token on failure
    shiprocketToken = null;
    if (tokenRefreshTimer) {
      clearTimeout(tokenRefreshTimer);
    }
    
    throw new Error(`Token refresh failed: ${error.message}`);
  }
};

// Add cleanup for graceful shutdown
process.on('SIGINT', () => {
  if (tokenRefreshTimer) {
    clearTimeout(tokenRefreshTimer);
  }
});

module.exports = { 
  getShiprocketToken,
  refreshShiprocketToken // Export for manual refresh if needed
};