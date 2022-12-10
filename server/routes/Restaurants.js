const express = require('express');
const router = express.Router();
const { Restaurants, Images, Menus, Statuses, Bookings, Tables, BookingsHistories, Users} = require('../models');
const bcrypt = require('bcrypt');
const {createRestaurantToken} = require('../middlewares/JWT');
const {validateRestaurantToken} = require('../middlewares/AuthMiddleware');
const { body, validationResult } = require('express-validator');
const { Op } = require("sequelize");
const validator = require("validator");
const {findBookingFullDataByBookingId, checkIfBookingDeleted} = require('../helpers/Bookings')
const {findAvailableStatusId} = require('../helpers/Statuses')
const {findUserByUserId} = require('../helpers/Users')
const {sendEmail} = require('../utils/email/sendMail')
const {addHours} = require('../functions/addHours');
const crypto = require('crypto');


// API endpoint to register restaurant

router.post("/register", 
body('restaurantName').not().isEmpty().withMessage('Enter restaurant name!'),
body('ownerFirstName').not().isEmpty().withMessage('Enter owner first name!'),
body('ownerLastName').not().isEmpty().withMessage('Enter owner last name!'),
body('ownerPassword').not().isEmpty().withMessage('Enter password!').isStrongPassword()
.withMessage('Password must be at least 8 characters long and must contain 1 number, 1 lower case, 1 upper case and 1 symbol'),
body('confirmPassword', 'Passwords do not match').custom((value, {req}) => (value === req.body.ownerPassword)),
body('street').not().isEmpty().withMessage('Enter street!'),
body('propertyNumber').not().isEmpty().withMessage('Enter number!').isNumeric().withMessage('Not a number!'),
body('postalCode').not().isEmpty().withMessage('Enter postal code!').isPostalCode('PL').withMessage('Enter valid postal code!'),
body('city','Currently the app is only for Cracow!').custom((value)=> (value === "Krakow")),
body('restaurantPhoneNumber').not().isEmpty().withMessage('Enter restaurant phone number!').isMobilePhone().withMessage('Incorrect number!'),
body('restaurantEmail').not().isEmpty().withMessage('Enter email!').isEmail().withMessage('Email is incorrect!'),
async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).json({registered: false, error: errors.array()[0].msg})
    };
    const {restaurantName, ownerFirstName, ownerLastName, ownerPassword, street, propertyNumber,
   postalCode, city, restaurantPhoneNumber, restaurantEmail, facebookLink, instagramLink} = req.body;
    const restaurant = await Restaurants.findOne({
        where:{
            [Op.or]:[
                {restaurantEmail: restaurantEmail},
                {restaurantName:restaurantName}
            ]
        }
    });
    if(restaurant){
        return res.status(400).json({registered: false,error:"Restauracja już istnieje lub na podany email została już zarejestrowana restauracja!"})
    }
    if(facebookLink && !validator.isURL(facebookLink) ){
        return res.status(400).json({registered:false, error:"Not a valid link!"})
    }
    if(instagramLink && !validator.isURL(instagramLink) ){
        return res.status(400).json({registered:false, error:"Not a valid link!"})
    }

    bcrypt.hash(ownerPassword,10).then((hash)=>{
        Restaurants.create({
            restaurantName: restaurantName,
            ownerFirstName: ownerFirstName, 
            ownerLastName: ownerLastName,
            ownerPassword: hash,
            street: street,
            propertyNumber: propertyNumber,
            postalCode: postalCode.replace("-",""),
            city:city,
            restaurantPhoneNumber: restaurantPhoneNumber,
            restaurantEmail: restaurantEmail,
            facebookLink: facebookLink ? facebookLink : null, 
            instagramLink: instagramLink ? instagramLink : null
        }).then((result)=>{
            res.status(200).json({registered:true, restaurantId: result.id})
        }).catch((err)=>{
            if(err){
                res.status(400).json({registered:false, error:err})
            }
        });
        
    });
});

// API endpoint to login restaurant

router.post("/login", 
body('restaurantEmail').not().isEmpty().withMessage('Enter email!').isEmail().withMessage('Email is incorrect!'),
body('ownerPassword').not().isEmpty().withMessage('Enter password!'),
async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).json({auth: false, error: errors.array()[0].msg})
    };
    const {restaurantEmail, ownerPassword} = req.body;
    const restaurant = await Restaurants.findOne({where:{restaurantEmail:restaurantEmail}});
    if(!restaurant){
        return res.status(400).json({auth: false, error:"Restaurant does not exist!"})
    };
    bcrypt.compare(ownerPassword,restaurant.ownerPassword).then((match)=>{
        if(!match){
            return res.status(400).json({auth: false, error:"Wrong password!"});
        }
        const accessToken = createRestaurantToken(restaurant)
        res.cookie("access-token-restaurant", accessToken,{
            maxAge: 60*60*24* 1000,
            httpOnly: true
        });
        res.status(200).json({auth: true, 
            restaurantId: restaurant.id
        });
         
    });
    
});

// API endpoint to search reservations by PIN

router.get("/search", validateRestaurantToken, async(req,res)=>{
    try {
        if(!req.query.PIN){
            return res.status(400).json({success:false, error:"Incorrect request params!"})
        }
        const booking = await Bookings.findOne({
            where:{PIN:req.query.PIN},
            include:[
                {
                    model:Tables,
                    required:true,
                    where:{
                        RestaurantId:req.restaurantId,
                    }

                },
                {
                    model:Users,
                    required:true,
                    attributes:['id','firstName','lastName','phoneNumber','email']
                }
            ]
        })
        if(!booking){
            return res.status(200).json({message:"PIN not found in the reservations!"})
        }
        return res.status(200).json(booking)
    } catch (error) {
        return res.status(400).json({success:false, error:error.message})
    }
})

// API endpoint to search history of reservations by PIN

router.get("/searchHistory", validateRestaurantToken,async (req,res)=>{
    try {
        if(!req.query.PIN){
            return res.status(400).json({success:false, error:"Incorrect request params!"})
        }
        const bookingHistory = await BookingsHistories.findOne({
            where:{oldPIN:req.query.PIN},
            include:[
                {
                    model: Bookings,
                    required:true,
                    attributes:['id','startTime','endTime','TableId'],
                    include:[
                    {
                        model:Tables,
                        required:true,
                        where:{
                            RestaurantId:req.restaurantId,
                        }
                    },
                    {
                        model:Statuses,
                        required:true   
                    }]
                },
                {
                    model:Users,
                    required:true,
                    attributes:['id','firstName','lastName','phoneNumber','email']
                }
            ]
        });
        if(!bookingHistory){
            return res.status(200).json({message:"PIN not found in the history!"})
        }
        return res.status(200).json(bookingHistory)
    } catch (error) {
        return res.status(400).json({success:false, error:error.message})
    }
}) 

// API endpoint to load history for booking (in restaurant)

router.get("/loadHistory", validateRestaurantToken,async (req,res)=>{
    try {
        if(!req.query.BookingId){
            return res.status(400).json({success:false, error:"Incorrect request params!"})
        }
        const deleted = await checkIfBookingDeleted(req.query.BookingId)
        if(deleted){
            return res.status(200).json({message:"No history available!"})
        }
        const cancelledBookings = await BookingsHistories.findAll({
            where:{BookingId:req.query.BookingId},
            include:[
                {
                    model:Bookings,
                    attributes:{exclude:['PIN','StatusId','UserId']},
                    required:true,
                    include:[{
                        model:Tables,
                        required:true,
                        where:{RestaurantId:req.restaurantId}
                    }]
                    
                },
                {
                    model:Users,
                    attributes:['id','firstName','lastName','phoneNumber','email'],
                    required:true 
                }
            ]
        })
        if(cancelledBookings.length == 0){
            return res.status(200).json({message:"No history available!"})
        }
        return res.status(200).json(cancelledBookings)
    } catch (error) {
        return res.status(400).json({success:false, error:error.message})
    }
});

// API endpoint to auth restaurant

router.get("/auth", validateRestaurantToken,async (req,res)=>{
    const restaurant = await Restaurants.findOne({
        attributes:{exclude: ['ownerPassword']},
        where:{id: req.restaurantId}
    });
    res.status(200).json({auth:true, restaurant:restaurant});
});

// API endpoint to get restaurant profile(my restaurant)

router.get("/profile",validateRestaurantToken, async (req,res)=>{
    const restaurant = await Restaurants.findOne({
            attributes:{exclude: ['ownerPassword']},
            where: {id:req.restaurantId},
            include:[
            {
                model: Images
            },
            {
                model: Menus
            }
        ]
    });
    res.json(restaurant);
    
}) 

// API endpoint to get all available booking times for a restaurant

router.get("/available/:id", async (req,res)=>{
    if(isNaN(parseInt(req.params.id))){
        return res.status(400).json({error: "Invalid parameter!"})
    }
    const availableStatusId = await Statuses.findOne({
        attributes:['id'],
        where:{status:"Available"}
    })
    const bookings = await Bookings.findAll({
            where:{StatusId: availableStatusId.id},
            include:[
            {
                model: Tables,
                where:{
                    RestaurantId:req.params.id
                }
            }
        ]
    });
    if(bookings.length == 0){
        return res.status(400).json({message: "There are no available booking times for a given restaurant!"})
    }
    res.status(200).json(bookings); 
}) 

// API endpoint to edit restaurant data

router.put("/edit", validateRestaurantToken,
body('restaurantName').not().isEmpty().withMessage('Restaurant name can not be empty!'),
body('ownerFirstName').not().isEmpty().withMessage('Owner first name can not be empty!').isAlpha().withMessage("First name is incorrect!"),
body('ownerLastName').not().isEmpty().withMessage('Owner last name can not be empty!').isAlpha().withMessage('Last name is incorrect!'),
body('street').not().isEmpty().withMessage('Street can not be empty!'),
body('propertyNumber').not().isEmpty().withMessage('Property number can not be empty!').isNumeric().withMessage('Property number is incorrect!'),
body('postalCode').not().isEmpty().withMessage('Postal code can not be empty!').isPostalCode('PL').withMessage('Enter valid postal code!'),
body('restaurantPhoneNumber').not().isEmpty().withMessage('Restaurant phone number can not be empty').isMobilePhone().withMessage('Phone number is incorrect!'),
body('restaurantEmail').not().isEmpty().withMessage('Email can not be empty!').isEmail().withMessage('Email is incorrect!'),
async(req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).json({updated: false, error: errors.array()[0].msg})
    };
    const {restaurantName, ownerFirstName, ownerLastName,street,
        propertyNumber,postalCode,restaurantPhoneNumber,restaurantEmail,facebookLink,instagramLink} = req.body;
    const restaurant = await Restaurants.findOne({
        where:{
            [Op.and]:[
                {id:{[Op.ne]:req.restaurantId}},
                {[Op.or]:[
                    {restaurantName:restaurantName},
                    {restaurantEmail:restaurantEmail}
                ]}
            ]
        }
    });
    if(restaurant && restaurant.restaurantName == restaurantName){
        return res.status(400).json({updated: false,error:"Restauracja o podanej nazwie została już zarejestrowana!"});
    }
    if(restaurant && restaurant.restaurantEmail == restaurantEmail){
        return res.status(400).json({updated: false,error:"Na podany email została już zarejestrowana restauracja!"});
    }
    Restaurants.update({ 
        restaurantName: restaurantName,
        ownerFirstName: ownerFirstName,
        ownerLastName: ownerLastName,
        street:street,
        propertyNumber:propertyNumber,
        postalCode: postalCode.replace("-",""), 
        restaurantPhoneNumber:restaurantPhoneNumber,
        restaurantEmail:restaurantEmail,
        facebookLink: facebookLink ? facebookLink : null,
        instagramLink: instagramLink ? instagramLink : null
    },{
        where:{id:req.restaurantId}
    }).then(()=>{
        res.status(200).json({updated:true, restaurantId: req.restaurantId})
    }).catch((err)=>{
        if(err){
            res.status(400).json({updated:false, error:err})
        }
    });
});

// API endpoint to cancel reservation by the restaurant

router.put("/cancel/:bookingId",validateRestaurantToken,
body('message').isLength({max:255}).withMessage('Message is too long. It can be 255 characters long.'),
async (req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({updated: false, error: errors.array()[0].msg})
        };
        const {message} = req.body
        const booking = await findBookingFullDataByBookingId(req.params.bookingId)
        if(!booking){
            return res.status(400).json({cancelled: false,error:"Booking not found!"})
        }
        if(booking.Table.RestaurantId != req.restaurantId){
            return res.status(400).json({cancelled: false,error:"Booking time is not reserved at your restaurant!"})
        }
        if(booking.Status.status == "Available"){
            return res.status(400).json({cancelled:false, error:"Booking time is available!"})
        }
        if(booking.Status.status == "Disabled"){
            return res.status(400).json({cancelled:false, error:"Booking time is disabled!"})
        }
        const availableStatusId = await findAvailableStatusId()
        const user = await findUserByUserId(booking.UserId)
        BookingsHistories.create({
            oldPIN:booking.PIN,
            CancelType:'CR',
            BookingId:booking.id,
            UserId:booking.UserId
        })
        Bookings.update({ 
            StatusId:availableStatusId,
            UserId: null,
            PIN: null
        },{
            where:{id: req.params.bookingId}
        }); 
        const dateAndTime = booking.startTime.toISOString().split("T")
        sendEmail(user.email.toString(),'Booking cancel confirmation from Chrupka',
        {restaurantName: booking.Table.Restaurant.restaurantName, 
            date:dateAndTime[0],time:dateAndTime[1].replace("Z",""),
            quantity:booking.Table.quantity,PIN:booking.PIN,message:message},"./template/bookingCancelConfirmationRestaurant.handlebars")
        res.status(200).json({cancelled:true, bookingId: req.params.bookingId})
    } catch (error) {
        res.status(400).json({cancelled:false,error:error.message})
    }
});

// API endpoint to change restaurant password

router.put("/changePassword",validateRestaurantToken,
body('oldPassword').not().isEmpty().withMessage('Enter your old password!'),
body('newPassword').not().isEmpty().withMessage('Enter your new password!').isStrongPassword()
.withMessage('Password must be at least 8 characters long and must contain 1 number, 1 lower case, 1 upper case and 1 symbol'),
body('confirmNewPassword', 'Passwords do not match').custom((value, {req}) => (value === req.body.newPassword)),
async (req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({changed: false, error: errors.array()[0].msg})
        };
        const {oldPassword, newPassword} = req.body
        const restaurant = await Restaurants.findOne({
            where:{id:req.restaurantId}
        });
        let match = await bcrypt.compare(oldPassword,restaurant.ownerPassword)
        if(!match){
            return res.status(200).json({changed:false, message:"Password is incorrect!"})
        }
        if(oldPassword == newPassword){
            return res.status(200).json({changed:false, message:"New password must be different than the old password."})
        }
        let hash = await bcrypt.hash(newPassword,10)
        await Restaurants.update({
            ownerPassword:hash
        },{
            where:{id:restaurant.id}
        });
        return res.status(200).json({changed: true, message:"Password changed successfully!"})
    } catch (error) {
        res.status(400).json({changed:false, error:error.message})
    }
})

// API endpoint to send password reset link

router.put("/resetPasswordLink",body('email').not().isEmpty().withMessage('Enter restaurant\'s email!')
.isEmail().withMessage('Email is incorrect!')
,async (req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({success: false, error: errors.array()[0].msg})
        };
        const {email} = req.body
        const restaurant = await Restaurants.findOne({
            attributes:{exclude: ['ownerPassword']},
            where:{restaurantEmail:email}
        });
        if(!restaurant){
            return res.status(400).json({success:false, error:"Restaurant does not exist!"})
        }
        if(restaurant && !restaurant.is_active){
            return res.status(400).json({success:false, error:"Restaurant account is not active!"})
        }
        let resetPasswordToken = crypto.randomBytes(32).toString("hex")
        let hash = await bcrypt.hash(resetPasswordToken,10)
        let resetPasswordTokenExpirationDate = addHours( new Date(),1)
        await Restaurants.update({
            resetPasswordToken: hash,
            resetPasswordTokenExpirationDate: resetPasswordTokenExpirationDate 
        },{
            where:{restaurantEmail:email}
        });
        const link = `localhost:3001/restaurants/resetPasswordFrontend?token=${resetPasswordToken}&id=${restaurant.id}`
        sendEmail(email.toString(), 'Password reset link for your restaurant account!', 
        {firstName:restaurant.ownerFirstName, lastName:restaurant.ownerLastName,restaurantName: restaurant.restaurantName,link:link},"./template/requestResetPasswordRestaurant.handlebars")
        return res.status(200).json({success: true, message:"Reset password link sent!"})
    } catch (error) {
        res.status(400).json({deleted:false, error:error.message})
    }
})

// API endpoint to reset password

router.get("/resetPassword",
body('newPassword').not().isEmpty().withMessage('Enter your new password!').isStrongPassword()
.withMessage('Password must be at least 8 characters long and must contain 1 number, 1 lower case, 1 upper case and 1 symbol'),
body('confirmNewPassword', 'Passwords do not match').custom((value, {req}) => (value === req.body.newPassword)),
async (req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({reseted: false, error: errors.array()[0].msg})
        };
        const {newPassword} = req.body
        if(!req.query.id || !req.query.token){
            return res.status(400).json({reseted:false, error:"Incorrect request params!"})
        }
        const restaurant = await Restaurants.findOne({
            where:{id:req.query.id}
        });
        if(!restaurant){
            return res.status(400).json({reseted:false, error:"Restaurant does not exist!"})
        }
        if(restaurant && !restaurant.is_active){
            return res.status(400).json({reseted:false, error:"Restaurant account is not active!"})
        }
        if(!restaurant.resetPasswordToken || !restaurant.resetPasswordTokenExpirationDate){
            return res.status(400).json({reseted:false, error:"Token data not found!"})
        }
        let matchPassword = await bcrypt.compare(newPassword, restaurant.ownerPassword)
        if(matchPassword){
            return res.status(200).json({changed:false, message:"New password must be different than the old password."})
        }
        let match = await bcrypt.compare(req.query.token,restaurant.resetPasswordToken)
        if(match && restaurant.resetPasswordTokenExpirationDate >= new Date())
        {   
            let hash = await bcrypt.hash(newPassword,10)
            await Restaurants.update({
                ownerPassword:hash,
                resetPasswordToken:null,
                resetPasswordTokenExpirationDate:null
            },{
                where:{id:restaurant.id}
            });
            return res.status(200).json({reseted: true, message:"Password changed!"})
        }
        return res.status(200).json({reseted:false, message:"Password reset link is incorrect or has expired!"})
    } catch (error) {
        res.status(400).json({deleted:false, error:error.message})
    }
})

// API endpoint to get restaurant profile

router.get("/:id", async (req,res)=>{
    if(isNaN(parseInt(req.params.id))){
        return res.status(400).json({error: "Invalid parameter!"})
    }
    const restaurant = await Restaurants.findOne({
            attributes:{exclude:['ownerFirstName','ownerLastName','ownerPassword']},
            where: {id:req.params.id},
            include:[
            {
                model: Images,
                attributes:['id','imagePath']
            },
            {
                model: Menus,
                attributes:['id','menuPath']
            }
        ]
    });
    if(!restaurant){
        return res.status(400).json({message: "No restaurant found!"})
    }
    res.status(200).json(restaurant);
    
}) 


module.exports = router

