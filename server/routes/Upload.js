const express = require('express');
const fs = require('fs');
const router = express.Router();
const {uploadMenu} = require("../middlewares/Menu");
const {uploadImages} = require("../middlewares/Images");
const { Images } = require('../models');
const { Menus } = require('../models');
const {validateRestaurantToken} = require('../middlewares/AuthMiddleware')

//API endpoint for uploading images

router.post("/images",validateRestaurantToken, (req,res) => {
    try {
        let images = []
        uploadImages(req, res, async function(err){
            if(err){
                return res.status(400).json({added:false, error: err.message})
            }
            for(let i = 0; i < req.files.length; i++){
                let image = {imageName:req.files[i].filename,
                    imagePath:req.files[i].path,
                    imageOriginalName: req.files[i].originalname,
                    RestaurantId: req.restaurantId
                }
                images.push(image)
            } 
            await Images.bulkCreate(images)
            res.status(200).json({added:true, images: images})
        });
    } catch (error) {
        return res.status(400).json({added:false, error: error.message})
    }
});

//API endpoint for uploading menu

router.post("/menu", validateRestaurantToken, (req,res) => {
    try {
        let menus = []
        uploadMenu(req, res, async function(err){
            if(err){
                return res.status(400).json({added: false, error: err.message})
            }
            for(let i = 0; i < req.files.length; i++){
                let menu = {menuName:req.files[i].filename,
                    menuPath:req.files[i].path,
                    menuOriginalName: req.files[i].originalname,
                    RestaurantId: req.restaurantId
                }
                menus.push(menu)
            } 
            await Menus.bulkCreate(menus)
            res.status(200).json({added:true, menus:menus})
        });
    } catch (error) {
        return res.status(400).json({added:false, error: error.message})
    }
});

// API endpoint to delete an image

router.delete("/images/:id",validateRestaurantToken,async (req,res) => {
    try {
        const image = await Images.findOne({
            where:{id:req.params.id}
        })
        if(!image || image.RestaurantId != req.restaurantId){
            return res.status(400).json({deleted:false, message:"Image does not exist in your restaurant!"});
        }
        const path = image.imagePath
        fs.unlink(path,(err)=>{
            if(err){
                return res.status(400).json({deleted:false, error:err})
            }
        })
        await Images.destroy({ 
           where:{
                id: image.id
            }
        })
        res.status(200).json({deleted:true, image: image})
    } catch (error) {
        res.status(400).json({deleted:false, error:error.message})
    }
});

// API endpoint to delete a menu

router.delete("/menu/:id",validateRestaurantToken,async (req,res) => {
    try {
        const menu = await Menus.findOne({
            where:{id:req.params.id}
        })
        if(!menu || menu.RestaurantId != req.restaurantId){
            return res.status(400).json({deleted:false, message:"Menu does not exist in your restaurant!"});
        }
        const path = menu.menuPath
        fs.unlink(path,(err)=>{
            if(err){
                return res.status(400).json({deleted:false, error:err})
            }
        })
        await Menus.destroy({ 
           where:{
                id: menu.id
            }
        })
        res.status(200).json({deleted:true, menu: menu})
    } catch (error) {
        res.status(400).json({deleted:false, error:error.message})
    }
});

module.exports = router