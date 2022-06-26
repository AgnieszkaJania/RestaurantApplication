const express = require('express')
const router = express.Router()
const { Users, Bookings, Statuses } = require('../models')
const bcrypt = require('bcrypt');
const {createToken} = require('../middlewares/JWT');
const {validateToken} = require('../middlewares/AuthMiddleware')
const { body, validationResult } = require('express-validator');
const { Op } = require("sequelize");

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
    if(user){
        return res.status(400).json({registered: false,error:"Na podany email lub numer telefonu został już zarejstrowany użytkownik!"})
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
        return res.status(400).json({auth: false, error:"User does not exist!"})
    };
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

    if(isNaN(parseInt(req.params.bookingId))){
        return res.status(400).json({cancelled:false, error: "Invalid parameter!"})
    }
    const booking = await Bookings.findOne({
        where:{id:req.params.bookingId},
        include:[
            {
                model: Statuses
            }
        ]
    });
    
    if(!booking){
        return res.status(400).json({cancelled: false,error:"There is no such booking time!"})
    }
    if(booking.Status.status == "Available"){
        return res.status(400).json({cancelled:false, error:"Booking time is not reserved!"})
    }
    if(booking.Status.status == "Disabled"){
        return res.status(400).json({cancelled:false, error:"Booking time is disabled!"})
    }
    if(booking.Status.status == "Booked" && booking.UserId != req.userId){
        return res.status(400).json({cancelled:false, error:"User did not reserve the booking time!"})
    }
    const availableStatusId = await Statuses.findOne({
        attributes:['id'],
        where:{status:"Available"}
    })
    Bookings.update({ 
        StatusId:availableStatusId.id,
        UserId: null
    },{
        where:{[Op.and]:[
            {id: req.params.bookingId},
            {UserId: req.userId}
        ]}
    }).then(()=>{
        res.status(200).json({cancelled:true, bookingId: req.params.bookingId})
    }).catch((err)=>{
        if(err){
            res.status(400).json({cancelled:false, error:err})
        }
    });
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


module.exports = router