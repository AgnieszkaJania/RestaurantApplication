const express = require('express');
const fs = require('fs');
const router = express.Router();
const {uploadMenu} = require("../middlewares/Menu");
const {uploadImages} = require("../middlewares/Images");
const { Images } = require('../models');
const { Menus } = require('../models');
const {validateRestaurantToken, validateToken} = require('../middlewares/AuthMiddleware')

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

// API endpoint to delete an image

router.delete("/images/:id",validateRestaurantToken,async (req,res) => {
    const image = await Images.findOne({
        where:{id:req.params.id}
    })
    if(!image){
        return res.status(400).json({deleted:false, message:"Image does not exist!"});
    }
    if(image && image.RestaurantId != req.restaurantId){
        return res.status(400).json({deleted:false, message:"Image does not exist in your restaurant!"});
    }
    const path = image.imagePath
    fs.unlink(path,(err)=>{
        if(err){
            return res.status(400).json({deleted:false, error:err})
        }
    })
    Images.destroy({ 
       where:{
            id: req.params.id
        }
    }).then(()=>{
        res.status(200).json({deleted:true, imageId:req.params.id})
    }).catch((err)=>{
        if(err){
            res.status(400).json({deleted:false, error:err})
        }
    })
});

// API endpoint to delete a menu

router.delete("/menu/:id",validateRestaurantToken,async (req,res) => {
    const menu = await Menus.findOne({
        where:{id:req.params.id}
    })
    if(!menu){
        return res.status(400).json({deleted:false, message:"Menu does not exist!"});
    }
    if(menu && menu.RestaurantId != req.restaurantId){
        return res.status(400).json({deleted:false, message:"Menu does not exist in your restaurant!"});
    }
    const path = menu.menuPath
    fs.unlink(path,(err)=>{
        if(err){
            return res.status(400).json({deleted:false, error:err})
        }
    })
    Menus.destroy({ 
       where:{
            id: req.params.id
        }
    }).then(()=>{
        res.status(200).json({deleted:true, menuId:req.params.id})
    }).catch((err)=>{
        if(err){
            res.status(400).json({deleted:false, error:err})
        }
    })
});


 

module.exports = router