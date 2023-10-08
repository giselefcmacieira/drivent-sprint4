import { prisma } from "@/config";
import { Booking, Room, Ticket, TicketType } from "@prisma/client";

export type bookInfo = { id: number, Room: Room }

async function findUserBookings(userId: number): Promise<bookInfo> {
    const result = await prisma.booking.findFirst({
        where: { userId },
        include: { Room: true }
    })
    if (result) {
        delete result.userId
        delete result.roomId
        delete result.createdAt
        delete result.updatedAt
    }

    return result
}

async function createBooking(userId: number, roomId: number) {
    const result = await prisma.booking.create({
        data: {
            userId,
            roomId
        },
        select: {
            id: true
        }
    })
    return result
}

async function findRoomById(roomId: number) {
    const result = await prisma.room.findFirst({
        where: { id: roomId }
    })
    return result
}

async function findNumberOfBookingsForARoom(roomId: number) {
    const result = await prisma.booking.count({
        where: { roomId }
    })
    return result
}

async function findEnrollmentIdByUserId(userId: number) {
    const result = await prisma.enrollment.findFirst({
        where: { userId },
        select: { id: true }
    })
    return result
}

async function findTicketByEnrollmentId(enrollmentId: number) {
    const result = await prisma.ticket.findFirst({
        where: { enrollmentId },
        include: { TicketType: true }
    })
    return result
}

async function updateBooking(bookingId: number, roomId: number) {
    const result = await prisma.booking.update({
        data: {
            roomId
        },
        where: { id: Number(bookingId) },
        select: { id: true }
    })
    return result
}

export const bookingsRepository = {
    findUserBookings,
    createBooking,
    findRoomById,
    findNumberOfBookingsForARoom,
    findEnrollmentIdByUserId,
    findTicketByEnrollmentId,
    updateBooking
}