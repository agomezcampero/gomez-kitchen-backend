const express = require("express");
const error = require("../middleware/error");
const users = require("../routes/users");
const auth = require("../routes/auth");
const ingredients = require("../routes/ingredients");
const recipes = require("../routes/recipes");
const calculate = require("../routes/calculate");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, x-auth-token"
    );
    res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE");
    next();
  });
  app.use(express.json());
  app.use("/api/users", users);
  app.use("/api/auth", auth);
  app.use("/api/ingredients", ingredients);
  app.use("/api/recipes", recipes);
  app.use("/api/calculate", calculate);

  app.use(error);
};
