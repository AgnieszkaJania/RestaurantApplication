const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt');
const {createToken} = require('../middlewares/JWT');
const {validateToken} = require('../middlewares/AuthMiddleware')
const { body, validationResult, param } = require('express-validator');
const {getBookingTableRestaurantByBookingIdUserId, cancelBookingTime} = require('../services/Bookings');
const {getCancelledBookingsForUser, createBookingHistory} = require('../services/BookingsHistories');
const { getUserById, getUserByEmailOrPhoneNumber, createUser, getUserByEmail,
    OtherUserWithGivenEmailPhoneNumber, updateUser, addUserRestoreToken, getUserDetailsByUserId, restoreUser, deleteUser, changeUserPassword, addUserResetPasswordToken, resetUserPassword} = require('../services/Users');
const {sendEmail} = require('../utils/email/sendMail')
const {prepareBookingCancelConfirmationMailData, prepareUserRestoreTokenMailData, prepareUserResetPasswordTokenMailData} = require('../functions/prepareMailData');
const {getFutureOngoingBookingByUserId} = require('../services/Bookings');
const {createResetRestoreToken} = require('../functions/createResetRestoreToken');


// API endpoint to find cancelled reservations for the user

router.get("/history", validateToken, async (req,res)=>{
   try {
        const userId = req.userId;
        const cancelledBookings = await getCancelledBookingsForUser(userId);
        if(cancelledBookings.length == 0){
            return res.status(200).json({message:"User does not have any cancelled bookings!"});
        }
        return res.status(200).json(cancelledBookings);

    } catch (error) {
        return res.status(400).json({error: error.message});
    }
});

// API endpoint to auth user

router.get("/auth", validateToken, async (req,res)=>{
    
    try {
        const userId = req.userId;
        const user = await getUserById(userId);
        return res.status(200).json({auth:true, user:user});

    } catch (error) {
        return res.status(400).json({error: error.message});
    }
});

router.get("/profile", validateToken, async (req,res)=>{
    try {
        const userId = req.userId;
        const user = await getUserById(userId);
        return res.status(200).json(user);

    } catch (error) {
        return res.status(400).json({success:false, error:error.message});
    }
    
}) 

router.post("/register", 
body('firstName').not().isEmpty().withMessage('Enter first name!')
.isLength({max:255}).withMessage(('First name is too long. It can be 255 characters long.')),
body('lastName').not().isEmpty().withMessage('Enter last name!')
.isLength({max:255}).withMessage(('Last name is too long. It can be 255 characters long.')),
body('userPassword').not().isEmpty().withMessage('Enter password!')
.isLength({max:255}).withMessage('Password is too long. It can be 255 characters long.')
.isStrongPassword()
.withMessage('Password must be at least 8 characters long and must contain 1 number, 1 lower case, 1 upper case and 1 symbol'),
body('confirmPassword', 'Passwords do not match').custom((value, {req}) => (value === req.body.userPassword)),
body('phoneNumber').not().isEmpty().withMessage('Enter phone number!')
.isMobilePhone().withMessage('Incorrect phone number!'),
body('email').not().isEmpty().withMessage('Enter email!').isEmail().withMessage('Email is incorrect!'),
async (req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({registered: false, error: errors.array()[0].msg});
        };

        const {firstName, lastName, userPassword, phoneNumber, email} = req.body;
        const user = await getUserByEmailOrPhoneNumber(email, phoneNumber);
        if(user && user.is_active){
            return res.status(200).json({registered: false, message:"User has already been registered for the given email or phone number!"});
        }
        if(user && !user.is_active){
            return res.status(200).json({registered: false, message:"User has been deleted for the given email or phone number!"});
        }

        const hash = await bcrypt.hash(userPassword, 10);
        const newUser = {
            firstName: firstName,
            lastName: lastName,
            userPassword: hash,
            phoneNumber: phoneNumber,
            email: email
        }

        const createdUser = await createUser(newUser);
        return res.status(201).json({registered: true, userId: createdUser.id});

    } catch (error) {
        return res.status(400).json({registered: false, error: error.message});
    }
});

router.post("/login", 
body('email').not().isEmpty().withMessage('Enter email!').isEmail().withMessage('Email is incorrect!'),
body('userPassword').not().isEmpty().withMessage('Enter password!'),
async (req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({auth: false, error: errors.array()[0].msg});
        };

        const {email, userPassword} = req.body;
        const user = await getUserByEmail(email);
        if(!user){
            return res.status(400).json({auth: false, message:"User does not exist!"});
        };
        if(!user.is_active){
            return res.status(400).json({auth:false, message:"User has been deleted for the given email or phone number!"});
        }

        const match = await bcrypt.compare(userPassword, user.userPassword);
        if(!match){
            return res.status(400).json({auth: false, error:"Wrong password!"});
        }   

        const accessToken = createToken(user);
        res.cookie("access-token", accessToken, {
            maxAge: 60*60*24* 1000,
            httpOnly: true
        });
        return res.status(200).json({auth: true, userId: user.id});

    } catch (error) {
        return res.status(400).json({auth:false, error:error.message});
    }
});

// API endpoint to cancel reservation by the user

router.put("/cancel/:bookingId",validateToken,
param('bookingId').isNumeric().withMessage('Parameter must be a number'),
async (req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({error: errors.array()[0].msg});
        };

        const bookingId = req.params.bookingId;
        const userId = req.userId;
        const booking = await getBookingTableRestaurantByBookingIdUserId(bookingId, userId);
        const userEmail = req.userEmail;
        const currentDate = new Date();

        if(!booking){
            return res.status(400).json({cancelled: false, error:"Booking not found in user reservations!"});
        }
        if(booking.startTime <= currentDate){
            return res.status(400).json({cancelled: false, error:"Can not cancel ongoing or already finished reservation"});
        }
        
        const bookingHistory = await createBookingHistory(booking, 'CU');
        const cancelledBooking = await cancelBookingTime(booking);
        const mailData = prepareBookingCancelConfirmationMailData(booking); 
        sendEmail(userEmail, mailData.mailTitle, {date: mailData.bookingDate,
            time: mailData.bookingTime,
            quantity: cancelledBooking.Table.quantity,
            restaurant: cancelledBooking.Table.Restaurant.restaurantName,
            PIN: bookingHistory.oldPIN},
            mailData.templatePath)
        return res.status(200).json({cancelled:true, bookingId: bookingId});
    } catch (error) {
        return res.status(400).json({cancelled:false, error:error.message})
    }
});

// API endpoint to edit user data

router.put("/edit", validateToken,
body('firstName').not().isEmpty().withMessage('Enter first name!')
.isLength({max:255}).withMessage('First name is too long. It can be 255 characters long.'),
body('lastName').not().isEmpty().withMessage('Enter last name!')
.isLength({max:255}).withMessage('Last name is too long. It can be 255 characters long.'),
body('phoneNumber').not().isEmpty().withMessage('Phone number can not be empty!').isMobilePhone().withMessage('Phone number is incorrect'),
body('email').not().isEmpty().withMessage('Email can not be empty!').isEmail().withMessage('Email is incorrect!'),
async (req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({updated: false, error: errors.array()[0].msg})
        };

        const {firstName, lastName, phoneNumber, email} = req.body;
        const userId = req.userId;

        const otherUser = await OtherUserWithGivenEmailPhoneNumber(email, phoneNumber, userId);
        if(otherUser && otherUser.phoneNumber == phoneNumber){
            return res.status(400).json({updated: false, error:"There is already a user in the system associated with the given phone number!"});
        }
        if(otherUser && otherUser.email == email){
            return res.status(400).json({updated: false,error:"There is already a user in the system associated with the given email!"});
        }
        const user = await getUserById(userId);
        const newUserData = {
            firstName: firstName,
            lastName: lastName,
            phoneNumber: phoneNumber,
            email: email
        }
        const updatedUser = await updateUser(user, newUserData);
        return res.status(200).json({updated: true, userId: updatedUser.id});
        
    } catch (error) {
        return  res.status(400).json({updated: false, error:error.message});
    }

});

// API endpoint to send restoration link

router.put("/restorationLink",
body('email').not().isEmpty().withMessage('Enter user email to restore account!')
.isEmail().withMessage('Email is incorrect!'),
async (req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({success: false, error: errors.array()[0].msg})
        };
        const {email} = req.body;
        const user = await getUserByEmail(email);
        if(!user){
            return res.status(400).json({success: false, error:"User does not exist in the system!"});
        }
        if(user && user.is_active){
            return res.status(400).json({success: false, error:"User has an active account!"});
        }
        const restoreTokenData = await createResetRestoreToken();
        const userWithToken = await addUserRestoreToken(user, restoreTokenData);
        const mailData = prepareUserRestoreTokenMailData(restoreTokenData, userWithToken);
        sendEmail(userWithToken.email, mailData.mailTitle, {firstName: userWithToken.firstName,
            link: mailData.link},
            mailData.templatePath);
        return res.status(200).json({success: true, message:"Restoration link sent!"});

    } catch (error) {
        return res.status(400).json({success: false, error: error.message});
    }
})

// API endpoint to restore user account

router.get("/restoreAccount", 
async (req,res)=>{
    try {
        if(!req.query.id || !req.query.token){
            return res.status(400).json({restored:false, error:"Incorrect request params!"})
        }

        const userId = req.query.id;
        const token = req.query.token;

        const user = await getUserDetailsByUserId(userId);
        if(!user){
            return res.status(400).json({restored:false, error:"User does not exist!"});
        }
        if(user && user.is_active){
            return res.status(400).json({restored:false, error:"User has an active account!"});
        }
        if(!user.restoreToken || !user.restoreTokenExpirationDate){
            return res.status(400).json({restored:false, error:"Token data not found!"});
        }

        const match = await bcrypt.compare(token, user.restoreToken);
        if(match && user.restoreTokenExpirationDate >= new Date())
        {
            await restoreUser(user); 
            return res.status(200).json({restored: true, message:"User restored!"});
        }
        return res.status(200).json({restored: false, message:"Restoration link is incorrect or has expired!"});
         
    } catch (error) {
        return res.status(400).json({restored: false, error: error.message});
    }
})

// API endpoint to delete user

router.put("/delete", validateToken, async (req,res)=>{
    try {
        const userId = req.userId;
        const booking = await getFutureOngoingBookingByUserId(userId);

        if(booking){
            return res.status(200).json({deleted:false, message: "Can not delete account with future or ongoing reservations!"});
        }
        const user = await getUserById(userId);
        const deletedUser = await deleteUser(user);
        res.clearCookie("access-token");
        return res.status(200).json({deleted: true, userId:deletedUser.id});
    } catch (error) {
        return res.status(400).json({deleted:false, error:error.message});
    }
})

// API endpoint to change user password

router.put("/changePassword", validateToken,
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
        const userId = req.userId;
        const user = await getUserDetailsByUserId(userId);

        const match = await bcrypt.compare(oldPassword, user.userPassword);
        if(!match){
            return res.status(400).json({changed: false, message:"Wrong password!"});
        }
        if(oldPassword === newPassword){
            return res.status(200).json({changed: false, message:"New password must be different than the old password!"});
        }
        const hash = await bcrypt.hash(newPassword, 10);
        const updatedUser = await changeUserPassword(user, hash);
        return res.status(200).json({changed: true, userId: updatedUser.id});

    } catch (error) {
        return res.status(400).json({changed:false, error: error.message});
    }
})

// API endpoint to send password reset link

router.put("/resetPasswordLink",
body('email').not().isEmpty().withMessage('Enter user email!')
.isEmail().withMessage('Email is incorrect!'), async (req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({success: false, error: errors.array()[0].msg});
        };

        const {email} = req.body;

        const user = await getUserByEmail(email);
        if(!user){
            return res.status(400).json({success: false, error:"User does not exist!"});
        }
        if(user && !user.is_active){
            return res.status(400).json({success: false, error:"User account is not active!"});
        }
        
        const resetPasswordTokenData = await createResetRestoreToken();
        const userWithToken = await addUserResetPasswordToken(user, resetPasswordTokenData);
        const mailData = prepareUserResetPasswordTokenMailData(resetPasswordTokenData, userWithToken);

        sendEmail(userWithToken.email, mailData.mailTitle, {firstName: userWithToken.firstName,
            link: mailData.link}, mailData.templatePath);
        return res.status(200).json({success: true, message:"Reset password link sent!"});

    } catch (error) {
        return res.status(400).json({success:false, error:error.message});
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
        const userId = req.query.id;
        const token = req.query.token;

        
        const user = await getUserDetailsByUserId(userId);
        if(!user){
            return res.status(400).json({reseted: false, error:"User does not exist!"});
        }
        if(user && !user.is_active){
            return res.status(400).json({reseted: false, error:"User account is not active!"});
        }
        if(!user.resetPasswordToken || !user.resetPasswordTokenExpirationDate){
            return res.status(400).json({reseted: false, error:"Token data not found!"});
        }

        const theSamePasswordAsPrevious = await bcrypt.compare(newPassword, user.userPassword);
        if(theSamePasswordAsPrevious){
            return res.status(200).json({reseted: false, message:"New password must be different than the old password."});
        }

        const match = await bcrypt.compare(token, user.resetPasswordToken);
        if(match && user.resetPasswordTokenExpirationDate >= new Date())
        {   
            const hash = await bcrypt.hash(newPassword, 10);
            await resetUserPassword(user, hash);
            return res.status(200).json({reseted: true, message:"User password changed!"});
        }
        return res.status(200).json({reseted: false, message:"Password reset link is incorrect or has expired!"});
    } catch (error) {
        return res.status(400).json({reseted: false, error: error.message});
    }
})

// API endpoint to delete user forever

router.put("/deleteForever",validateToken,async (req,res)=>{
    try {
        const bookedStatusId = await findBookedStatusId()
        let currentDate = new Date()
        const booking = await Bookings.findOne({
            where:{
                [Op.and]:[
                    {UserId:req.userId},
                    {StatusId:bookedStatusId},
                    {endTime:{[Op.gte]:currentDate}}
                ]
            }
        });
        if(booking){
            return res.status(200).json({deleted:false, message: "You can not delete account because you still have future" +
            "or ongoing reservations. You need to cancel them first."})
        }
        let firstName = "deletedFirstName"
        let lastName = "deletedLastName"
        let userPassword = "password"
        let phoneNumber = req.userId.toString() + "deletedPhoneNumber"
        let email = req.userId.toString() + "deletedEmail"
        
        await Users.update({
            firstName:firstName,
            lastName:lastName,
            userPassword:userPassword,
            phoneNumber:phoneNumber,
            email:email,
            is_active:false
        },{
            where:{id:req.userId}
        });
        res.clearCookie("access-token")
        return res.status(200).json({deleted: true, message:"User deleted forever!"})
    } catch (error) {
        res.status(400).json({deleted:false, error:error.message})
    }
})

module.exports = router