module.exports = (sequelize, DataTypes) =>{

    const Menus = sequelize.define("Menus",{
        menuName:{
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        menuPath:{
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        menuOriginalName:{
            type: DataTypes.STRING,
            allowNull: false
        },
       
    });
    Menus.associate =(models) =>{
        Menus.belongsTo(models.Restaurants,{
            onDelete: 'CASCADE',
            foreignKey: {
                allowNull: false
            }
        });
    }
    
    return Menus
}
