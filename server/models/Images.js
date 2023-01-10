module.exports = (sequelize, DataTypes) =>{

    const Image = sequelize.define('Image',{
        imageName:{
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        imagePath:{
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        imageOriginalName:{
            type: DataTypes.STRING,
            allowNull: false
        },
       
    },
    {
        tableName: 'images',
        timestamps:false 
    });

    Image.associate =(models) =>{
        Image.belongsTo(models.Restaurant,{
            onDelete: 'RESTRICT',
            foreignKey: {
                allowNull: false
            }
        });
    }
  
    return Image;
}
