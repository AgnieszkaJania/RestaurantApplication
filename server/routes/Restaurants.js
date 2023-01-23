const express = require('express');
const router = express.Router();
const {createResetRestoreToken} = require('../functions/createResetRestoreToken');
const bcrypt = require('bcrypt');
const {createRestaurantToken} = require('../middlewares/JWT');
const {validateRestaurantToken} = require('../middlewares/AuthMiddleware');
const { body, validationResult, param } = require('express-validator');
const validator = require("validator");
const {getBookingByPIN, getBookingDetailsByBookingId, getAvailableBookingsByRestaurantId, getBookingTableUserByBookingIdRestaurantId, cancelBookingTime} = require('../services/Bookings')
const {getBookedStatusId} = require('../services/Statuses')
const {createBookingHistory} = require('../services/BookingsHistories')
const {getRestaurantByNameOrEmail, getRestaurantByEmail, createRestaurant, 
    getRestaurantById, OtherRestaurantWithGivenNameEmail, updateRestaurant, 
    getRestaurantDetailsByRestaurantId, changeRestaurantPassword, 
    getRestaurantProfileInfoById, addRestaurantResetPasswordToken,
    resetRestaurantPassword} = require('../services/Restaurants')
const {sendEmail} = require('../utils/email/sendMail')
const {getCancelledBookingByPIN, getCancelledBookingsByBookingId} = require('../services/BookingsHistories');
const {prepareBookingCancelByRestaurantConfirmationMailData, prepareRestaurantResetPasswordTokenMailData} = require('../functions/prepareMailData');

// API endpoint to register restaurant

router.post("/register", 
body('restaurantName').not().isEmpty().withMessage('Enter restaurant name!')
.isLength({max:255}).withMessage('Restaurant name is too long. It can be 255 characters long.'),
body('ownerFirstName').not().isEmpty().withMessage('Enter first name!')
.isLength({max:255}).withMessage('First name is too long. It can be 255 characters long.'),
body('ownerLastName').not().isEmpty().withMessage('Enter last name!').isLength({max:255})
.withMessage('Last name is too long. It can be 255 characters long.'),
body('ownerPassword').not().isEmpty().withMessage('Enter password!').isLength({max:255})
.withMessage('Password is too long. It can be 255 characters long.')
.isStrongPassword()
.withMessage('Password must be at least 8 characters long and must contain 1 number, 1 lower case, 1 upper case and 1 symbol'),
body('confirmPassword', 'Passwords do not match').custom((value, {req}) => (value === req.body.ownerPassword)),
body('street').not().isEmpty().withMessage('Enter street!').isLength({max:255})
.withMessage('Street is too long. It can be 255 characters long.'),
body('propertyNumber').not().isEmpty().withMessage('Enter property number!')
.isLength({max:255}).withMessage('Property number is too long. It can be 255 characters long.')
.isAlphanumeric().withMessage('Enter valid property number!'),
body('flatNumber').isLength({max:255}).withMessage('Flat number is too long. It can be 255 characters long.'),
body('postalCode').not().isEmpty().withMessage('Enter postal code!').isPostalCode('PL')
.withMessage('Enter valid postal code!'),
body('city','Currently the app is only for Cracow!').custom((value)=> (value === "Krakow")),
body('restaurantPhoneNumber').not().isEmpty().withMessage('Enter restaurant phone number!')
.isMobilePhone().withMessage('Incorrect phone number!'),
body('restaurantEmail').not().isEmpty().withMessage('Enter email!').isEmail().withMessage('Email is incorrect!'),
async (req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({registered: false, error: errors.array()[0].msg});
        }

        const {restaurantName, ownerFirstName, ownerLastName, ownerPassword, street, propertyNumber, flatNumber,
        postalCode, city, restaurantPhoneNumber, restaurantEmail, facebookLink, instagramLink} = req.body;
        const restaurant = await getRestaurantByNameOrEmail(restaurantName,restaurantEmail);

        if(restaurant){
            return res.status(400).json({registered: false,error:"Restaurant with given name or email already exists!"});
        }
        if(facebookLink && !validator.isURL(facebookLink) ){
            return res.status(400).json({registered:false, error:"Not a valid link!"});
        }
        if(instagramLink && !validator.isURL(instagramLink) ){
            return res.status(400).json({registered:false, error:"Not a valid link!"});
        }
        if(flatNumber && !validator.isAlphanumeric(flatNumber)){
            return res.status(400).json({registered:false, error:"Not a valid flat number!"});
        }

        const hash = await bcrypt.hash(ownerPassword, 10);
        const newRestaurant = {
            restaurantName: restaurantName,
            ownerFirstName: ownerFirstName,
            ownerLastName: ownerLastName,
            ownerPassword: hash,
            street: street,
            propertyNumber: propertyNumber,
            flatNumber: flatNumber,
            postalCode: postalCode,
            city: city,
            restaurantPhoneNumber: restaurantPhoneNumber,
            restaurantEmail: restaurantEmail,
            facebookLink: facebookLink,
            instagramLink: instagramLink
        }

        const createdRestaurant = await createRestaurant(newRestaurant); 
        return res.status(201).json({registered:true, restaurantId: createdRestaurant.id});

    } catch (error) {
        return res.status(400).json({registered:false, error:error.message});
    }    
});

// API endpoint to login restaurant

router.post("/login", 
body('restaurantEmail').not().isEmpty().withMessage('Enter email!').isEmail().withMessage('Email is incorrect!'),
body('ownerPassword').not().isEmpty().withMessage('Enter password!'),
async (req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({auth: false, error: errors.array()[0].msg});
        }

        const {restaurantEmail, ownerPassword} = req.body;
        const restaurant = await getRestaurantByEmail(restaurantEmail);

        if(!restaurant){
            return res.status(400).json({auth: false, error:"Restaurant does not exist!"});
        }

        const match = await bcrypt.compare(ownerPassword, restaurant.ownerPassword);
        if(!match){
            return res.status(400).json({auth: false, error:"Wrong password!"});
        }

        const accessToken = createRestaurantToken(restaurant);
        res.cookie("access-token-restaurant", accessToken, {
            maxAge: 60*60*24* 1000,
            httpOnly: true
        });
        return res.status(200).json({auth: true, restaurantId: restaurant.id});

    } catch (error) {
        return res.status(400).json({auth:false, error:error.message});
    }  
});

// API endpoint to search reservations by PIN

router.get("/search", validateRestaurantToken, async(req,res)=>{
    try {
        if(!req.query.PIN){
            return res.status(400).json({error:"Incorrect request params!"});
        }

        const PIN = req.query.PIN;
        const restaurantId = req.restaurantId;
        const booking = await getBookingByPIN(PIN);
        if(!booking || booking.Table.RestaurantId !== restaurantId){
            return res.status(200).json({message:"Booking with given PIN not found in the restaurant!"});
        }
        return res.status(200).json(booking);

    } catch (error) {
        return res.status(400).json({error:error.message});
    }
})

// API endpoint to search history of reservations by PIN

router.get("/searchHistory", validateRestaurantToken, async (req,res)=>{
    try {
        if(!req.query.PIN){
            return res.status(400).json({error:"Incorrect request params!"})
        }

        const PIN = req.query.PIN;
        const restaurantId = req.restaurantId;
        const bookingHistory = await getCancelledBookingByPIN(PIN);
        if(!bookingHistory || bookingHistory.Booking.Table.RestaurantId !== restaurantId){
            return res.status(200).json({message:"Booking with given PIN not found in cancelled reservations in the restaurant!"});
        }
        return res.status(200).json(bookingHistory);

    } catch (error) {
        return res.status(400).json({error:error.message});
    }
}) 

// API endpoint to load history for booking (in restaurant)

router.get("/loadHistory", validateRestaurantToken,async (req,res)=>{
    try {
        if(!req.query.BookingId){
            return res.status(400).json({error:"Incorrect request params!"})
        }
        const bookingId = req.query.BookingId;
        const restaurantId = req.restaurantId;
        const booking = await getBookingDetailsByBookingId(bookingId);
        if(!booking || booking.Table.RestaurantId !== restaurantId){
            return res.status(400).json({message: "Given booking time not found in the restaurant!"});
        }
        const cancelledBookings = await getCancelledBookingsByBookingId(bookingId);
        if(cancelledBookings.length == 0){
            return res.status(200).json({message:"No history available!"});
        }
        return res.status(200).json(cancelledBookings);

    } catch (error) {
        return res.status(400).json({error:error.message});
    }
});

// API endpoint to auth restaurant

router.get("/auth", validateRestaurantToken, async (req,res)=>{
    try {
        const restaurantId = req.restaurantId;
        const restaurant = await getRestaurantById(restaurantId);
        return res.status(200).json({auth:true, restaurant:restaurant});

    } catch (error) {
        return res.status(400).json({error: error.message});
    }
});

// API endpoint to get restaurant profile(my restaurant)

router.get("/profile", validateRestaurantToken, async (req,res)=>{

    try {
        const restaurantId = req.restaurantId;
        const restaurant = await getRestaurantById(restaurantId);
        return res.status(200).json(restaurant);

    } catch (error) {
        return res.status(400).json({error: error.message});
    } 
}) 

// API endpoint to get all available booking times for a restaurant

router.get("/available/:restaurantId", 
param('restaurantId').isNumeric().withMessage('Parameter must be a number'),
async (req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({error: errors.array()[0].msg});
        };
        
        const restaurantId = req.params.restaurantId;
        const restaurant = await getRestaurantById(restaurantId);
        if(!restaurant){
            return res.status(400).json({error:"Given restaurant does not exist in the system!"});
        }

        const bookings = await getAvailableBookingsByRestaurantId(restaurant.id);
        if(bookings.length == 0){
            return res.status(200).json({message: "Available booking times not found for the given restaurant!"});
        }
        return res.status(200).json(bookings);

    } catch (error) {
         return res.status(400).json({error: error.message});
    } 
})

// API endpoint to edit restaurant data

router.put("/edit", validateRestaurantToken,
body('restaurantName').not().isEmpty().withMessage('Restaurant name can not be empty!')
.isLength({max:255}).withMessage('Restaurant name is too long. It can be 255 characters long.'),
body('ownerFirstName').not().isEmpty().withMessage('First name can not be empty!')
.isLength({max:255}).withMessage('First name is too long. It can be 255 characters long.'),
body('ownerLastName').not().isEmpty().withMessage('Last name can not be empty!')
.isLength({max:255}).withMessage('Last name is too long. It can be 255 characters long.'),
body('street').not().isEmpty().withMessage('Street can not be empty!')
.isLength({max:255}).withMessage('Street is too long. It can be 255 characters long.'),
body('propertyNumber').not().isEmpty().withMessage('Property number can not be empty!')
.isLength({max:255}).withMessage('Property number is too long. It can be 255 characters long.')
.isAlphanumeric().withMessage('Enter valid property number!'),
body('flatNumber').isLength({max:255}).withMessage('Flat number is too long. It can be 255 characters long.'),
body('postalCode').not().isEmpty().withMessage('Postal code can not be empty!').isPostalCode('PL').withMessage('Enter valid postal code!'),
body('restaurantPhoneNumber').not().isEmpty().withMessage('Restaurant phone number can not be empty').isMobilePhone().withMessage('Phone number is incorrect!'),
body('restaurantEmail').not().isEmpty().withMessage('Email can not be empty!').isEmail().withMessage('Email is incorrect!'),
async(req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({updated: false, error: errors.array()[0].msg});
        };

        const {restaurantName, ownerFirstName, ownerLastName, street,
            propertyNumber, flatNumber, postalCode, restaurantPhoneNumber, restaurantEmail, facebookLink, instagramLink} = req.body;
        if(flatNumber && !validator.isAlphanumeric(flatNumber)){
            return res.status(400).json({updated:false, error:"Not a valid flat number!"});
        }
        if(facebookLink && !validator.isURL(facebookLink) ){
            return res.status(400).json({updated:false, error:"Not a valid link!"});
        }
        if(instagramLink && !validator.isURL(instagramLink) ){
            return res.status(400).json({updated:false, error:"Not a valid link!"});
        }
        const restaurantId = req.restaurantId;

        const otherRestaurant = await OtherRestaurantWithGivenNameEmail(restaurantName, restaurantEmail, restaurantId);
        if(otherRestaurant && otherRestaurant.restaurantName === restaurantName){
            return res.status(400).json({updated: false, error:"There is already a restaurant in the system associated with the given name!"});
        }
        if(otherRestaurant && otherRestaurant.restaurantEmail === restaurantEmail){
            return res.status(400).json({updated: false, error:"There is already a restaurant in the system associated with the given email!"});
        }
        const restaurant = await getRestaurantById(restaurantId);
        const newRestaurantData = {
            restaurantName: restaurantName,
            ownerFirstName: ownerFirstName,
            ownerLastName: ownerLastName,
            street: street,
            propertyNumber: propertyNumber,
            flatNumber: flatNumber,
            postalCode: postalCode, 
            restaurantPhoneNumber: restaurantPhoneNumber,
            restaurantEmail: restaurantEmail,
            facebookLink: facebookLink,
            instagramLink: instagramLink
        }
        const updatedRestaurant = await updateRestaurant(restaurant, newRestaurantData);
        return res.status(200).json({updated:true, restaurantId: updatedRestaurant.id});
         
    } catch (error) {
        return res.status(400).json({updated:false, error:error.message}); 
    }      

});

// API endpoint to cancel reservation by the restaurant

router.put("/cancel/:bookingId",validateRestaurantToken,
param('bookingId').isNumeric().withMessage('Parameter must be a number'),
body('message').isLength({max:255}).withMessage('Message is too long. It can be 255 characters long.'),
async (req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({cancelled: false, error: errors.array()[0].msg})
        };
        const {message} = req.body;
        const restaurantId = req.restaurantId;
        const bookingId = req.params.bookingId;
        const currentDate = new Date();
        const booking = await getBookingTableUserByBookingIdRestaurantId(bookingId, restaurantId);

        if(!booking){
            return res.status(400).json({cancelled: false,error:"Booking time not found in the restaurant!"});
        }
        const bookedStatusId = await getBookedStatusId();
        if(booking.StatusId !== bookedStatusId){
            return res.status(400).json({cancelled:false, error:"Booking time is not reserved!"});
        }
        if(booking.startTime <= currentDate){
            return res.status(400).json({cancelled: false, error:"Can not cancel ongoing or already finished reservation"});
        }

        const restaurant = await getRestaurantById(restaurantId);
        const bookingHistory = await createBookingHistory(booking, 'CR');
        const cancelledBooking = await cancelBookingTime(booking);
        const mailData = prepareBookingCancelByRestaurantConfirmationMailData(booking); 
        
        sendEmail(booking.User.email, mailData.mailTitle,
        {restaurantName: restaurant.restaurantName, 
            date: mailData.bookingDate, 
            time: mailData.bookingTime,
            quantity: cancelledBooking.Table.quantity,
            PIN:bookingHistory.oldPIN,
            message:message},
            mailData.templatePath)
        return res.status(200).json({cancelled:true, bookingId: cancelledBooking.id});

    } catch (error) {
        return res.status(400).json({cancelled:false, error:error.message});
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
            return res.status(400).json({changed: false, error: errors.array()[0].msg});
        };

        const {oldPassword, newPassword} = req.body;
        const restaurantId = req.restaurantId;
        const restaurant = await getRestaurantDetailsByRestaurantId(restaurantId);

        const match = await bcrypt.compare(oldPassword, restaurant.ownerPassword);
        if(!match){
            return res.status(400).json({changed: false, message:"Wrong password!"});
        }
        if(oldPassword === newPassword){
            return res.status(200).json({changed: false, message:"New password must be different than the old password!"});
        }
        const hash = await bcrypt.hash(newPassword, 10);
        const updatedRestaurant = await changeRestaurantPassword(restaurant, hash);
        return res.status(200).json({changed: true, restaurantId: updatedRestaurant.id});

    } catch (error) {
        return res.status(400).json({changed: false, error: error.message});
    }
})

// API endpoint to send password reset link

router.put("/resetPasswordLink",
body('email').not().isEmpty().withMessage('Enter restaurant email!')
.isEmail().withMessage('Email is incorrect!'), async (req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({success: false, error: errors.array()[0].msg});
        };

        const {email} = req.body

        const restaurant = await getRestaurantByEmail(email);
        if(!restaurant){
            return res.status(400).json({success:false, error:"Restaurant does not exist!"});
        }
        if(restaurant && !restaurant.is_active){
            return res.status(400).json({success:false, error:"Restaurant account is not active!"})
        }

        const resetPasswordTokenData = await createResetRestoreToken();
        const restaurantWithToken = await addRestaurantResetPasswordToken(restaurant, resetPasswordTokenData);
        const mailData = prepareRestaurantResetPasswordTokenMailData(resetPasswordTokenData, restaurantWithToken);
        
        sendEmail(restaurantWithToken.restaurantEmail, mailData.mailTitle, 
        {firstName: restaurantWithToken.ownerFirstName, 
        lastName: restaurantWithToken.ownerLastName,
        restaurantName: restaurantWithToken.restaurantName,
        link: mailData.link}, 
        mailData.templatePath);
        return res.status(200).json({success:true, message:"Reset password link sent!"});

    } catch (error) {
        res.status(400).json({success:false, error:error.message});
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
            return res.status(422).json({reseted: false, error: errors.array()[0].msg});
        };
        if(!req.query.id || !req.query.token){
            return res.status(400).json({reseted:false, error:"Incorrect request params!"});
        }

        const {newPassword} = req.body;
        const restaurantId = req.query.id;
        const token = req.query.token;

        const restaurant = await getRestaurantDetailsByRestaurantId(restaurantId);
        if(!restaurant){
            return res.status(400).json({reseted:false, error:"Restaurant does not exist!"});
        }
        if(restaurant && !restaurant.is_active){
            return res.status(400).json({reseted:false, error:"Restaurant account is not active!"});
        }
        if(!restaurant.resetPasswordToken || !restaurant.resetPasswordTokenExpirationDate){
            return res.status(400).json({reseted:false, error:"Token data not found!"})
        }
        const theSamePasswordAsPrevious = await bcrypt.compare(newPassword, restaurant.ownerPassword);
        if(theSamePasswordAsPrevious){
            return res.status(200).json({reseted:false, message:"New password must be different than the old password."});
        }

        const match = await bcrypt.compare(token, restaurant.resetPasswordToken);
        if(match && restaurant.resetPasswordTokenExpirationDate >= new Date())
        {   
            const hash = await bcrypt.hash(newPassword, 10);
            await resetRestaurantPassword(restaurant, hash);
            return res.status(200).json({reseted: true, message:"Password changed!"});
        }
        return res.status(200).json({reseted:false, message:"Password reset link is incorrect or has expired!"});
        
    } catch (error) {
        res.status(400).json({reseted:false, error:error.message});
    }
})

// API endpoint to get restaurant profile

router.get("/:restaurantId", 
param('restaurantId').isNumeric().withMessage('Parameter must be a number'),
async (req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({error: errors.array()[0].msg});
        };

        const restaurantId = req.params.restaurantId;
        const restaurant = await getRestaurantProfileInfoById(restaurantId);
        if(!restaurant){
            return res.status(400).json({message: "Given restaurant not found!"});
        }
        return res.status(200).json(restaurant);

    } catch (error) {
        res.status(400).json({error: error.message});
    }
    
}) 

module.exports = router

