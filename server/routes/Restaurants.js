const express = require('express');
const router = express.Router();
const { Restaurants, Images, Menus } = require('../models');
const bcrypt = require('bcrypt');
const {createRestaurantToken} = require('../middlewares/JWT');
const {validateRestaurantToken} = require('../middlewares/AuthMiddleware');
const { body, validationResult } = require('express-validator');
const { Op } = require("sequelize");
const validator = require("validator");



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

// API endpoint to get restaurant profile

router.get("/:id", async (req,res)=>{
    const restaurant = await Restaurants.findOne({
            attributes:{exclude:['ownerFirstName','ownerLastName','ownerPassword','createdAt','updatedAt']},
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
    res.json(restaurant);
    
}) 




module.exports = router

