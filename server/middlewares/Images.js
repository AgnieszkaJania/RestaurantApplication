const multer = require("multer");

// multer to upload images
const multerStorageImage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "public");
    },
    filename: (req, file, cb) => {
      const ext = file.mimetype.split("/")[1];
      cb(null, `images/${file.fieldname}-${file.originalname.split(".")[0]}-${Date.now()}.${ext}`);
    },
  });

  const multerFilterImage = (req, file, cb) => {
      const type = file.mimetype.split("/")[1]
    if ( type === "jpg" || type ==="jpeg" ||type === "png") {
      cb(null, true);
    } else {
        cb(null, false);
        return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  };

const uploadImageConfig = multer({
    storage: multerStorageImage,
    fileFilter: multerFilterImage,
  });

const uploadImages = uploadImageConfig.array('Images',5);

module.exports = uploadImages
