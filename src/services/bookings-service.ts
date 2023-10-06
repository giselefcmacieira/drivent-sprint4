import { forbiddenError, notFoundError } from "@/errors";
import { bookingsRepository } from "@/repositories";
import { TicketStatus } from "@prisma/client";

async function findUserBookings(userId: number) {
    const booking = await bookingsRepository.findUserBookings(userId)
    if (!booking) throw notFoundError('This user has no booking yet!')
    return booking
}

async function createBooking(userId: number, roomId: number) {
    const enrollment = await bookingsRepository.findEnrollmentIdByUserId(userId)
    const { id, status, TicketType } = await bookingsRepository.findTicketByEnrollmentId(enrollment.id)
    const { isRemote, includesHotel } = TicketType
    if (isRemote) throw forbiddenError('This user have a remote ticket and doesnt need to book a room')
    if (!includesHotel) throw forbiddenError("This user's ticket doesnt includes Hotel")
    if (status !== TicketStatus.PAID) throw forbiddenError("The user's ticket is not paid yet")
    const room = await bookingsRepository.findRoomById(roomId)
    if (!room) throw notFoundError('The room searched does not exist')
    const numOfBookingsForThisRoom = await bookingsRepository.findNumberOfBookingsForARoom(roomId)
    const { capacity } = room
    if (numOfBookingsForThisRoom >= capacity) throw forbiddenError('This room is already at its full capacity')
    const booking = await bookingsRepository.createBooking(userId, roomId)
    return booking
}

async function updateBooking(bookingId: number, roomId: number, userId: number) {
    const userBooking = await bookingsRepository.findUserBookings(userId)
    if (!userBooking) throw forbiddenError("This user doesn't have a booking")
    const room = await bookingsRepository.findRoomById(roomId)
    if (!room) throw notFoundError('This room was not found')
    const numOfBookingsForThisRoom = await bookingsRepository.findNumberOfBookingsForARoom(roomId)
    const { capacity } = room
    if (numOfBookingsForThisRoom >= capacity) throw forbiddenError('This room is already at its full capacity')
    const booking = await bookingsRepository.updateBooking(bookingId, roomId)
    return booking
}

export const bookingServices = { findUserBookings, createBooking, updateBooking }