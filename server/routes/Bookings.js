const express = require('express')
const router = express.Router()
const {validateRestaurantToken, validateToken} = require('../middlewares/AuthMiddleware')
const { body, validationResult } = require('express-validator');
const { Op } = require("sequelize");
const { Bookings, Statuses, Tables, Restaurants} = require('../models');


// API endpoint to get all booking times for a restaurant(main restaurant page)

router.get("/all",validateRestaurantToken, async (req,res)=>{
    const bookings = await Bookings.findAll({
        include:[
            {
                model: Tables,
                where:{
                    RestaurantId:req.restaurantId
                }
            },
            {
                model:Statuses
            }
        ]
    });
    res.status(200).json(bookings);
    
}) 

// API endpoint to get user's reservations

router.get("/user",validateToken, async (req,res)=>{

    const bookedStatusId = await Statuses.findOne({
        attributes:['id'],
        where:{status:"Booked"}
    })
    const bookings = await Bookings.findAll({
        where:{
            [Op.and]:[
                {UserId:req.userId},
                {StatusId:bookedStatusId.id}
            ]
        },
        attributes:['id','startTime','endTime'],
        include:[{
            model:Tables,
            attributes:['id','quantity'],
            include:[{
                model:Restaurants,
                attributes:['id','restaurantName']
            }]
        }]    
    });
    if(bookings.length == 0){
        return res.status(400).json({message: "User does not have any reservations yet!"})
    }
    res.status(200).json(bookings);
    
}) 

// API endpoint to get booking times for a table

router.get("/:id",validateRestaurantToken, async (req,res)=>{
    const booking = await Bookings.findAll({
            where: {TableId:req.params.id}
    });
    res.json(booking);
    
}) 

// API endpoint to add booking time for a table

router.post("/add/:tableId",validateRestaurantToken, body('startTime').not().isEmpty().withMessage('You must enter when your reservation time begins!')
.isISO8601({ strict: false, strictSeparator: false }).withMessage("Incorrect date format!"),
body('endTime').not().isEmpty().withMessage('You must enter when your reservation time ends!')
.isISO8601({ strict: false, strictSeparator: false }).withMessage("Incorrect date format!"),
async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).json({added: false, error: errors.array()[0].msg})
    };

    const{startTime,endTime} = req.body;

    const table = await Tables.findOne({
        where:{
            [Op.and]:[
                {id: req.params.tableId},
                {RestaurantId: req.restaurantId}
            ]
        }
    });
    if(!table){
        return res.status(400).json({added: false,error:"Stolik dla którego chcesz dodać rezerwacje nie istnieje w Twojej restauracji!"})
    }

    const bookingsForTable = await Bookings.findAll({
        where:{TableId:req.params.tableId}
    })
    let startDate = new Date(startTime)
    let endDate = new Date(endTime)
    console.log(startDate)
    if(startDate >= endDate){
        return res.status(400).json({added:false, error: "Incorrect booking time!"})
    }
    let overlappingPeriods = false
    bookingsForTable.forEach((booking) => {
        if(startDate <= booking.startTime && endDate >= booking.startTime) {
            overlappingPeriods = true
        }
        if(startDate > booking.startTime && endDate < booking.endTime){
            overlappingPeriods = true
        }
        if(startDate <= booking.endTime && endDate >= booking.endTime){
            overlappingPeriods = true
        }
    });
    if(overlappingPeriods){
        return res.status(400).json({added:false, error: "Overlapping booking time!"})
    }
    
    const defaultStatusId = await Statuses.findOne({
        attributes:['id'],
        where:{status:"Available"}
    })
    Bookings.create({
        startTime: startTime,
        endTime: endTime,
        TableId: req.params.tableId,
        StatusId:defaultStatusId.id
    }).then((result)=>{
        res.status(200).json({added:true, BookingId: result.id})
    }).catch((err)=>{
        if(err){
            res.status(400).json({added:false, error:err})
        }
    }); 
    
});

// API endpoint to book a table

router.put("/book/:bookingId",validateToken,
async (req,res)=>{
    
    const booking = await Bookings.findOne({
        where:{id:req.params.bookingId},
        include:[
            {
                model: Statuses
            }
        ]
    });

    if(!booking){
        return res.status(400).json({booked: false,error:"Nie ma takiego terminu rezerwacji stolika!"})
    }
    if(booking.Status.status !== "Available"){
        return res.status(400).json({booked:false, error:"Booking time is not available!"})
    }
    const bookedStatusId = await Statuses.findOne({
        attributes:['id'],
        where:{status:"Booked"}
    })
    Bookings.update({ 
        StatusId:bookedStatusId.id,
        UserId: req.userId
    },{
        where:{
            id: req.params.bookingId
        }
    }).then(()=>{
        res.status(200).json({booked:true, UserId: req.userId})
    }).catch((err)=>{
        if(err){
            res.status(400).json({booked:false, error:err})
        }
    });
}); 

module.exports = router