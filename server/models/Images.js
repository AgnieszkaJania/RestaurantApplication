module.exports = (sequelize, DataTypes) =>{

    const Images = sequelize.define("Images",{
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
       
    });
    Images.associate =(models) =>{
        Images.belongsTo(models.Restaurants,{
            onDelete: 'CASCADE',
            foreignKey: {
                allowNull: false
            }
        });
    }
  
    return Images
}
