function addHours(date, hours) {
    const dateCopy = new Date(date);
    dateCopy.setHours(dateCopy.getHours() + hours);
    return dateCopy;
  }

  module.exports = {
    addHours:addHours
  }