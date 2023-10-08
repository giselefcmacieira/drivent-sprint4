import { AuthenticatedRequest } from "@/middlewares";
import { bookingServices } from "@/services";
import { Response } from "express";
import httpStatus from "http-status";

export async function getUserBooking(req: AuthenticatedRequest, res: Response) {
    const { userId } = req;
    const booking = await bookingServices.findUserBookings(userId)
    return res.status(httpStatus.OK).send(booking)
}

export async function postBooking(req: AuthenticatedRequest, res: Response) {
    const { userId, body } = req
    const { roomId } = body
    const booking = await bookingServices.createBooking(userId, roomId)
    return res.status(httpStatus.OK).send({ bookingId: booking.id })
}

export async function putBooking(req: AuthenticatedRequest, res: Response) {
    const { userId } = req
    const roomId = Number(req.body.roomId)
    const bookingId = parseInt(req.params.bookingId) as number;
    const booking = await bookingServices.updateBooking(bookingId, roomId, userId)
    return res.status(httpStatus.OK).send({ bookingId: booking.id })
}

/* export async function testBooking(req: AuthenticatedRequest, res: Response) {
    const { userId } = req
    const roomId = Number(req.body.roomId)
    const bookingId = parseInt(req.params.bookingId) as number;
    const booking = await bookingServices.updateBooking(bookingId, roomId, userId)
    return res.send(booking)
} */