import express from 'express'
import {getdashboardOverview} from '../controllers/dashboardController.js'
import authMiddleware from '../middleware/auth.js'

const dashboardRouter = express.Router()

dashboardRouter.get('/', authMiddleware, getdashboardOverview)

export default dashboardRouter