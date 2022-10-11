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
        Cuisines.belongsToMany(models.Restaurants,{through: 'RestaurantsCuisines'});
    }
    
    return Cuisines
}
