module.exports = (sequelize, DataTypes) =>{

    const Restaurants = sequelize.define("Restaurants",{
        restaurantName:{
            type: DataTypes.STRING,
            allowNull: false,
            unique:true
        },
        ownerFirstName:{
            type: DataTypes.STRING,
            allowNull: false
        },
        ownerLastName:{
            type: DataTypes.STRING,
            allowNull: false
        },
        ownerPassword:{
            type: DataTypes.STRING,
            allowNull: false
        },
        street:{
            type: DataTypes.STRING,
            allowNull: false,
        },
        propertyNumber:{
            type: DataTypes.STRING(3),
            allowNull: false,
        },
        postalCode:{
            type:DataTypes.STRING(5),
            allowNull:false
        },
        city:{
            type:DataTypes.STRING,
            allowNull:false
        },
        restaurantPhoneNumber:{
            type: DataTypes.STRING,
            allowNull: false,
        },
        restaurantEmail:{
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        facebookLink:{
            type: DataTypes.STRING,
        },
        instagramLink:{
            type: DataTypes.STRING,
        }
    });
    Restaurants.associate= (models) =>{
        Restaurants.hasMany(models.Images,{
           onDelete: 'CASCADE',
           foreignKey: {
                allowNull: false
            }
        });
    };
    Restaurants.associate= (models) =>{
        Restaurants.hasMany(models.Menus,{
           onDelete: 'CASCADE',
           foreignKey: {
                allowNull: false
            }
        });
    };
 
    return Restaurants
}