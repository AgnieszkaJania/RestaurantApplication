const jwt  = require("jsonwebtoken");

const validateToken = (req,res,next) => {
    const accessToken = req.cookies["access-token"];

    if(!accessToken){
        return res.status(400).json({auth: false, error: "User not logged in!"});
    }else{
        jwt.verify(accessToken,"veryimportantsecretmessage", (error, decoded)=>{
            if(error){
                res.json({auth: false, error: "Failed to authenticate"})
            }else{
                req.auth = true;
                req.userId = decoded.id;
                return next();
            }
        });
    }

       
       

};

module.exports = {validateToken};