const {Restaurants} = require('../models/Restaurants')
const {Cuisines} = require('../models/Cuisines')
module.exports = (sequelize, DataTypes) =>{

    const RestaurantsCuisines = sequelize.define("RestaurantsCuisines",{
        id:{
            type:DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        RestaurantId:{
            type: DataTypes.INTEGER,
            references:{
                model:Restaurants,
                key: 'id'
            }
        },
        CuisineId:{
            type: DataTypes.INTEGER,
            references:{
                model:Cuisines,
                key:'id'
            }
        }
    },
    { 
        timestamps: false 
    });
    RestaurantsCuisines.associate =(models) =>{
        RestaurantsCuisines.belongsTo(models.Restaurants,{
            onDelete: 'RESTRICT',
            foreignKey: {
                allowNull: false
            }
        });
        RestaurantsCuisines.belongsTo(models.Cuisines,{
            onDelete: 'RESTRICT',
            foreignKey: {
                allowNull: false
            }
        });
    }
    
    return RestaurantsCuisines
}
