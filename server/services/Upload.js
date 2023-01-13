const { Image, Menu} = require('../models');

async function createImages(imageList){
    await Image.bulkCreate(imageList);

}

async function createMenus(menuList){
    await Menu.bulkCreate(menuList);
}

async function getImagesByRestaurantId(restaurantId){
    const images = await Image.findAll({
        where: {RestaurantId:restaurantId}
    });
    return images;
}

async function getMenusByRestaurantId(restaurantId){
    const menus = await Menu.findAll({
        where:{RestaurantId:restaurantId}
    });
    return menus;
}

async function getImageById(id){
    const image = await Image.findByPk(id);
    return image;
}

async function deleteImage(image){
    await image.destroy();
}

async function getMenuById(id){
    const menu = await Menu.findByPk(id);
    return menu;
}

async function deleteMenu(menu){
    await menu.destroy();
}

module.exports = {
    createImages: createImages,
    createMenus: createMenus,
    getImagesByRestaurantId: getImagesByRestaurantId,
    getMenusByRestaurantId: getMenusByRestaurantId,
    getImageById: getImageById,
    deleteImage: deleteImage,
    getMenuById: getMenuById,
    deleteMenu: deleteMenu
}