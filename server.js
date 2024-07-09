// server.js 
  
const express = require("express"); 
const app = express(); 
  
// A simple get greet method 
app.get("/greet", (req, res) => { 
    // get the passed query 
    const { name } = req.query; 
    res.send({ msg: `Welcome ${name}!` }); 
}); 
  
// export the app for vercel serverless functions 
module.exports = app;