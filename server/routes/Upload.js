const express = require('express');
const router = express.Router();
const {uploadMenu} = require("../middlewares/Menu");
const {uploadImages} = require("../middlewares/Images");
const { Images } = require('../models');
const { Menus } = require('../models');

//API endpoint for uploading images

router.post("/images/:id", async (req,res) => {
    let images = []
    uploadImages(req,res,function(err){
        if(err){
            return res.status(400).send({error: err.message})
        }
        for(let i = 0; i < req.files.length; i++){
            let image = {imageName:req.files[i].filename,
                imagePath:req.files[i].path,
                imageOriginalName: req.files[i].originalname,
                RestaurantId: req.params.id
            }
            images.push(image)
        } 
        Images.bulkCreate(images).then(()=> {
            res.status(200).json(images)
        }).catch((err)=>{
            if(err){
                res.status(400).json({error:err})
            }
        });
    });

});

//API endpoint for uploading menu

router.post("/menu/:id", async (req,res) => {
    let menus = []
    uploadMenu(req,res,function(err){
        if(err){
          return res.status(400).json({error: err.message})
        }
        for(let i = 0; i < req.files.length; i++){
            let menu = {menuName:req.files[i].filename,
                menuPath:req.files[i].path,
                menuOriginalName: req.files[i].originalname,
                RestaurantId: req.params.id
            }
            menus.push(menu)
        } 
        Menus.bulkCreate(menus).then(()=> {
            res.status(200).json(menus)
        }).catch((err)=>{
            if(err){
                res.status(400).json({error:err})
            }
        });
  });

});
 

module.exports = router