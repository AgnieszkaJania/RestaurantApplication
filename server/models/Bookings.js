module.exports = (sequelize, DataTypes) =>{

    const Bookings = sequelize.define("Bookings",{
        startTime:{
            type: DataTypes.DATE,
            allowNull: false
        },
        endTime:{
            type: DataTypes.DATE,
            allowNull: false
        },
    },
    { 
        timestamps: false 
    });
    Bookings.associate =(models) =>{
        Bookings.belongsTo(models.Tables,{
            onDelete: 'CASCADE',
            foreignKey: {
                allowNull: false
            }
        });
        Bookings.belongsTo(models.Statuses,{
            onDelete: 'RESTRICT',
            foreignKey: {
                allowNull: false
            }
        });
        Bookings.belongsTo(models.Users,{
            onDelete: 'CASCADE'
        });
        Bookings.associate =(models) =>{
            Bookings.belongsToMany(models.Cuisines,{through: 'RestaurantsCuisines'});
        };
    }
    
    return Bookings
}
