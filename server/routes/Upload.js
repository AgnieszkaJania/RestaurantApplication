const express = require('express');
const router = express.Router();
const {uploadMenu} = require("../middlewares/Menu");
const {uploadImages} = require("../middlewares/Images");
const{ Images } = require('../models')

//API endpoint for uploading images

router.post("/images", (req,res) => {
    uploadImages(req,res,function(err){
        if(err){
            return res.status(400).send({error: err.message})
        }
        res.status(200).json(req.files)
    });
   
});

//API endpoint for uploading menu

router.post("/menu/", async (req,res) => {
  uploadMenu(req,res,function(err){
      if(err){
          return res.status(400).json({error: err.message})
      }
      res.status(200).json(req.files)
  });
});
 

module.exports = router