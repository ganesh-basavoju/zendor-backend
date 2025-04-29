const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { FetchUserProfile, changePassword,
     EditProfile, EditBillingAddress, EditShippingAddress, 
     addRecentActivity, getRecentActivity, FetchResults, getUserAddress, getAllUsers,
     addRole, updateRole, deleteRole,createMoodBoard, 
     getMoodBoard,
     deleteMoodBoard,
     updateMoodBoard,
     getCollectionOfMoodBoard,
     addCollectionToMoodBoard,
     deleteFromMoodBoardCollections} = require('../controllers/Usercontroller');
const router = express.Router();

router.get("/getUserprofile",authMiddleware,FetchUserProfile);
router.put("/change-password",authMiddleware,changePassword);

router.put("/edit-profile",authMiddleware,EditProfile);

router.put("/edit-billingAddress",authMiddleware,EditBillingAddress);

router.put("/edit-shippingAddress",authMiddleware,EditShippingAddress);

router.post("/add-recent-activity",authMiddleware,addRecentActivity);

router.get("/get-recent-activity",authMiddleware,getRecentActivity);

router.get("/search-products",FetchResults);

router.get('/getAllUsers', authMiddleware, getAllUsers);
router.post('/addRole', authMiddleware, addRole);
router.put('/update-role', authMiddleware, updateRole);
router.delete('/delete-user/:userId', authMiddleware, deleteRole);

router.get("/get-addresses",authMiddleware,getUserAddress);

router.post("/create-moodBoard",authMiddleware,createMoodBoard);

router.get("/get-moodBoard",authMiddleware,getMoodBoard);

router.delete("/delete-moodBoard",authMiddleware,deleteMoodBoard);

router.put("/update-moodBoard",authMiddleware,updateMoodBoard);

router.post("/get-moodBoard-collection",authMiddleware,getCollectionOfMoodBoard);

router.post("/add-to-moodBoard",authMiddleware,addCollectionToMoodBoard);

router.post("/delete-From-MoodBoard-Collections",authMiddleware,deleteFromMoodBoardCollections)
module.exports=router;