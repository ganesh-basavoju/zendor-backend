
const express = require("express");
const axios = require("axios");
const { getShiprocketToken } = require("../utils/shiprocket");
const router = express.Router();

let shiprocketToken = null;
let tokenExpiry = null;

// Function to authenticate with Shiprocket
const authenticateShiprocket = async () => {
  try {
    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }
    );

    shiprocketToken = response.data.token;
    // Token expires in 24 hours - refresh after 23 hours
    tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;

    return shiprocketToken;
  } catch (error) {
    console.error(
      "Shiprocket authentication failed:",
      error.response?.data || error.message
    );
    throw new Error("Failed to authenticate with Shiprocket");
  }
};

// Middleware to ensure valid token
const ensureToken = async (req, res, next) => {
  try {
    if (!shiprocketToken || Date.now() >= tokenExpiry) {
      await authenticateShiprocket();
    }
    req.shiprocketToken = shiprocketToken;
    next();
  } catch (error) {
    res.status(401).json({
      error: "Shiprocket authentication failed",
      details: error.message,
    });
  }
};

router.get("/serviceability", ensureToken, async (req, res) => {
  try {
    const { pincode, weight = 1, cod = 0 } = req.query;

    if (!pincode) {
      return res.status(400).json({ error: "Pincode is required" });
    }

    const response = await axios.get(
      "https://apiv2.shiprocket.in/v1/external/courier/serviceability",
      {
        params: {
          pickup_postcode: 400072, // Default to your pincode
          delivery_postcode: pincode,
          weight: weight,
          cod: cod,
        },
        headers: {
          Authorization: `Bearer ${req.shiprocketToken}`,
        },
      }
    );

    console.log(response.data, "ship");

    res.json({
      available: response.data.status === 200,
      data: response.data.data,
    });
  } catch (error) {
    console.error(
      "Shiprocket serviceability error:",
      error.response?.data || error.message
    );

    if (error.response?.status === 401) {
      // Token might be expired, try to refresh
      try {
        await authenticateShiprocket();
        // Retry the request
        return router.get("/serviceability", ensureToken, async(req, res));
      } catch (refreshError) {
        return res.status(401).json({
          error: "Shiprocket authentication failed",
          details: refreshError.message,
        });
      }
    }

    res.status(500).json({
      error: "Error checking serviceability",
      details: error.response?.data || error.message,
    });
  }
});



router.get("/track", ensureToken, async (req, res) => {
  try {
    console.log("tracking called");
    const { tracking_id } = req.query;

    if (!tracking_id) {
      return res.status(400).json({
        success: false,
        message: "Tracking ID is required",
      });
    }

    const response = await axios.get(
      `https://apiv2.shiprocket.in/v1/external/courier/track/shipment/${tracking_id}`,
      {
        headers: {
          Authorization: `Bearer ${req.shiprocketToken}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    console.log(response.data);
    // Transform Shiprocket response to consistent format
    const trackingData = {
      tracking_number:
        response.data.tracking_data?.tracking_number || tracking_id,
      status: response.data.tracking_data?.status || "processing",
      estimated_delivery: response.data.tracking_data?.etd || null,
      courier_name: response.data.tracking_data?.courier_name || "No courier assigned till now",
      history: (
        response.data.tracking_data?.shipment_track_activities || []
      ).map((activity) => ({
        status: activity.status || "Status update",
        date: activity.date || new Date().toISOString(),
        location:
          [activity.city, activity.state, activity.country]
            .filter(Boolean)
            .join(", ") || "Location not available",
      })),
    };
    // const trackingData = {
    //   orderId: order?._id || null,
    //   trackingNumber: shiprocketData.shipment_track[0]?.awb_code || tracking_id,
    //   status: currentStatus,
    //   statusCode: shiprocketData.shipment_status,
    //   estimatedDelivery: shiprocketData.etd || shiprocketData.shipment_track[0]?.edd || null,
    //   courierName: shiprocketData.shipment_track[0]?.courier_name || order?.shiprocketCourierName || 'Not assigned',
    //   history: (shiprocketData.shipment_track_activities || []).map(activity => ({
    //     status: activity.status,
    //     activity: activity.activity,
    //     date: activity.date,
    //     location: activity.location,
    //     statusCode: activity['sr-status']
    //   })),
    //   trackUrl: shiprocketData.track_url || order?.shiprocketTrackingUrl,
    //   orderStatus: order?.status || 'unknown'
    // };


    res.json(trackingData);
  } catch (error) {
    console.error("Tracking error:", {
      tracking_id: req.query.tracking_id,
      error: error.response?.data || error.message,
    });

    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message || "Failed to fetch tracking details";

    res.status(status).json({
      success: false,
      message,
    });
  }
});

module.exports = router;
