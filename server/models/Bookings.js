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
        PIN:{
            type:DataTypes.STRING,
            allowNull:true
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
        Bookings.hasMany(models.BookingsHistories,{
            onDelete: 'RESTRICT'
        });
    }
    
    return Bookings
}
