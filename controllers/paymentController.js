const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID ||"rzp_test_qtfHIjOyxlQnr5",
  key_secret:process.env.RAZORPAY_KEY_SECRET||"KwAhGkK6ROj2UJqdF6OsaCyR",
});

const generateRandomReceipt = () => {
  return (
    "ORD-" +
    Math.random().toString(36).substring(2, 10).toUpperCase() +
    Date.now()
  );
};

exports.createOrder = async (req, res) => {
  try {
    const { amount, currency = "INR" } = req.body;

    const options = {
      amount: amount * 100,
      currency,
      receipt: generateRandomReceipt,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Payment failed", error });
  }
};

//   const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//   const body = razorpay_order_id + "|" + razorpay_payment_id;
//   const expectedSignature = crypto
//     .createHmac("sha256", process.env.RAZORPAY_SECRET)
//     .update(body.toString())
//     .digest("hex");

//   if (expectedSignature === razorpay_signature) {
//     return res.status(200).json({ success: true, message: "Payment verified successfully" });
//   } else {
//     return res.status(400).json({ success: false, message: "Payment verification failed" });
//   }
// };

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET
// });

// exports.verifyPayment = async (req, res) => {
//   try {
//     const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
//       req.body;

//     // 1. In test mode, we might only get payment_id
//     if (!razorpay_payment_id) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment ID is required",
//       });
//     }

//     // 2. Fetch payment details from Razorpay API
//     const payment = await razorpay.payments.fetch(razorpay_payment_id);
//     console.log(payment, "ptr");
//     // 3. Verify payment status
//     if (payment.status !== "authorized'") {
//       return res.status(400).json({
//         success: false,
//         message: `Payment not captured. Status: ${payment.status}`,
//       });
//     }

//     // 4. If we have all three parameters, verify signature
//     if (razorpay_order_id && razorpay_signature) {
//       const generated_signature = crypto
//         .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//         .update(razorpay_order_id + "|" + razorpay_payment_id)
//         .digest("hex");

//       if (generated_signature !== razorpay_signature) {
//         return res.status(400).json({
//           success: false,
//           message: "Payment verification failed - Invalid signature",
//         });
//       }
//     }

//     // 5. Payment verified - Update your database
//     // Example: Update order status, create transaction record, etc.
//     // const order = await Order.findOneAndUpdate(
//     //   { paymentId: razorpay_payment_id },
//     //   {
//     //     paymentStatus: 'completed',
//     //     $set: {
//     //       'paymentDetails': payment
//     //     }
//     //   },
//     //   { new: true }
//     // );

//     // if (!order) {
//     //   return res.status(404).json({
//     //     success: false,
//     //     message: "No order found for this payment"
//     //   });
//     // }

//     return res.status(200).json({
//       success: true,
//       message: "Payment verified successfully",
//       paymentId: razorpay_payment_id,
//       orderId: razorpay_order_id || payment.order_id, // Use payment.order_id if order_id not provided
//       orderStatus: order.status,
//     });
//   } catch (error) {
//     console.error("Payment verification error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error verifying payment",
//       error: error.message,
//     });
//   }
// };
exports.verifyPayment = async (req, res) => {
    try {
      const { razorpay_payment_id } = req.body;
      
      // 1. Fetch payment details
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
  
      // 2. Handle authorized payments
      if (payment.status === 'authorized') {
        const captureResponse = await razorpay.payments.capture(
          razorpay_payment_id,
          payment.amount
        );
        
        if (captureResponse.status !== 'captured') {
          return res.status(400).json({
            success: false,
            message: `Payment capture failed. Status: ${captureResponse.status}`
          });
        }
      }
      // 3. Verify captured payments
      else if (payment.status !== 'captured') {
        return res.status(400).json({
          success: false,
          message: `Payment not successful. Status: ${payment.status}`
        });
      }
  
      // 4. Payment verified - Update your database
    //   const order = await Order.findOneAndUpdate(
    //     { paymentId: razorpay_payment_id },
    //     { 
    //       paymentStatus: 'completed',
    //       $set: {
    //         'paymentDetails': payment
    //       }
    //     },
    //     { new: true }
    //   );
  
      return res.status(200).json({
        success: true,
        message: "Payment verified and captured successfully",
        paymentId: razorpay_payment_id,
        amount: payment.amount / 100 // Convert paise to rupees
      });
  
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({
        success: false,
        message: "Error verifying payment",
        error: error.message
      });
    }
  };
