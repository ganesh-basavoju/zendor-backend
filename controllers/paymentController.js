const Razorpay = require("razorpay");
const crypto = require("crypto");

exports.createOrder = async (req, res) => {
  try {
    const { amount, currency = "INR" } = req.body;

    const options = {
      amount: amount, // amount is already in paise from frontend
      currency,
      receipt: "ord_" + Math.random().toString(36).substring(2, 15),
      payment_capture: 1, // Auto capture payment
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_qtfHIjOyxlQnr5",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "KwAhGkK6ROj2UJqdF6OsaCyR",
});

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      req.body;
    console.log("rqzorpay", req.body);
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay payment details",
      });
    }

    // Step 1: Verify the signature
    const generatedSignature = crypto
      .createHmac("sha256", razorpay.key_secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed: invalid signature",
      });
    }

    // Step 2: Fetch and confirm payment status
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.status === "authorized") {
      // Try to capture the payment
      const captured = await razorpay.payments.capture(
        razorpay_payment_id,
        payment.amount
      );

      if (captured.status !== "captured") {
        return res.status(400).json({
          success: false,
          message: `Payment capture failed. Status: ${captured.status}`,
        });
      }
    } else if (payment.status !== "captured") {
      return res.status(400).json({
        success: false,
        message: `Payment not captured. Status: ${payment.status}`,
      });
    }

    // Step 3: Success
    return res.status(200).json({
      success: true,
      message: "Payment verified and captured successfully",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: payment.status,
    });
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during payment verification",
      error: error.message,
    });
  }
};
