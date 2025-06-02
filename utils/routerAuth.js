const { routesConfig } = require("./routeConfig");
const express = require('express');
const router = express.Router();
// const express = require("express");
// const router = express();
const methodNotAllowed = (allowedMethods) => (req, res, next) => {
    if (!allowedMethods.includes(req.method)) {
        res.status(405).json({ Status: 0, message: "The method is not allowed for the requested URl" });
    } else {
        next();
    }
};

// Register routes with method checking
routesConfig.forEach((route) => {
    const { path, methods } = route;

    // routerly methodNotAllowed middleware to all routes
    router.all(path, methodNotAllowed(methods));

    // Define route handlers
    if (methods.includes("GET")) {
        router.get(path, (req, res) => res.send(`${path} GET response`));
    }
    if (methods.includes("POST")) {
        router.post(path, (req, res) => res.send(`${path} POST response`));
    }
    if (methods.includes("PUT")) {
        router.put(path, (req, res) => res.send(`${path} PUT response`));
    }
    if (methods.includes("DELETE")) {
        router.delete(path, (req, res) => res.send(`${path} DELETE response`));
    }
    if (methods.includes("PATCH")) {
        router.delete(path, (req, res) => res.send(`${path} PATCH response`));
    }
    if (methods.includes("HEAD")) {
        router.delete(path, (req, res) => res.send(`${path} HEAD response`));
    }
    if (methods.includes("OPTIONS")) {
        router.delete(path, (req, res) => res.send(`${path} OPTIONS response`));
    }
});

module.exports = router;