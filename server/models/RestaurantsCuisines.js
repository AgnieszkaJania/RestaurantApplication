const {Restaurant} = require('../models/Restaurants')
const {Cuisine} = require('../models/Cuisines')
module.exports = (sequelize, DataTypes) =>{

    const RestaurantCuisine = sequelize.define('RestaurantCuisine',{
        id:{
            type:DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        RestaurantId:{
            type: DataTypes.INTEGER,
            references:{
                model:Restaurant,
                key: 'id'
            }
        },
        CuisineId:{
            type: DataTypes.INTEGER,
            references:{
                model:Cuisine,
                key:'id'
            }
        }
    },
    {
        tableName: 'restaurantscuisines',
        timestamps:false 
    });

    RestaurantCuisine.associate =(models) =>{
        RestaurantCuisine.belongsTo(models.Restaurant,{
            onDelete: 'RESTRICT',
            foreignKey: {
                allowNull: false
            }
        });
        RestaurantCuisine.belongsTo(models.Cuisine,{
            onDelete: 'RESTRICT',
            foreignKey: {
                allowNull: false
            }
        });
    };
    
    return RestaurantCuisine;
}
