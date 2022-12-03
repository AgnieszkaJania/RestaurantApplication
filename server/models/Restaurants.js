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
        },
        is_active:{
            type:DataTypes.BOOLEAN,
            allowNull:false,
            defaultValue:true
        },
        restoreToken:{
            type:DataTypes.STRING,
            allowNull:true,
        },
        restoreTokenExpirationDate:{
            type:DataTypes.DATE,
            allowNull:true,
        },
        resetPasswordToken:{
            type:DataTypes.STRING,
            allowNull:true,
        },
        resetPasswordTokenExpirationDate:{
            type:DataTypes.DATE,
            allowNull:true,
        }
    },
    {
        timestamps: false 
    });
    Restaurants.associate= (models) =>{
        Restaurants.hasMany(models.Images,{
           onDelete: 'CASCADE',
           foreignKey: {
                allowNull: false
            }
        });
        Restaurants.hasMany(models.Menus,{
            onDelete: 'CASCADE',
            foreignKey: {
                 allowNull: false
            }
        });
        Restaurants.hasMany(models.Tables,{
            onDelete: 'CASCADE',
            foreignKey: {
                 allowNull: false
            }
        });
        Restaurants.hasMany(models.RestaurantsCuisines,{
            onDelete: 'RESTRICT',
            foreignKey: {
                 allowNull: false
            }
        });
    };

 
    return Restaurants
}