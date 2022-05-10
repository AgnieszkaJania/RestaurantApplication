module.exports = (sequelize, DataTypes) =>{

    const Statuses = sequelize.define("Statuses",{
        status:{
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
    },
    { 
        timestamps: false 
    });
    Statuses.associate = (models) => {
        Statuses.hasMany(models.Bookings,{
            onDelete: 'RESTRICT',
            foreignKey: {
                 allowNull: false
            }
        });
    }
    
    return Statuses
}
