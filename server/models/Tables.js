module.exports = (sequelize, DataTypes) =>{

    const Table = sequelize.define('Table',{
        tableName:{
            type: DataTypes.STRING,
            allowNull: false
        },
        quantity:{
            type: DataTypes.TINYINT,
            allowNull: false
        }, 
    },
    {
        tableName:'tables',
        timestamps:false 
    });

    Table.associate =(models) =>{
        Table.belongsTo(models.Restaurant,{
            onDelete: 'RESTRICT',
            foreignKey: {
                allowNull: false
            }
        });
        Table.hasMany(models.Booking,{
            onDelete: 'RESTRICT',
            foreignKey: {
                 allowNull: false
            }
        });
    };
    
    return Table;
}
