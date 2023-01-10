module.exports = (sequelize, DataTypes) =>{

    const Status = sequelize.define('Status',{
        status:{
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
    },
    {
        tableName:'statuses',
        timestamps:false 
    });

    Status.associate = (models) => {
        Status.hasMany(models.Booking,{
            onDelete: 'RESTRICT',
            foreignKey: {
                 allowNull: false
            }
        });
    };
    
    return Status;
}
