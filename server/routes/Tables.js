const express = require('express')
const router = express.Router()
const {validateRestaurantToken} = require('../middlewares/AuthMiddleware')
const { body, validationResult } = require('express-validator');
const { Op } = require("sequelize");
const { Tables } = require('../models');

// API endpoint to add a table 

router.post("/add", validateRestaurantToken, body('tableName').not().isEmpty().withMessage('Enter table name!'),
body('quantity').not().isEmpty().withMessage('Enter number of people!').isNumeric().withMessage("Not a number!"),
async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).json({added: false, error: errors.array()[0].msg})
    };
    const{tableName,quantity} = req.body;
    const table = await Tables.findOne({
        where:{
            [Op.and]:[
                {tableName: tableName},
                {RestaurantId: req.restaurantId}
            ]
        }
    });
    if(table){
        return res.status(400).json({added: false,error:"Stolik o podanej nazwie już istnieje w Twojej restauracji!"})
    }
    Tables.create({
        tableName: tableName,
        quantity: quantity,
        RestaurantId: req.restaurantId
    }).then((result)=>{
        res.status(200).json({added:true, TableId: result.id})
    }).catch((err)=>{
        if(err){
            res.status(400).json({added:false, error:err})
        }
    });  
});


//API endpoint to get table info

router.get("/:id",validateRestaurantToken,async (req,res)=>{
    const id = req.params.id;
    const table = await Tables.findOne({
        where: {id:id}
    });
    res.json(table);
})

// API endpoint to get tables(Stoliki tab)

router.get("/",validateRestaurantToken, async (req,res)=>{
    const tables = await Tables.findAll({
            where: {RestaurantId:req.restaurantId}
    });
    res.json(tables);
    
}) 

module.exports = router