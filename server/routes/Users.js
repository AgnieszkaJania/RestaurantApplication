const express = require('express')
const router = express.Router()
const { Users, Bookings } = require('../models')
const bcrypt = require('bcrypt');
const {createToken} = require('../middlewares/JWT');
const {validateToken} = require('../middlewares/AuthMiddleware')
const { body, validationResult } = require('express-validator');
const { Op } = require("sequelize");
const {findBookingFullDataByBookingId} = require('../helpers/Bookings')
const {sendEmail} = require('../functions/sendMail')
const {findAvailableStatusId, findBookedStatusId} = require('../helpers/Statuses');
const {getRndInteger} = require('../functions/getRndInteger');
const {addHours} = require('../functions/addHours');

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

router.get("/:id",async (req,res)=>{
    const id = req.params.id;
    const user = await Users.findOne({
        attributes:{exclude: ['userPassword']},
        where: {id:id}
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
        let msg = `You have cancelled your table booking in Chrupka app.
        Date: ${dateAndTime[0]}
        Time: ${dateAndTime[1].replace("Z","")}
        The table was for ${booking.Table.quantity} people at the restaurant ${booking.Table.Restaurant.restaurantName}.
        Your PIN was ${booking.PIN}
        Hope to see you again!`
        sendEmail(req.userEmail.toString(),'Booking cancel confirmation from Chrupka',msg.toString())
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

router.put("/restorationCode",body('email').not().isEmpty().withMessage('Enter user email to restore account!')
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
        let restorationCode = getRndInteger(0,9).toString() + getRndInteger(0,9).toString() + getRndInteger(0,9).toString() + getRndInteger(0,9).toString()
        let expirationDate = addHours(new Date(),1)
        await Users.update({
            restorationCode: restorationCode,
            codeExpirationDate: expirationDate 
        },{
            where:{email:email}
        });
        let msg = `Hello! This is your restoration code for your account
        in Chrupka app. Please enter the code together  with your mail in restoration section of 
        our app to restore your account.
        CODE: ${restorationCode}
        We are happy to see you again!`
        sendEmail(email.toString(), 'Restoration code for your account!', msg.toString())
        return res.status(200).json({success: true, message:"Restoration code generated and sent!"})
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
        return res.status(200).json({deleted: true, message:"User deleted!"})
    } catch (error) {
        res.status(400).json({deleted:false, error:error.message})
    }
})


module.exports = router