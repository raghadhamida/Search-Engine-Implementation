//Import mongoose module
import { Schema, model} from 'mongoose';
//https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/mongoose

// Define Mongoose schema and model for storing pages
const pagesSchema = new Schema({
    title: String,
    url: String,
    content: String,
    outGoingLinks: [String],
    incomingLinks: [String],
    pr: Number
});



//Export the default so it can be imported
export default model("pages", pagesSchema);