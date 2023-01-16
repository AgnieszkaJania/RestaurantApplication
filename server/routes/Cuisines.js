const express = require('express');
const router = express.Router();
const { validateRestaurantToken } = require('../middlewares/AuthMiddleware');
const { body, param, validationResult } = require('express-validator');
const { getAllCuisines, getCuisinesAssignedToRestaurant, addCuisinesToRestaurant,
    getCuisinesWithNamesAssignedToRestaurant, deleteCuisinesFromRestaurant } = require('../services/Cuisines');

// API endpoint to add cuisine to restaurant

router.post("/add", 
body('cuisines').not().isEmpty().withMessage('No data!'),
validateRestaurantToken,
async (req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({added: false, error: errors.array()[0].msg});
        };

        const restaurantId = req.restaurantId;
        const cuisinesToAdd = req.body.cuisines;

        const allCuisines = await getAllCuisines();
        const allCuisinesIds = Array.from(allCuisines, x => x.id);
        const cuisinesAssignedToRestaurant = await getCuisinesAssignedToRestaurant(restaurantId);
        const cuisinesAssignedToRestaurantIds = Array.from(cuisinesAssignedToRestaurant, x => x.CuisineId);

        let notANumber = false;
        let incorrectData = false;
        let duplicateData = false;

        cuisinesToAdd.find(element => {
            if(typeof element != "number"){
                notANumber = true;
                return true;
            }
            if(!allCuisinesIds.includes(element)){
                incorrectData = true;
                return true;
            }
            if(cuisinesAssignedToRestaurantIds.includes(element)){
                duplicateData = true;
                return true;
            }
            return false;
        });
        if(notANumber){
            return res.status(400).json({added: false, error: "Incorrect data! At least one of the ids is not a number!"});
        }
        if(incorrectData){
            return res.status(400).json({added:false, error:"Incorrect data! Trying to add data which does not exist in the system!"});
        }
        if(duplicateData){
            return res.status(400).json({added:false, error:"Incorrect data! Trying to add duplicates!"});
        }

        const addedCuisinesToRestaurant = await addCuisinesToRestaurant(cuisinesToAdd, restaurantId);
        return res.status(201).json({added: true, cuisines: addedCuisinesToRestaurant});

    } catch (error) {
        return res.status(400).json({added: false, error: error.message});
    }
});

// API endpoint to list all cuisines available

router.get("/all", async (req,res)=>{
    try {
        const allCuisines = await getAllCuisines();
        return res.status(200).json(allCuisines);
    } catch (error) {
        return res.status(400).json({error: error.message});
    }
});

// API endpoint to get all cuisines for a logged in restaurant

router.get("/", validateRestaurantToken, async (req,res)=>{

    try {
        const restaurantId = req.restaurantId;
        const cuisinesAssignedToRestaurant = await getCuisinesWithNamesAssignedToRestaurant(restaurantId); 

        if(cuisinesAssignedToRestaurant.length == 0){
            return res.status(200).json({message:"Restaurant does not have any cuisine assigned!"});
        }
        return res.status(200).json(cuisinesAssignedToRestaurant);

    } catch (error) {
        return res.status(400).json({error: error.message});
    }
});

// API endpoint to get all cuisines for a  restaurant

router.get("/:restaurantId",
param('restaurantId').isNumeric().withMessage('Parameter must be a number!'),
async (req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({error: errors.array()[0].msg});
        };
        const restaurantId = req.params.restaurantId;
        const cuisinesAssignedToRestaurant = await getCuisinesWithNamesAssignedToRestaurant(restaurantId);

        if(cuisinesAssignedToRestaurant.length == 0){
            return res.status(200).json({message:"Restaurant does not have any cuisine assigned!"});
        }
        return res.status(200).json(cuisinesAssignedToRestaurant);

    } catch (error) {
        return res.status(400).json({error: error.message});
    }
});

// API endpoint to delete cuisines in restaurant

router.delete("/remove",
body('cuisinesToDelete').not().isEmpty().withMessage('No data to delete!'),
validateRestaurantToken, 
async (req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({deleted: false, error: errors.array()[0].msg});
        };

        const restaurantId = req.restaurantId;
        const cuisinesToDelete = req.body.cuisinesToDelete;
        const cuisinesAssignedToRestaurant = await getCuisinesAssignedToRestaurant(restaurantId);
        const cuisinesAssignedToRestaurantIds = Array.from(cuisinesAssignedToRestaurant, x => x.CuisineId);
        let notAssigned = false;
        let notANumber = false;

        cuisinesToDelete.find(element =>{
            if(typeof element != "number"){
                notANumber = true;
                return true;
            }
            if(!cuisinesAssignedToRestaurantIds.includes(element)){
                notAssigned = true;
                return true;
            }
            return false;
        });
        if(notANumber){
            return res.status(400).json({deleted: false, error: "Incorrect data! At least one of the ids is not a number!"});
        }
        if(notAssigned){
            return res.status(400).json({deleted: false, error:"Incorrect data! Trying to delete cuisine not assigned to restaurant!"});
        }
        const isDeleted = await deleteCuisinesFromRestaurant(cuisinesToDelete, restaurantId);
        return res.status(200).json({deleted: isDeleted, deletedCuisinesIds: cuisinesToDelete});
        
    } catch (error) {
        return res.status(400).json({deleted: false, error: error.message});
    }
});


module.exports = router