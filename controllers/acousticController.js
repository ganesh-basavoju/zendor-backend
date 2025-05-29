const Acoustic = require('../models/acousticModel');

// Create new acoustic message
exports.createAcoustic = async (req, res) => {
    try {
        const { email, phoneNumber, message } = req.body;
        console.log("Received data:", req.body);
        const newAcoustic = new Acoustic({
            email,
            phoneNumber,
            message
        });
        const savedAcoustic = await newAcoustic.save();
        res.status(201).json({
            success: true,
            data: savedAcoustic
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get all acoustic messages
exports.getAllAcoustics = async (req, res) => {
    try {
        const acoustics = await Acoustic.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: acoustics.length,
            data: acoustics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Delete acoustic message
exports.deleteAcoustic = async (req, res) => {
    try {
        const acoustic = await Acoustic.findByIdAndDelete(req.params.id);
        if (!acoustic) {
            return res.status(404).json({
                success: false,
                error: 'Message not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Message deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};