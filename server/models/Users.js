
module.exports = (sequelize, DataTypes) =>{

    const User = sequelize.define('User',{
        firstName:{
            type: DataTypes.STRING,
            allowNull: false
        },
        lastName:{
            type: DataTypes.STRING,
            allowNull: false
        },
        userPassword:{
            type: DataTypes.STRING,
            allowNull: false
        },
        phoneNumber:{
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        email:{
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        is_active:{
            type:DataTypes.BOOLEAN,
            allowNull:false,
            defaultValue:true
        },
        restoreToken:{
            type:DataTypes.STRING,
            allowNull:true,
        },
        restoreTokenExpirationDate:{
            type:DataTypes.DATE,
            allowNull:true,
        },
        resetPasswordToken:{
            type:DataTypes.STRING,
            allowNull:true,
        },
        resetPasswordTokenExpirationDate:{
            type:DataTypes.DATE,
            allowNull:true,
        }
    },
    {
        tableName:'users',
        timestamps:false 
    });

    User.associate =(models) =>{
        User.hasMany(models.Booking,{
            onDelete: 'RESTRICT'
        });
        User.hasMany(models.BookingHistory,{
            onDelete: 'RESTRICT',
            foreignKey: {
                allowNull: false
            }
        });
    }

    return User;
}