const express = require('express');
const router = express.Router();
const {uploadMenu} = require("../middlewares/Menu");
const {uploadImages} = require("../middlewares/Images");
const { Restaurants, Images } = require('../models');
const bcrypt = require('bcrypt');
const {createToken} = require('../middlewares/JWT');
const {validateToken} = require('../middlewares/AuthMiddleware');
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
        return res.status(422).json({auth: false, error: errors.array()[0].msg})
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
        return res.status(400).json({auth: false,error:"Restauracja już istnieje lub na podany email została już zarejestrowana restauracja!"})
    }
    if(facebookLink && !validator.isURL(facebookLink) ){
        return res.status(400).json({auth:false, error:"Not a valid link!"})
    }
    if(instagramLink && !validator.isURL(instagramLink) ){
        return res.status(400).json({auth:false, error:"Not a valid link!"})
    }

    bcrypt.hash(ownerPassword,10).then(async (hash)=>{
        await Restaurants.create({
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
        }).then(()=>{
            res.json("Restaurant added")
        }).catch((err)=>{
            if(err){
                res.status(400).json({auth:false, error:err})
            }
        });
        
    });
});


module.exports = router

