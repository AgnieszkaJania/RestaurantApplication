const express = require('express')
const router = express.Router()
const { Users, Bookings } = require('../models')
const bcrypt = require('bcrypt');
const {createToken} = require('../middlewares/JWT');
const {validateToken} = require('../middlewares/AuthMiddleware')
const { body, validationResult } = require('express-validator');
const { Op } = require("sequelize");
const {findBookingFullDataByBookingId} = require('../helpers/Bookings')
const {sendEmail} = require('../utils/email/sendMail')
const {findAvailableStatusId, findBookedStatusId} = require('../helpers/Statuses');
const {getRndInteger} = require('../functions/getRndInteger');
const {addHours} = require('../functions/addHours');
const crypto = require('crypto')

router.get("/", async (req,res)=>{
    const listOfUsers = await Users.findAll({
        attributes:['firstName','lastName','phoneNumber','email']
    });
    res.json(listOfUsers);
});

// API endpoint to auth user

router.get("/auth", validateToken,async (req,res)=>{
    const user = await Users.findOne({
        attributes:{exclude: ['userPassword']},
        where:{id: req.userId}
    });
    res.status(200).json({auth:true, user:user});
});

router.get("/profile",validateToken, async (req,res)=>{
    const user = await Users.findOne({
        attributes:{exclude: ['userPassword']},
        where: {id:req.userId}
    });
    res.json(user);
    
}) 

router.post("/register", 
body('firstName').not().isEmpty().withMessage('Enter first name!'),
body('lastName').not().isEmpty().withMessage('Enter last name!'),
body('userPassword').not().isEmpty().withMessage('Enter password!').isStrongPassword()
.withMessage('Password must be at least 8 characters long and must contain 1 number, 1 lower case, 1 upper case and 1 symbol'),
body('confirmPassword', 'Passwords do not match').custom((value, {req}) => (value === req.body.userPassword)),
body('phoneNumber').not().isEmpty().withMessage('Enter phone number!').isMobilePhone().withMessage('Incorrect number!'),
body('email').not().isEmpty().withMessage('Enter email!').isEmail().withMessage('Email is incorrect!'),
async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).json({registered: false, error: errors.array()[0].msg})
    };
    const {firstName, lastName,userPassword, phoneNumber, email } = req.body;
    const user = await Users.findOne({
        where:{
            [Op.or]:[
                {email:email},
                {phoneNumber:phoneNumber}
            ]
        }
    });
    if(user && user.is_active){
        return res.status(200).json({registered: false,message:"User has already been registered for the given email or phone number!"})
    }
    if(user && !user.is_active){
        return res.status(200).json({registered: false,message:"User has been deleted for the given email or phone number. Please, restore your account"
        +" or create a new one."})
    }
    bcrypt.hash(userPassword,10).then((hash)=>{
        Users.create({
            firstName: firstName,
            lastName:lastName,
            userPassword: hash,
            phoneNumber:phoneNumber,
            email:email
        }).then((result)=>{
            res.status(200).json({registered:true, userId: result.id})
        }).catch((err)=>{
            if(err){
                res.status(400).json({registered:false, error:err})
            }
        });
        
    });
});

router.post("/login", 
body('email').not().isEmpty().withMessage('Enter email!').isEmail().withMessage('Email is incorrect!'),
body('userPassword').not().isEmpty().withMessage('Enter password!'),
async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).json({auth: false, error: errors.array()[0].msg})
    };
    const {email, userPassword} = req.body;
    const user = await Users.findOne({where:{email:email}});
    if(!user){
        return res.status(200).json({auth: false, message:"User does not exist!"})
    };
    if(!user.is_active){
        return res.status(200).json({auth:false, message:"User has been deleted. Restore your account to be able to log in again."})
    }
    bcrypt.compare(userPassword,user.userPassword).then((match)=>{
        if(!match){
            return res.status(400).json({auth: false, error:"Wrong password!"});
        }   
        const accessToken = createToken(user)
        res.cookie("access-token", accessToken,{
            maxAge: 60*60*24* 1000,
            httpOnly: true
        });
        res.status(200).json({auth: true, 
            userId: user.id
        });
        
    });
    
});

// API endpoint to cancel reservation by the user

router.put("/cancel/:bookingId",validateToken,
async (req,res)=>{
    try {
        const booking = await findBookingFullDataByBookingId(req.params.bookingId)
        if(!booking){
            return res.status(400).json({cancelled:false, error:"Booking not found!"}) 
        }
        if(booking.Status.status != "Booked" || booking.UserId != req.userId){
            return res.status(400).json({cancelled:false, error:"User did not reserve the booking time!"})
        }
        const availableStatusId = await findAvailableStatusId()
        await Bookings.update({ 
            StatusId:availableStatusId,
            UserId: null,
            PIN: null
        },{
            where:{[Op.and]:[
                {id: req.params.bookingId},
                {UserId: req.userId}
            ]}
        });
        const dateAndTime = booking.startTime.toISOString().split("T")
        sendEmail(req.userEmail.toString(),'Booking cancel confirmation from Chrupka',{date:dateAndTime[0],
            time:dateAndTime[1].replace("Z",""),
            quantity:booking.Table.quantity,restaurant:booking.Table.Restaurant.restaurantName,
            PIN:booking.PIN},"./template/bookingCancelConfirmationUser.handlebars")
        res.status(200).json({cancelled:true, bookingId: req.params.bookingId})
    } catch (error) {
        res.status(400).json({cancelled:false, error:error.message})
    }
});

// API endpoint to edit user data

router.put("/edit", validateToken,
body('firstName').not().isEmpty().withMessage('First name can not be empty!').isAlpha().withMessage('First name is incorrect!'),
body('lastName').not().isEmpty().withMessage('Last name can not be empty!').isAlpha().withMessage('Last name is incorrect!'),
body('phoneNumber').not().isEmpty().withMessage('Phone number can not be empty!').isMobilePhone().withMessage('Incorrect number!'),
body('email').not().isEmpty().withMessage('Email can not be emplty!').isEmail().withMessage('Email is incorrect!'),
async (req,res)=>{

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).json({updated: false, error: errors.array()[0].msg})
    };
    const {firstName, lastName, phoneNumber, email } = req.body;
    const user = await Users.findOne({
        where:{
            [Op.and]:[
                {id:{[Op.ne]:req.userId}},
                {[Op.or]:[
                    {email:email},
                    {phoneNumber:phoneNumber}
                ]}
            ]
        }
    });
    if(user && user.phoneNumber == phoneNumber){
        return res.status(400).json({updated: false,error:"Na podany numer telefonu został już zarejestrowany użytkownik!"});
    }
    if(user && user.email == email){
        return res.status(400).json({updated: false,error:"Na podany email został już zarejestrowany użytkownik!"});
    }
    Users.update({ 
         firstName: firstName,
         lastName: lastName,
         phoneNumber: phoneNumber,
         email:email
    },{
        where:{id:req.userId}
    }).then(()=>{
        res.status(200).json({updated:true, userId: req.userId})
    }).catch((err)=>{
        if(err){
            res.status(400).json({updated:false, error:err})
        }
    });

});

// API endpoint to send restoration code

router.put("/restorationLink",body('email').not().isEmpty().withMessage('Enter user email to restore account!')
.isEmail().withMessage('Email is incorrect!')
,async (req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({restored: false, error: errors.array()[0].msg})
        };
        const {email} = req.body
        const user = await Users.findOne({
            attributes:{exclude: ['userPassword']},
            where:{email:email}
        });
        if(!user){
            return res.status(400).json({success:false, error:"User does not exist!"})
        }
        if(user && user.is_active){
            return res.status(400).json({success:false, error:"User has an active account!"})
        }
        let restoreToken = crypto.randomBytes(32).toString("hex")
        let hash = await bcrypt.hash(restoreToken,10)
        let restoreTokenExpirationDate = addHours(new Date(),1)
        await Users.update({
            restoreToken: hash,
            restoreTokenExpirationDate: restoreTokenExpirationDate 
        },{
            where:{email:email}
        });
        const link = `localhost:3001/users/restoreAccount/${restoreToken}/${user.id}`
        sendEmail(email.toString(), 'Restoration code for your account!', {firstName:user.firstName,link:link},"./template/requestRestoreAccount.handlebars")
        return res.status(200).json({success: true, message:"Restoration link sent!"})
    } catch (error) {
        res.status(400).json({deleted:false, error:error.message})
    }
})

// API endpoint to restore user account

router.get("/restoreAccount/:restoreToken/:userId",async (req,res)=>{
    try {
        const user = await Users.findOne({
            attributes:{exclude: ['userPassword']},
            where:{id:req.params.userId}
        });
        if(!user){
            return res.status(400).json({restored:false, error:"User does not exist!"})
        }
        if(user && user.is_active){
            return res.status(400).json({restored:false, error:"User has an active account!"})
        }
        let match = await bcrypt.compare(req.params.restoreToken,user.restoreToken)
        if(match && user.restoreTokenExpirationDate >= new Date())
        {
            await Users.update({
                is_active:true,
                restoreToken:null,
                restoreTokenExpirationDate:null
            },{
                where:{id:user.id}
            });
            return res.status(200).json({restored: true, message:"User restored!"})
        }
        return res.status(200).json({restored:false, message:"Restoration link is incorrect or has expired!"})
        
        
    } catch (error) {
        res.status(400).json({deleted:false, error:error.message})
    }
})

// API endpoint to delete user

router.put("/delete",validateToken,async (req,res)=>{
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
        await Users.update({
            is_active:false
        },{
            where:{id:req.userId}
        });
        res.clearCookie("access-token")
        return res.status(200).json({deleted: true, message:"User deleted!"})
    } catch (error) {
        res.status(400).json({deleted:false, error:error.message})
    }
})

// API endpoint to change user password

router.put("/changePassword",validateToken,
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
        const user = await Users.findOne({
            where:{id:req.userId}
        });
        let match = await bcrypt.compare(oldPassword,user.userPassword)
        if(!match){
            return res.status(200).json({changed:false, message:"Password is incorrect!"})
        }
        if(oldPassword == newPassword){
            return res.status(200).json({changed:false, message:"New passwort must be different than the old password."})
        }
        let hash = await bcrypt.hash(newPassword,10)
        await Users.update({
            userPassword:hash
        },{
            where:{id:user.id}
        });
        return res.status(200).json({changed: true, message:"Password changed successfully!"})
    } catch (error) {
        res.status(400).json({changed:false, error:error.message})
    }
})

// API endpoint to send password reset link

router.put("/resetPasswordLink",body('email').not().isEmpty().withMessage('Enter user email!')
.isEmail().withMessage('Email is incorrect!')
,async (req,res)=>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({success: false, error: errors.array()[0].msg})
        };
        const {email} = req.body
        const user = await Users.findOne({
            attributes:{exclude: ['userPassword']},
            where:{email:email}
        });
        if(!user){
            return res.status(400).json({success:false, error:"User does not exist!"})
        }
        if(user && !user.is_active){
            return res.status(400).json({success:false, error:"User account is not active!"})
        }
        let resetPasswordToken = crypto.randomBytes(32).toString("hex")
        let hash = await bcrypt.hash(resetPasswordToken,10)
        let resetPasswordTokenExpirationDate = addHours( new Date(),1)
        await Users.update({
            resetPasswordToken: hash,
            resetPasswordTokenExpirationDate: resetPasswordTokenExpirationDate 
        },{
            where:{email:email}
        });
        const link = `localhost:3001/users/resetPasswordFrontend?token=${resetPasswordToken}&id=${user.id}`
        sendEmail(email.toString(), 'Password reset link for your account!', {firstName:user.firstName,link:link},"./template/requestResetPassword.handlebars")
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
        const user = await Users.findOne({
            where:{id:req.query.id}
        });
        if(!user){
            return res.status(400).json({reseted:false, error:"User does not exist!"})
        }
        if(user && !user.is_active){
            return res.status(400).json({reseted:false, error:"User account is not active!"})
        }
        if(!user.resetPasswordToken || !user.resetPasswordTokenExpirationDate){
            return res.status(400).json({reseted:false, error:"Token data not found!"})
        }
        let matchPassword = await bcrypt.compare(newPassword, user.userPassword)
        if(matchPassword){
            return res.status(200).json({changed:false, message:"New password must be different than the old password."})
        }
        let match = await bcrypt.compare(req.query.token,user.resetPasswordToken)
        if(match && user.resetPasswordTokenExpirationDate >= new Date())
        {   
            let hash = await bcrypt.hash(newPassword,10)
            await Users.update({
                userPassword:hash,
                resetPasswordToken:null,
                resetPasswordTokenExpirationDate:null
            },{
                where:{id:user.id}
            });
            return res.status(200).json({reseted: true, message:"User password changed!"})
        }
        return res.status(200).json({reseted:false, message:"Password reset link is incorrect or has expired!"})
    } catch (error) {
        res.status(400).json({deleted:false, error:error.message})
    }
})

router.get("/:id",async (req,res)=>{
    const id = req.params.id;
    const user = await Users.findOne({
        attributes:{exclude: ['userPassword']},
        where: {id:id}
    });
    res.json(user);
})

module.exports = router