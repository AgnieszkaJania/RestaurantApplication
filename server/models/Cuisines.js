module.exports = (sequelize, DataTypes) =>{

    const Cuisine = sequelize.define('Cuisine',{
        cuisineName:{
            type: DataTypes.STRING,
            allowNull: false,
            unique:true
        },
    },
    {
        tableName:'cuisines',
        timestamps:false 
    });
    
    Cuisine.associate =(models) =>{
        Cuisine.belongsToMany(models.Restaurant,{
            through: 'RestaurantCuisine',
            onDelete: 'RESTRICT'
        });
        Cuisine.hasMany(models.RestaurantCuisine,{
            onDelete: 'RESTRICT',
            foreignKey: {
                allowNull: false
            }
        });
    }
    
    return Cuisine;
}
