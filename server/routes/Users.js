const express = require('express')
const router = express.Router()
const { Users } = require('../models')
const bcrypt = require('bcrypt');
const {sign} = require('jsonwebtoken');

router.get("/", async (req,res)=>{
    const listOfUsers = await Users.findAll({
        attributes:['firstName','lastName','phoneNumber','email']
    });
    res.json(listOfUsers);
});

router.get("/:id",async (req,res)=>{
    const id = req.params.id;
    const user = await Users.findOne({
        attributes:{exclude: ['userPassword']},
        where: {id:id}
    });
    res.json(user);
})

router.post("/register", async (req,res)=>{
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

router.post("/login", async (req,res)=>{
    const {email, userPassword} = req.body;
    const user = await Users.findOne({where:{email:email}});
    if(!user){
        res.json({error:"User does not exist!"})
    }else{
        bcrypt.compare(userPassword,user.userPassword).then((match)=>{
            if(!match){
                res.json({error:"Wrong username or password!"});
            }else{
                const accessToken = sign({email: user.email, id: user.id},
                    "veryimportantsecretmessage"
                );
                res.json(accessToken);
            }
        })
    }
})

module.exports = router