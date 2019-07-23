var mongoose = require('mongoose');
//Declaring Schema
var yelpSchema = new mongoose.Schema({
    name: String ,
    price: Number,
    image: String ,
    description: String,
    createdAt: { type: Date, default: Date.now },
    author: {
    	id:{
    		type: mongoose.Schema.Types.ObjectId,
                 ref: "User"
    	} ,
    	username: String

    },
    comments: [{
    	         type: mongoose.Schema.Types.ObjectId,
                 ref: "Comment"
    }]
});
//Declaring Models
module.exports= mongoose.model("Camp", yelpSchema);