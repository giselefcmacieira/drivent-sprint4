import { getUserBooking, postBooking } from "@/controllers";
import { authenticateToken } from "@/middlewares";
import { Router } from "express";


const bookingsRouter = Router()

bookingsRouter
    .all('/*', authenticateToken)
    .get('/', getUserBooking)
    .post('/', postBooking)
    .put('/:bookingId')

export { bookingsRouter }