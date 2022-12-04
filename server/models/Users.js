const { DataTypes } = require("sequelize"); 
module.exports = (sequelize, DataTypes) =>{

    const Users = sequelize.define("Users",{
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
        timestamps: false 
    });
    Users.associate =(models) =>{
        Users.hasMany(models.Bookings,{
            onDelete: 'CASCADE'
        });
        Users.hasMany(models.BookingsHistories,{
            onDelete: 'RESTRICT'
        });
    }

    return Users
}