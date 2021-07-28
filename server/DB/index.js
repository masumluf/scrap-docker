const mongoose=require('mongoose');
const config=require('../config/key')

mongoose.connect(config.mongoURL,
    {useNewUrlParser:true, useUnifiedTopology: true
}).then(()=> console.log("Mongo DB connected") )
    .catch(err=> console.log(err));
