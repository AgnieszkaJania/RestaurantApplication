const express = require('express')
const router = express.Router()
const {validateRestaurantToken} = require('../middlewares/AuthMiddleware')
const { body, validationResult } = require('express-validator');
const { Op } = require("sequelize");
const { Tables, Bookings } = require('../models');

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

    if(isNaN(parseInt(req.params.id))){
        return res.status(400).json({error: "Invalid parameter!"})
    }
    const id = req.params.id;
    const table = await Tables.findOne({
        where:{
            [Op.and]:[
                {id:id},
                {RestaurantId: req.restaurantId}
            ]
        }
    });
    if(!table){
        return res.status(400).json({message:"There is no such table in your restaurant!"})
    }
    res.status(200).json(table);
})

// API endpoint to get tables(Stoliki tab)

router.get("/",validateRestaurantToken, async (req,res)=>{
    const tables = await Tables.findAll({
            where: {RestaurantId:req.restaurantId}
    });
    res.json(tables);
    
}) 

// API endpoint to edit table

router.put("/edit/:tableId", validateRestaurantToken, body('tableName').not().isEmpty()
.withMessage('Table name can not be empty!').isLength({min:3, max:20}).withMessage('Table name length is min 3 and max 50 characters'),
async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).json({updated: false, error: errors.array()[0].msg})
    };
    const{tableName} = req.body;
    const table = await Tables.findOne({
        where:{id: req.params.tableId }
    });
    if(!table){
        return res.status(400).json({updated: false,error:"Nie ma takiego stolika!"})
    }
    if(table && table.RestaurantId != req.restaurantId){
        return res.status(400).json({updated: false,error:"Nie ma takiego stolika w twojej restauracji!"})
    }
    const tableInRestaurant = await Tables.findOne({
        where:{
            [Op.and]:[
                {tableName: tableName},
                {RestaurantId: req.restaurantId},
                {id:{[Op.ne]:req.params.tableId}}
            ]
        }
    });
    if(tableInRestaurant){
        return res.status(400).json({updated: false,error:"Stolik o podanej nazwie już istnieje w Twojej restauracji!"})
    }
    Tables.update({ 
        tableName:tableName
   },{
       where:{[Op.and]:[
        {id:req.params.tableId},
        {RestaurantId: req.restaurantId}
    ]}
   }).then(()=>{
       res.status(200).json({updated:true, tableId: req.params.tableId, restaurantId: req.restaurantId})
   }).catch((err)=>{
       if(err){
           res.status(400).json({updated:false, error:err})
       }
   });
})

// API endpoint to delete table
router.delete("/:tableId",validateRestaurantToken, async (req,res)=>{
    const table = await Tables.findOne({
        where:{id: req.params.tableId }
    });
    if(!table){
        return res.status(400).json({updated: false,error:"Nie ma takiego stolika!"})
    }
    if(table && table.RestaurantId != req.restaurantId){
        return res.status(400).json({updated: false,error:"Nie ma takiego stolika w twojej restauracji!"})
    }
    const booking = await Bookings.findOne({
        where:{TableId:req.params.tableId}
    })
    if(booking){
        return res.status(200).json({deleted:false, message:"Nie można usunąć stolika, który posiada przypisane rezerwacje!"})
    }
    table.destroy().then((deleted)=>{
        res.status(200).json({deleted:deleted != 0, tableId: table.id})
    }).catch((err)=>{
        if(err){
            res.status(400).json({error:err})
        }
    });

}) 

module.exports = router