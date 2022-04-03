const multer = require("multer");

//multer to upload menu

const multerStorageMenu = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `files/${file.fieldname}-${file.originalname.split(".")[0]}-${Date.now()}.${ext}`);
  },
});

const multerFilterMenu = (req, file, cb) => {
    const type = file.mimetype.split("/")[1]
  if ( type === "pdf") {
    cb(null, true);
  } else {
      cb(null, false);
      return cb(new Error('Only .pdf format allowed!'));
  }
};

const uploadMenuConfig = multer({
  storage: multerStorageMenu,
  fileFilter: multerFilterMenu,
});

const uploadMenu = uploadMenuConfig.array('Menu',4);

module.exports = uploadMenu;