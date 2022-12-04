module.exports = (sequelize, DataTypes) =>{

    const BookingsHistories = sequelize.define("BookingsHistories",{
        oldPIN:{
            type:DataTypes.STRING,
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
        timestamps: false 
    });
    BookingsHistories.associate =(models) =>{
        BookingsHistories.belongsTo(models.Bookings,{
            onDelete: 'RESTRICT',
            foreignKey: {
                allowNull: false
            }
        });
        BookingsHistories.belongsTo(models.Users,{
            onDelete: 'RESTRICT',
            foreignKey: {
                allowNull: false
            }
        });
    }
    
    return BookingsHistories
}
