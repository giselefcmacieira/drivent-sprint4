import { getUserBooking } from "@/controllers";
import { authenticateToken } from "@/middlewares";
import { Router } from "express";


const bookingsRouter = Router()

bookingsRouter
    .all('/*', authenticateToken)
    .get('/', getUserBooking)


export { bookingsRouter }