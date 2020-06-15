module.exports = {
  getError(errors, prop){
    try {
      console.log(errors)
      console.log(prop)
      return errors.mapped()[prop].msg;
    } catch (err) {
      console.log(err)
      return '';
    }
  }
}