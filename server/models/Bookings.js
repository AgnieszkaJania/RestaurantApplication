module.exports = (sequelize, DataTypes) =>{

    const Booking = sequelize.define('Booking',{
        startTime:{
            type: DataTypes.DATE,
            allowNull: false
        },
        endTime:{
            type: DataTypes.DATE,
            allowNull: false
        },
        PIN:{
            type:DataTypes.STRING(50),
            allowNull: true
        },
    },
    { 
        tableName: 'bookings',
        timestamps:false 
    });
    
    Booking.associate =(models) =>{
        Booking.belongsTo(models.Table,{
            onDelete: 'RESTRICT',
            foreignKey: {
                allowNull: false
            }
        });
        Booking.belongsTo(models.Status,{
            onDelete: 'RESTRICT',
            foreignKey: {
                allowNull: false
            }
        });
        Booking.belongsTo(models.User,{
            onDelete: 'RESTRICT'
        });
        Booking.hasMany(models.BookingHistory,{
            onDelete: 'RESTRICT',
            foreignKey: {
                allowNull: false
            }
        });
    }
    
    return Booking;
}
