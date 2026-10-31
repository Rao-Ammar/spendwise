import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    type: {
      type: String,
      default: "income",
    },
  },
  { timestamps: true } // schema options go in the 2nd argument, not inside the fields
);

// speeds up "this user's income, newest first" and date-range queries
incomeSchema.index({ userId: 1, date: -1 });

const incomeModel = mongoose.model("income", incomeSchema);

export default incomeModel;