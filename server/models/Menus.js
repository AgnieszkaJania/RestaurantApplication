module.exports = (sequelize, DataTypes) =>{

    const Menu = sequelize.define('Menu',{
        menuName:{
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        menuPath:{
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        menuOriginalName:{
            type: DataTypes.STRING,
            allowNull: false
        },
       
    },
    {
        tableName:'menus',
        timestamps:false 
    });

    Menu.associate =(models) =>{
        Menu.belongsTo(models.Restaurant,{
            onDelete: 'RESTRICT',
            foreignKey: {
                allowNull: false
            }
        });
    }
    
    return Menu;
}
