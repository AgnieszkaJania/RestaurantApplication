const express = require('express')
const router = express.Router()
const { Users } = require('../models')
const bcrypt = require('bcrypt');

router.get("/", async (req,res)=>{
    const listOfUsers = await Users.findAll();
    res.json(listOfUsers);
});

router.get("/:id",async (req,res)=>{
    const id = req.params.id;
    const user = await Users.findByPk(id);
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
        });
        res.json("User added")
    });
});

module.exports = router