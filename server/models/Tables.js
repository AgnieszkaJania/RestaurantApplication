module.exports = (sequelize, DataTypes) =>{

    const Tables = sequelize.define("Tables",{
        tableName:{
            type: DataTypes.STRING,
            allowNull: false
        },
        quantity:{
            type: DataTypes.TINYINT,
            allowNull: false
        }, 
    });
    Tables.associate =(models) =>{
        Tables.belongsTo(models.Restaurants,{
            onDelete: 'CASCADE',
            foreignKey: {
                allowNull: false
            }
        });
        Tables.hasMany(models.Bookings,{
            onDelete: 'CASCADE',
            foreignKey: {
                 allowNull: false
            }
        });
    }
    
    return Tables
}
