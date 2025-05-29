const express = require('express');
const router = express.Router();
const {
    createAcoustic,
    getAllAcoustics,
    deleteAcoustic
} = require('../controllers/acousticController');

// Create routes
router.post('/', createAcoustic);
router.get('/', getAllAcoustics);
router.delete('/:id', deleteAcoustic);

module.exports = router;