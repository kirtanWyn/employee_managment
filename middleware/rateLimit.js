const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
// return req.user ? req.user.id : req.ip; // If user is authenticated, use their ID, else fallback to IP
exports.adminLogin = () => {
    return rateLimit({
        windowMs: 1 * 60 * 1000, 
        max: 10, 
        message: "Too many requests from this IP, please try again after 1 miniute.",
        //   keyGenerator: (req) => {
        //     return req.body.email;
        // }
    });
};
