const express = require('express')
const router = express.Router()
const { Users } = require('../models')
const bcrypt = require('bcrypt');
const {createToken} = require('../middlewares/JWT');
const {validateToken} = require('../middlewares/AuthMiddleware')
const { body, validationResult } = require('express-validator');

router.get("/", async (req,res)=>{
    const listOfUsers = await Users.findAll({
        attributes:['firstName','lastName','phoneNumber','email']
    });
    res.json(listOfUsers);
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
        return res.status(422).json({auth: false, error: errors.array()[0].msg})
    };
    const {firstName, lastName,userPassword, phoneNumber, email } = req.body;
    bcrypt.hash(userPassword,10).then((hash)=>{
        Users.create({
            firstName: firstName,
            lastName:lastName,
            userPassword: hash,
            phoneNumber:phoneNumber,
            email:email
        }).then(()=>{
            res.json("User added")
        }).catch((err)=>{
            if(err){
                res.status(400).json({error:err})
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
        res.json({auth: true, 
            userId: user.id
        });
        
    });
    
});

module.exports = router