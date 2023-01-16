const { Image, Menu} = require('../models');

async function createImages(imageList){
    const addedImages = await Image.bulkCreate(imageList);
    return addedImages;

}

async function createMenus(menuList){
    const addedMenus = await Menu.bulkCreate(menuList);
    return addedMenus;
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