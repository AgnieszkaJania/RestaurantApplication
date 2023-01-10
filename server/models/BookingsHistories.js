module.exports = (sequelize, DataTypes) =>{

    const BookingHistory = sequelize.define('BookingHistory',{
        oldPIN:{
            type:DataTypes.STRING(50),
            allowNull:false
        },
        CancelType:{
            type:DataTypes.CHAR(2),
            allowNull:false,
            validate:{
                isIn: [['CU', 'CR']]
            }
        },
        ChangeDate:{
            type:DataTypes.DATE,
            allowNull:false,
            defaultValue: DataTypes.NOW
        }
    },
    {
        tableName:'bookingshistories',
        timestamps:false 
    });
    
    BookingHistory.associate =(models) =>{
        BookingHistory.belongsTo(models.Booking,{
            onDelete: 'RESTRICT',
            foreignKey: {
                allowNull: false
            }
        });
        BookingHistory.belongsTo(models.User,{
            onDelete: 'RESTRICT',
            foreignKey: {
                allowNull: false
            }
        });
    }
    
    return BookingHistory;
}
