import express from "express";
import {
 addExpense,
  getExpense,
    updateExpense,
    deleteExpense,
    downloadExpenseData,
    getExpenseOverview
} from "../controllers/expenseController.js";

import authMiddleware from "../middleware/auth.js";

const expenseRouter = express.Router();

expenseRouter.post("/add", authMiddleware, addExpense);
expenseRouter.get("/get", authMiddleware, getExpense);

expenseRouter.put("/update/:id", authMiddleware, updateExpense);
expenseRouter.delete("/delete/:id", authMiddleware, deleteExpense);

expenseRouter.get("/download", authMiddleware, downloadExpenseData);
expenseRouter.get("/overview", authMiddleware, getExpenseOverview);

export default expenseRouter;