const express = require('express')
const router = express.Router()
const {validateRestaurantToken, validateToken} = require('../middlewares/AuthMiddleware')
const { body, param, query, validationResult } = require('express-validator');
const { Op, UnknownConstraintError } = require("sequelize");
const { Booking, Status, Table, Restaurant, Users, RestaurantsCuisines} = require('../models');
const {sendEmail} = require('../utils/email/sendMail')
const {getPIN} = require('../functions/getPIN')
const { getDisabledStatusId, getDeletedStatusId, getAvailableStatusId } = require('../services/Statuses')
const {getBookingTableRestaurantDetailsByBookingId, getBookingDetailsByBookingId, 
    getBookingsByTableId, createBookingTime, getBookingsDetailsByTableId, 
    deleteBookingTime, reserveBookingTime} = require('../services/Bookings')
const {getTableById} = require('../services/Tables');
// API endpoint to filter available tables on Main Page

router.get("/filter",async(req,res)=>{
    const{restaurantName, start, end, quantity,cuisine} = req.body
    let query = {}
    query.restaurant = {}
    query.booking = {}
    query.restaurant.where = {}
    query.booking.where = {}
    query.table = {}
    query.table.where = {}
    query.cuisine = {}
    query.cuisine.where= {}

    const bookedStatusId = await Statuses.findOne({
        attributes:['id'],
        where:{status:"Available"}
    })
    query.booking.where.StatusId = bookedStatusId.id

    if(restaurantName){
        query.restaurant.where.restaurantName = restaurantName
    }
    if(quantity && quantity.length > 0){
        query.table.where.quantity = {[Op.in] : quantity}
    }
    if(cuisine && cuisine.length > 0){
        query.cuisine.where.CuisineId = {[Op.in] : cuisine}
    }
    if(start && !end){
        query.booking.where.startTime = {[Op.gte] : start}
    }
    if(end && !start){
        query.booking.where.startTime = {[Op.lte] : end}
    }
    if(start && end){
        query.booking.where.startTime = {[Op.and]:{
            [Op.gte]: start,
            [Op.lte]: end
        }}
    }
    const bookings = await Bookings.findAll({
        where:query.booking.where,
        include:[
            {
                model: Tables,
                required:true,
                where: query.table.where,
                include:[{
                    model:Restaurants,  
                    attributes:{exclude:['id','ownerFirstName','ownerLastName','ownerPassword','facebookLink','instagramLink']},
                    where: query.restaurant.where,
                    include:[{
                        model:RestaurantsCuisines,
                        where: query.cuisine.where
                    }]
                }]
            }
        ]
    })
    res.status(200).json(bookings)
})

// API endpoint to get booking time details(reservation confirmation data)

router.get("/confirm/:bookingId",validateToken, async (req,res)=>{

    const bookedStatusId = await Statuses.findOne({
        attributes:['id'],
        where:{status:"Booked"}
    })
    const booking = await Bookings.findOne({
        where:{[Op.and]:[
            {id:req.params.bookingId},
            {UserId:req.userId},
            {StatusId:bookedStatusId.id}
        ]},
        attributes:['id','startTime','endTime'],
        include:[
            {
                model: Tables,
                include:[{
                    model:Restaurants,  
                    attributes:['id','restaurantName']
                }]
            }
        ]
    });
    if(!booking){
        return res.status(400).json({message: "Booking time not found!"})
    }
    res.status(200).json(booking);
    
})

// API endpoint to get booking time details(main restaurant page)

router.get("/details/:bookingId",validateRestaurantToken, async (req,res)=>{
    const booking = await Bookings.findOne({
        where:{id:req.params.bookingId},
        include:[
            {
                model: Tables,
                required:true,
                where:{
                    RestaurantId:req.restaurantId,
                }
            },
            {
                model:Statuses,
                required:true,
                where:{
                    status:{[Op.ne]:"Deleted"}
                }
            },
            {
                model: Users,
                attributes:['firstName','lastName','phoneNumber','email']
            }
        ]
    });
    if(!booking){
        return res.status(400).json({message: "There is no such reservation time in your restaurant!"})
    }
    res.status(200).json(booking);
    
}) 

// API endpoint to get all booking times for a restaurant(main restaurant page)

router.get("/all",validateRestaurantToken, async (req,res)=>{
    const bookings = await Bookings.findAll({
        include:[
            {
                model: Tables,
                required:true,
                where:{
                    RestaurantId:req.restaurantId
                }
            },
            {
                model:Statuses,
                required:true,
                where:{
                    status:{[Op.ne]:"Deleted"}
                }
            }
        ]
    });
    if(bookings.length == 0){
        return res.status(200).json({message: "Restaurant does not have any booking times available!"})
    }
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
        attributes:['id','startTime','endTime','PIN'],
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
        return res.status(200).json({message: "User does not have any reservations yet!"})
    }
    res.status(200).json(bookings);
    
}) 

// API endpoint to get booking times for a table

router.get("/table/:tableId", validateRestaurantToken, 
param('tableId').isNumeric().withMessage("Parameter must be a number"),
async (req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({error: errors.array()[0].msg})
        };

        const tableId = req.params.tableId;
        const restaurantId = req.restaurantId;
        const table = await getTableById(tableId);
        if(!table || table.RestaurantId !== restaurantId){
            return res.status(400).json({message: "Given table not found in the restaurant!"});
        }

        const bookings = await getBookingsDetailsByTableId(tableId);
        if(bookings.length == 0){
            return res.status(200).json({message: "There is no booking times for a given table!"});
        }
        return res.status(200).json(bookings);

    } catch (error) {
        return res.status(400).json({error: error.message});
    }
    
}) 

// API endpoint to add booking time for a table

router.post("/add/:tableId",validateRestaurantToken, 
body('startDateISO').not().isEmpty().withMessage('The time when the booking time begins is not provided!')
.isISO8601({ strict: false, strictSeparator: false }).withMessage("Incorrect date format!"),
body('endDateISO').not().isEmpty().withMessage('The time when the booking time ends is not provided!')
.isISO8601({ strict: false, strictSeparator: false }).withMessage("Incorrect date format!"),
param('tableId').isNumeric().withMessage('Parameter must be a number!'),
async (req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({added: false, error: errors.array()[0].msg})
        };

        const {startDateISO, endDateISO} = req.body;
        const restaurantId = req.restaurantId;
        const tableId = req.params.tableId;

        const table = await getTableById(tableId);
        if(!table || table.RestaurantId !== restaurantId){
            return res.status(400).json({added: false, error:"Given table does not exist in the restaurant!"});
        }

        const startDate = new Date(startDateISO);
        const endDate = new Date(endDateISO);
        const currentDate = new Date();
        if(startDate >= endDate || startDate <= currentDate){
            return res.status(400).json({added:false, error: "Incorrect booking times!"});
        }

        const bookingsForATable = await getBookingsByTableId(tableId);
        let overlappingPeriods = false;

        bookingsForATable.find((booking) => {
            if(startDate <= booking.startTime && endDate >= booking.startTime) {
                overlappingPeriods = true;
                return true;
            }
            if(startDate > booking.startTime && endDate < booking.endTime){
                overlappingPeriods = true;
                return true;
            }
            if(startDate <= booking.endTime && endDate >= booking.endTime){
                overlappingPeriods = true;
                return true;
            }
            return false;
        });
        if(overlappingPeriods){
            return res.status(400).json({added:false, error: "Overlapping booking time!"});
        }

        const newBookingTime = {
            startTime: startDateISO,
            endTime: endDateISO,
            TableId: tableId,
        }
        const createdBookingTime = await createBookingTime(newBookingTime);
        return res.status(201).json({added: true, BookingId: createdBookingTime.id});
        
    } catch (error) {
        return res.status(400).json({added: false, error: error.message});
    }  
});

// API endpoint to disable booking time

router.put("/disable/:bookingId",validateRestaurantToken,
async (req,res)=>{
    const booking = await Bookings.findOne({
        where:{id:req.params.bookingId},
        include:[
            {
                model: Tables,
                required:true,
                where:{
                    RestaurantId:req.restaurantId
                }
            },
            {
                model: Statuses,
                required:true,
                where:{
                    status:{[Op.ne]:"Deleted"}
                }
            }
        ]
    });
    if(!booking){
        return res.status(400).json({disabled: false,error:"Nie ma takiego terminu rezerwacji stolika!"})
    }
    if(booking.Status.status == "Disabled"){
        return res.status(400).json({disabled:false, error:"Booking time is already disabled!"})
    }
    if(booking.Status.status == "Booked" || booking.UserId != null){
        return res.status(400).json({disabled:false, error:"Can not disable already booked time! You need to cancel reservation first."})
    }
    const disabledStatusId = await Statuses.findOne({
        attributes:['id'],
        where:{status:"Disabled"}
    })
    
    Bookings.update({ 
        StatusId:disabledStatusId.id
    },{
        where:{
            id: req.params.bookingId
        }
    }).then(()=>{
        res.status(200).json({disabled:true, bookingId: req.params.bookingId})
    }).catch((err)=>{
        if(err){
            res.status(400).json({disabled:false, error:err})
        }
    });

});

// API endpoint to enable booking time

router.put("/enable/:bookingId",validateRestaurantToken,
async (req,res)=>{
    try {
        const deletedStatusId = await findDeletedStatusId()
        const disabledStatusId = await findDisabledStatusId()
        const booking = await Bookings.findOne({
            where:{[Op.and]:[
                {id:req.params.bookingId},
                {StatusId: {[Op.ne]:deletedStatusId}}
            ]},
            include:[
                {
                    model: Tables,
                    where:{
                        RestaurantId:req.restaurantId
                    }
                }
            ]
        });
        if(!booking){
            return res.status(400).json({enabled: false,error:"Booking time not found!"})
        }
        if(booking.StatusId != disabledStatusId|| booking.UserId != null){
            return res.status(400).json({enabled:false, error:"Booking time is not disabled!"})
        }
        const availableStatusId = await findAvailableStatusId()
        await booking.update({StatusId: availableStatusId})  
        res.status(200).json({enabled:true, bookingId: req.params.bookingId})
    } catch (error) {
        res.status(400).json({enabled:false, error:error})
    }
});

// API endpoint to book a table

router.put("/book/:bookingId", validateToken,
param('bookingId').isNumeric().withMessage('Parameter must be a number'),
async (req,res)=>{
    try {
        const userId = req.userId;
        const bookingId = req.params.bookingId;
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({error: errors.array()[0].msg});
        };

        const booking = await getBookingTableRestaurantDetailsByBookingId(bookingId);
        if(!booking){
            return res.status(400).json({booked: false, error:"Booking time not found!"});
        }
        const availableStatusId = getAvailableStatusId();
        if(booking.StatusId !== availableStatusId){
            return res.status(400).json({booked:false, error:"Booking time is not available!"});
        }

        const bookedStatusId = await findBookedStatusId();
        const PIN = getPIN(userId, booking.id);
        const newValues = {
            StatusId: bookedStatusId,
            UserId: userId,
            PIN: PIN
        }

        const booked = await reserveBookingTime(bookingId, newValues);
       
        const dateAndTime = booking.startTime.toISOString().split("T")
        sendEmail(req.userEmail.toString(),'Booking confirmation from Chrupka',{date:dateAndTime[0],
        time:dateAndTime[1].replace("Z",""),quantity:booking.Table.quantity,
        restaurant: booking.Table.Restaurant.restaurantName,PIN:PIN},
        "./template/bookingConfirmation.handlebars")
        res.status(200).json({booked:true, bookingId: req.params.bookingId})
    } catch (error) {
        res.status(400).json({booked:false, error:error.message})
    }
}); 

// API endpoint to delete booking time

router.put("/delete/:bookingId", validateRestaurantToken,
param('bookingId').isNumeric().withMessage('Parameter must be a number'),
async (req,res)=>{
    try {
        const bookingId = req.params.bookingId;
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({error: errors.array()[0].msg});
        };

        const booking = await getBookingDetailsByBookingId(bookingId);
        if(!booking || booking.Table.RestaurantId !== req.restaurantId){
            return res.status(400).json({deleted: false, error:"Booking time not found in the restaurant!"});
        }

        const disabledStatusId = await getDisabledStatusId();
        if(booking.StatusId !== disabledStatusId){
            return res.status(400).json({deleted: false, error:"Booking time is not disabled!"});
        }
        const updatedBooking = await deleteBookingTime(booking);
        return res.status(200).json({deleted: true, bookingId: updatedBooking.id});

    } catch (error) {
        res.status(400).json({deleted: false, error:error.message});
    }
}); 

module.exports = router