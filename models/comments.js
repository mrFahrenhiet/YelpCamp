var mongoose = require('mongoose');
//Declaring Schema
var commentSchema = new mongoose.Schema({
	text: String , 
	author: String,
	createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model("Comment", commentSchema); 