const express = require("express");
const path = require("path");

module.exports = function setupProxy(app) {
  app.use(
    "/images",
    express.static(path.resolve(__dirname, "../public/images"))
  );
};
