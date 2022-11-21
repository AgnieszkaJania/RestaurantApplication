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
                req.userEmail = decoded.email;
                return next();
            }
        });
    }

};
const validateRestaurantToken = (req,res,next) => {
    const accessToken = req.cookies["access-token-restaurant"];

    if(!accessToken){
        return res.status(400).json({auth: false, error: "Restaurant not logged in!"});
    }else{
        jwt.verify(accessToken,"veryimportantsecretmessageforrestaurant", (error, decoded)=>{
            if(error){
                res.json({auth: false, error: "Failed to authenticate"})
            }else{
                req.auth = true;
                req.restaurantId = decoded.id;
                return next();
            }
        });
    }

};

const validateRestoreToken = (req,res,next) => {
    const restoreToken = req.cookies["restore-token"];

    if(!restoreToken){
        return res.status(400).json({auth: false, error: "Session ended. Try again!"});
    }else{
        jwt.verify(restoreToken,"restore", (error, decoded)=>{
            if(error){
                res.json({restored: false, error: "Failed to autenticate!"})
            }else{
                req.userEmail = decoded.email;
                return next();
            }
        });
    }

};

module.exports = {validateToken, validateRestaurantToken,validateRestoreToken};