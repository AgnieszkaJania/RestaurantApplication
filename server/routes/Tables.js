const express = require('express')
const router = express.Router()
const {validateRestaurantToken} = require('../middlewares/AuthMiddleware')
const {getTableByNameAndRestaurantId, createTable, getTableById, getTablesByRestaurantId, 
OtherTableWithGivenNameExists, updateTableName} = require('../services/Tables')
const { body, param, validationResult } = require('express-validator');

// API endpoint to add a table 

router.post("/add", validateRestaurantToken, 
body('tableName').not().isEmpty().withMessage('Enter table name!')
.isLength({max:255}).withMessage('Table name is too long. It can be 255 characters long.'),
body('quantity').not().isEmpty().withMessage('Enter number of people!')
.isNumeric().withMessage("Number of people is not a number!"),
async (req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({added: false, error: errors.array()[0].msg});
        }

        const restaurantId = req.restaurantId;
        const {tableName, quantity} = req.body;
        if(quantity > 125){
            return res.status(400).json({added:false, error: "Maximum number of people can be 125 people!"});
        }

        const table = await getTableByNameAndRestaurantId(tableName, restaurantId);
        if(table){
            return res.status(400).json({added: false, error:"Table with a given name already exists in the restaurant!"})
        }
        const newTable = {
            tableName: tableName,
            quantity: quantity,
            RestaurantId: restaurantId
        }
        const addedTable = await createTable(newTable);
        return res.status(201).json({added:true, TableId: addedTable.id});
    
    } catch (error) {
        return res.status(400).json({added:false, error:error.message});
    }
});


//API endpoint to get table info

router.get("/:tableId",validateRestaurantToken,
param('tableId').isNumeric().withMessage('Parameter must be a number!'),
async (req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({error: errors.array()[0].msg});
        }

        const tableId = req.params.tableId;
        const restaurantId = req.restaurantId;
        const table = await getTableById(tableId);
    
        if(!table || table.RestaurantId != restaurantId){
            return res.status(400).json({message:"There is no such table in the restaurant!"});
        }
        return res.status(200).json(table);

    } catch (error) {
        return res.status(400).json({error:error.message});
    }
})

// API endpoint to get tables(Stoliki tab)

router.get("/",validateRestaurantToken, async (req,res)=>{
    try {
        const restaurantId = req.restaurantId;
        const tables = await getTablesByRestaurantId(restaurantId);

        if(tables.length == 0){
            return res.status(200).json({message:"There are not any tables in the restaurant yet!"});
        }
        return res.status(200).json(tables);

    } catch (error) {
        return res.status(400).json({error:error.message});
    }
    
}) 

// API endpoint to edit table

router.put("/edit/:tableId", validateRestaurantToken, 
param('tableId').isNumeric().withMessage('Parameter must be a number!'),
body('tableName').not().isEmpty()
.withMessage('Table name can not be empty!').isLength({min:3, max:20})
.withMessage('Table name length is min 3 and max 50 characters'),
async (req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({updated: false, error: errors.array()[0].msg})
        };

        const {tableName} = req.body;
        const tableId = req.params.tableId;
        const restaurantId = req.restaurantId;

        const table = await getTableById(tableId);
        if(!table || table.RestaurantId != restaurantId){
            return res.status(400).json({updated: false, error:"There is no such table in the restaurant!"})
        }

        const otherTableExists = await OtherTableWithGivenNameExists(tableName, restaurantId, tableId);
        if(otherTableExists){
            return res.status(400).json({updated: false, error:"Table with a given name already exists in the restaurant!"})
        }
        
        await updateTableName(tableName, tableId);
        return res.status(200).json({updated:true, tableId: tableId});

    } catch (error) {
        return res.status(400).json({updated:false, error:error});
    }
})

module.exports = router