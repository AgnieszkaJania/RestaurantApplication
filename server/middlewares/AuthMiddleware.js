const {verify} = require("jsonwebtoken");

const validateToken = (req,res,next) => {
    const accessToken = req.header("accessToken");

    if(!accessToken){
        return res.jsnon({error: "User not logged in!"});
    }

    try{
        const validToken = verify(accessToken,"veryimportantsecretmessage");
        if(validToken){
            return next();
        }
    }catch(err){
        return res.json({error: err});
    }
};

module.exports = {validateToken};