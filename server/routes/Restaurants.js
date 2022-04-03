const express = require('express');
const router = express.Router();
const uploadImages = require('../middlewares/Images');
const uploadMenu = require('../middlewares/Menu');


//API endpoint for uploading images

router.post("/upload/images", (req,res) => {
    uploadImages(req,res,function(err){
        if(err){
            return res.status(400).send({error: err.message})
        }
        res.status(200).json(req.files)
    });
   
});

//API endpoint for uploading menu

router.post("/upload/menu", (req,res) => {
  uploadMenu(req,res,function(err){
      if(err){
          return res.status(400).send({error: err.message})
      }
      res.status(200).json(req.files)
  });
 
});

// API endpoint 

router.get("/", async (req,res)=>{
  res.json("hello")
});

module.exports = router

