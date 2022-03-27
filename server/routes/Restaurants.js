const express = require('express');
const router = express.Router();
const multer = require("multer");


const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "public");
    },
    filename: (req, file, cb) => {
      const ext = file.mimetype.split("/")[1];
      cb(null, `images/${file.fieldname}-${file.originalname.split(".")[0]}-${Date.now()}.${ext}`);
    },
  });

  const multerFilter = (req, file, cb) => {
      const type = file.mimetype.split("/")[1]
    if ( type === "jpg" || type ==="jpeg" ||type === "png") {
      cb(null, true);
    } else {
        cb(null, false);
        return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  };

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
  });

router.get("/", async (req,res)=>{
    res.json("hello")
});

const uploadSingleImage = upload.single('Image');
//API endpoint for uploading file
router.post("/upload/image", (req,res) => {
    uploadSingleImage(req,res,function(err){
        if(err){
            return res.status(400).send({error: err.message})
        }
        res.status(200).json(req.file)
    });
   
});

module.exports = router

