const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { FetchUserProfile, changePassword, EditProfile, EditBillingAddress, EditShippingAddress, addRecentActivity, getRecentActivity } = require('../controllers/Usercontroller');
const router = express.Router();

router.get("/getUserprofile",authMiddleware,FetchUserProfile);
router.put("/change-password",authMiddleware,changePassword);

router.put("/edit-profile",authMiddleware,EditProfile);

router.put("/edit-billingAddress",authMiddleware,EditBillingAddress);

router.put("/edit-billingAddress",authMiddleware,EditShippingAddress);

router.post("add-recent-activity",authMiddleware,addRecentActivity);

router.get("/get-recent-activity",authMiddleware,getRecentActivity);



module.exports=router;