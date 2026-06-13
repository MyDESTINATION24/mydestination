const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/mydestination')
  .then(() => {
    const LandingPageConfig = require('./modules/cms/models/LandingPageConfig');
    return LandingPageConfig.updateMany({}, { $set: { 'footer.companyName': 'My DESTINATION' } });
  })
  .then((res) => {
    console.log('Updated:', res.modifiedCount);
    process.exit(0);
  })
  .catch(console.error);
