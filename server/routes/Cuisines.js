const express = require('express')
const router = express.Router()
const {validateRestaurantToken} = require('../middlewares/AuthMiddleware')
const { body, validationResult } = require('express-validator');
const { Op } = require("sequelize");
const { Cuisines, RestaurantsCuisines } = require('../models');

// API endpoint to add cuisine to restaurant

router.post("/add", 
body('cuisines').not().isEmpty().withMessage('No data!'),
validateRestaurantToken,
async (req,res)=>{

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).json({added: false, error: errors.array()[0].msg})
    };
    const cuisines = req.body.cuisines;

    const allCuisines = await Cuisines.findAll({
        attributes:['id']
    })
    let arrAllCuisines = []
    for(let i = 0; i < allCuisines.length; i++){
        arrAllCuisines.push(allCuisines[i].id)
    }
    let incorrectData = false
    cuisines.forEach(element => {
        if(!arrAllCuisines.includes(element)){
            incorrectData = true
        }
    });
    if(incorrectData){
        return res.status(400).json({added:false, error:"Incorrect data!"})
    }

    const cuisinesForRestaurant = await RestaurantsCuisines.findAll({
       where:{RestaurantId:req.restaurantId}
    })
    let arrCuisinesForRestaurant = []
    for(let i = 0; i<cuisinesForRestaurant.length; i++){
        arrCuisinesForRestaurant.push(cuisinesForRestaurant[i].CuisineId)
    }
    let duplicateData = false
    cuisines.forEach(element =>{
        if(arrCuisinesForRestaurant.includes(element)){
            duplicateData = true
        }
    })
    if(duplicateData){
        return res.status(400).json({added:false, error:"Incorrect data! Trying to add duplicates!"})
    }

    let cuisinesList = []
    for(let i = 0; i < cuisines.length; i++){
        let cuisineRestaurant = {CuisineId: cuisines[i],
            RestaurantId: req.restaurantId
        }
        cuisinesList.push(cuisineRestaurant)
    }

    RestaurantsCuisines.bulkCreate(cuisinesList).then(()=> {
        res.status(200).json(cuisinesList)
    }).catch((err)=>{
        if(err){
            res.status(400).json({error:err})
        }
    });

});

// API endpoint to list all cuisines available

router.get("/all",async (req,res)=>{

    const cuisines = await Cuisines.findAll();
    res.status(200).json(cuisines);
});

// API endpoint to get all cuisines for a restaurant

router.get("/", validateRestaurantToken, async (req,res)=>{

    const cuisines = await RestaurantsCuisines.findAll({
        where:{RestaurantId:req.restaurantId},
        include:[{
            model:Cuisines,
            required:true
        }]
    });
    if(cuisines.length == 0){
        return res.status(200).json({message:"Your restaurant does not have any cuisine assigned!"})
    }
    res.status(200).json(cuisines);
});

// API endpoint to delete cuisines in restaurant

router.delete("/remove",
body('cuisinesToDelete').not().isEmpty().withMessage('No data to delete!'),
validateRestaurantToken, async (req,res)=>{

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).json({deleted: false, error: errors.array()[0].msg})
    };
    const cuisinesToDelete = req.body.cuisinesToDelete;
    const cuisinesForRestaurant = await RestaurantsCuisines.findAll({
        where:{RestaurantId:req.restaurantId}
     })
     let arrCuisinesForRestaurant = []
     for(let i = 0; i<cuisinesForRestaurant.length; i++){
         arrCuisinesForRestaurant.push(cuisinesForRestaurant[i].CuisineId)
     }
     let notIncluded = false
     cuisinesToDelete.forEach(element =>{
         if(!arrCuisinesForRestaurant.includes(element)){
             notIncluded = true
         }
     })
     if(notIncluded){
         return res.status(400).json({deleted:false, error:"Incorrect data! Trying to delete cuisine not assigned to your restaurant!"})
    }
    
    RestaurantsCuisines.destroy({
        where:{[Op.and]:[
            {CuisineId:cuisinesToDelete},
            {RestaurantId: req.restaurantId}
        ]
    }
    }).then((isDeleted) =>{
        res.status(200).json({deleted:isDeleted != 0, deletedCuisines:cuisinesToDelete})
    }).catch((err)=>{
        if(err){
            res.status(400).json({error:err})
        }
    });
});


module.exports = router