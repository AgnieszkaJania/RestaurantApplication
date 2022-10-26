module.exports = (sequelize, DataTypes) =>{

    const Cuisines = sequelize.define("Cuisines",{
        cuisineName:{
            type: DataTypes.STRING,
            allowNull: false,
            unique:true
        },
    },
    { 
        timestamps: false 
    });
    Cuisines.associate =(models) =>{
        Cuisines.belongsToMany(models.Restaurants,{
            through: 'RestaurantsCuisines'
        });
        Cuisines.hasMany(models.RestaurantsCuisines,{
            onDelete: 'RESTRICT',
            foreignKey: {
                allowNull: false
            }
        });
    }
    
    return Cuisines
}
