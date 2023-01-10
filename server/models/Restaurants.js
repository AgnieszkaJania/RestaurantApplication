module.exports = (sequelize, DataTypes) =>{

    const Restaurant = sequelize.define('Restaurant',{
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
            type: DataTypes.STRING,
            allowNull: false,
        },
        flatNumber:{
            type: DataTypes.STRING,
            allowNull: true,
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
        tableName:'restaurants',
        timestamps:false 
    });

    Restaurant.associate= (models) =>{
        Restaurant.hasMany(models.Image,{
           onDelete: 'RESTRICT',
           foreignKey: {
                allowNull: false
            }
        });
        Restaurant.hasMany(models.Menu,{
            onDelete: 'RESTRICT',
            foreignKey: {
                 allowNull: false
            }
        });
        Restaurant.hasMany(models.Table,{
            onDelete: 'RESTRICT',
            foreignKey: {
                 allowNull: false
            }
        });
        Restaurant.hasMany(models.RestaurantCuisine,{
            onDelete: 'RESTRICT',
            foreignKey: {
                 allowNull: false
            }
        });
    };

 
    return Restaurant;
}