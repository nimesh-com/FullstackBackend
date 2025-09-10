import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true, 
    },
    userId: {   
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,         
    },
  
    review: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

const Review = mongoose.model("reviews", reviewSchema);
export default Review;