const {Restaurants} = require('../models/Restaurants')
const {Cuisines} = require('../models/Cuisines')
module.exports = (sequelize, DataTypes) =>{

    const RestaurantsCuisines = sequelize.define("RestaurantsCuisines",{
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

    return RestaurantsCuisines
}
