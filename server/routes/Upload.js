const express = require('express');
const fs = require('fs');
const router = express.Router();
const { param, validationResult } = require('express-validator');
const {uploadMenus} = require('../middlewares/Menu');
const {uploadImages} = require('../middlewares/Images');
const {createImages, createMenus, getImagesByRestaurantId,
getMenusByRestaurantId, getImageById, deleteImage, getMenuById, deleteMenu} = require('../services/Upload');
const {validateRestaurantToken} = require('../middlewares/AuthMiddleware');

//API endpoint for uploading images

router.post("/images", validateRestaurantToken, (req,res) => {
    uploadImages(req, res, async function(error){
        if(error){
            return res.status(400).json({added:false, error: error.message});
        }
        try {
            const restaurantId = req.restaurantId;
            let imageList = [];
            for(let i = 0; i < req.files.length; i++){
                let image = {
                    imageName:req.files[i].filename,
                    imagePath:req.files[i].path,
                    imageOriginalName: req.files[i].originalname,
                    RestaurantId: restaurantId  
                }
                imageList.push(image);
            } 
            await createImages(imageList);
            return res.status(201).json({added:true, imageList: imageList});

        } catch (error) {
            return res.status(400).json({added:false, error: error.message});
        }
    });
});

//API endpoint for uploading menu

router.post("/menus", validateRestaurantToken, (req,res) => {
    uploadMenus(req, res, async function(error){
        if(error){
            return res.status(400).json({added: false, error: error.message});
        }
        try {
            const restaurantId = req.restaurantId;
            let menuList = [];
            for(let i = 0; i < req.files.length; i++){
                let menu = {
                    menuName:req.files[i].filename,
                    menuPath:req.files[i].path,
                    menuOriginalName: req.files[i].originalname,
                    RestaurantId: restaurantId
                }
                menuList.push(menu)
            } 
            await createMenus(menuList);
            return res.status(201).json({added:true, menuList: menuList});

        } catch (error) {
            return res.status(400).json({added:false, error: error.message});
        }
    });
});

// API endpoint to list all images for a logged in restaurant

router.get("/images", validateRestaurantToken, async(req,res)=>{
    try {
        const restaurantId = req.restaurantId;
        const images = await getImagesByRestaurantId(restaurantId);
        if(images.length == 0){
            return res.status(200).json({message:"Images not found in the restaurant!"});
        }
        return res.status(200).json({images});

    } catch (error) {
        return res.status(400).json({error:error.message});
    }
})

// API endpoint to list all menus for a logged in restaurant 

router.get("/menus", validateRestaurantToken,async(req,res)=>{
    try {
        const restaurantId = req.restaurantId;
        const menus = await getMenusByRestaurantId(restaurantId);
        if(menus.length == 0){
            return res.status(200).json({message:"Menus not found in the restaurant!"});
        }
        return res.status(200).json({menus});

    } catch (error) {
        return res.status(400).json({error:error.message});
    }
})

// API endpoint to list all images for a restaurant profile

router.get("/images/:restaurantId", 
param('restaurantId').isNumeric().withMessage('Parameter must be a number!'), async(req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({error: errors.array()[0].msg});
        }

        const restaurantId = req.params.restaurantId;
        const images = await getImagesByRestaurantId(restaurantId);
        if(images.length == 0){
            return res.status(200).json({message:"Images not found in the restaurant!"});
        }
        return res.status(200).json({images});

    } catch (error) {
        return res.status(400).json({error:error.message});
    }
})

// API endpoint to list all menus for a restaurant profile

router.get("/menus/:restaurantId",
param('restaurantId').isNumeric().withMessage('Parameter must be a number!'),
async(req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({error: errors.array()[0].msg});
        }

        const restaurantId = req.params.restaurantId;
        const menus = await getMenusByRestaurantId(restaurantId);
        if(menus.length == 0){
            return res.status(200).json({message:"Menus not found in the restaurant!"});
        }
        return res.status(200).json({menus});

    } catch (error) {
        return res.status(400).json({error:error.message});
    }
})

// API endpoint to delete an image

router.delete("/images/:imageId",validateRestaurantToken,
param('imageId').isNumeric().withMessage('Parameter must be a number!'),
async (req,res) => {
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({error: errors.array()[0].msg});
        }

        const imageId = req.params.imageId;
        const restaurantId = req.restaurantId;
        const image = await getImageById(imageId);
        if(!image || image.RestaurantId != restaurantId){
            return res.status(400).json({deleted:false, message:"Image does not exist in the restaurant!"});
        }

        const path = image.imagePath;
        fs.unlink(path, (error)=>{
            if(error){
                return res.status(400).json({deleted:false, error:error});
            }
        })
        await deleteImage(image);
        return res.status(200).json({deleted:true, image: image});

    } catch (error) {
        return res.status(400).json({deleted:false, error:error.message});
    }
});

// API endpoint to delete a menu

router.delete("/menu/:menuId",validateRestaurantToken,
param('menuId').isNumeric().withMessage('Parameter must be a number!'),
async (req,res) => {
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({error: errors.array()[0].msg});
        }

        const menuId = req.params.menuId;
        const restaurantId = req.restaurantId;
        const menu = await getMenuById(menuId);
        if(!menu || menu.RestaurantId != restaurantId){
            return res.status(400).json({deleted:false, message:"Menu does not exist in the restaurant!"});
        }

        const path = menu.menuPath;
        fs.unlink(path, (error)=>{
            if(error){
                return res.status(400).json({deleted:false, error:error});
            }
        })
        await deleteMenu(menu);
        return res.status(200).json({deleted:true, menu: menu});

    } catch (error) {
        return res.status(400).json({deleted:false, error:error.message});
    }
});

module.exports = router