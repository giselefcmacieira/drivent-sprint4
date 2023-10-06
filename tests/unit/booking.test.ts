import { bookInfo, bookingsRepository } from "@/repositories"
import { bookingServices } from "@/services"
import { buildBookingReturn, buildRoomReturn, buildTicketReturn } from "../factories/booking-factory"
import faker from "@faker-js/faker"
import { TicketStatus } from "@prisma/client"

beforeEach(() => {
    jest.clearAllMocks();
})
afterAll(() => {
    jest.clearAllMocks();
})

describe('Booking Service test GET/booking', () => {
    it("should throw error when user has no booking", () => {
        jest
            .spyOn(bookingsRepository, "findUserBookings")
            .mockReturnValueOnce(null)
        const booking = bookingServices.findUserBookings(1)
        expect(bookingsRepository.findUserBookings).toBeCalled()
        expect(booking).rejects.toEqual({
            name: 'NotFoundError',
            message: 'This user has no booking yet!'
        })
    })
    it("should return the user booking when everything is ok", async () => {
        const userBookingMock = buildBookingReturn()
        jest
            .spyOn(bookingsRepository, "findUserBookings")
            .mockReturnValueOnce(userBookingMock)
        const booking = await bookingServices.findUserBookings(1)
        expect(bookingsRepository.findUserBookings).toBeCalledTimes(1)
        expect(booking).toEqual(expect.objectContaining({
            id: expect.any(Number),
            Room: expect.objectContaining({
                id: expect.any(Number),
                name: expect.any(String),
                capacity: expect.any(Number),
                hotelId: expect.any(Number),
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date)
            })
        }))
    })
})
describe('Booking Service test POST/booking', () => {
    it("should throw error when user's ticket is remote", () => {
        jest
            .spyOn(bookingsRepository, "findEnrollmentIdByUserId")
            .mockResolvedValueOnce({ id: 2 })
        const ticketMock = buildTicketReturn(TicketStatus.PAID, true, true)
        jest
            .spyOn(bookingsRepository, 'findTicketByEnrollmentId')
            .mockResolvedValueOnce(ticketMock)
        const booking = bookingServices.createBooking(1, 1)
        expect(bookingsRepository.findEnrollmentIdByUserId).toBeCalledTimes(1)
        expect(booking).rejects.toEqual({
            name: 'ForbiddenError',
            message: 'This user have a remote ticket and doesnt need to book a room'
        })
    })
    it("should throw error when user's ticket doesn't include hotel", () => {
        jest
            .spyOn(bookingsRepository, "findEnrollmentIdByUserId")
            .mockResolvedValueOnce({ id: 2 })
        const ticketMock = buildTicketReturn(TicketStatus.PAID, false, false)
        jest
            .spyOn(bookingsRepository, 'findTicketByEnrollmentId')
            .mockResolvedValueOnce({
                id: 1,
                ticketTypeId: 2,
                enrollmentId: 3,
                status: TicketStatus.PAID,
                createdAt: faker.date.recent(),
                updatedAt: faker.date.recent(),
                TicketType: {
                    id: 1,
                    name: 'string',
                    price: 2000,
                    isRemote: false,
                    includesHotel: false,
                    createdAt: faker.date.recent(),
                    updatedAt: faker.date.recent()
                }
            })
        const booking = bookingServices.createBooking(1, 1)
        expect(bookingsRepository.findEnrollmentIdByUserId).toBeCalledTimes(1)
        expect(booking).rejects.toEqual({
            name: 'ForbiddenError',
            message: "This user's ticket doesnt includes Hotel"
        })
    })
    it("should throw error when user's ticket is not paid", () => {
        jest
            .spyOn(bookingsRepository, "findEnrollmentIdByUserId")
            .mockResolvedValueOnce({ id: 2 })
        const ticketMock = buildTicketReturn(TicketStatus.RESERVED, false, true)
        jest
            .spyOn(bookingsRepository, 'findTicketByEnrollmentId')
            .mockResolvedValueOnce(ticketMock)
        const booking = bookingServices.createBooking(1, 1)
        expect(bookingsRepository.findEnrollmentIdByUserId).toBeCalledTimes(1)
        expect(booking).rejects.toEqual({
            name: 'ForbiddenError',
            message: "The user's ticket is not paid yet"
        })
    })
    it("should throw error when room doesn't exist", () => {
        jest
            .spyOn(bookingsRepository, "findEnrollmentIdByUserId")
            .mockResolvedValueOnce({ id: 2 })
        const ticketMock = buildTicketReturn()
        jest
            .spyOn(bookingsRepository, 'findTicketByEnrollmentId')
            .mockResolvedValueOnce(ticketMock)
        jest
            .spyOn(bookingsRepository, 'findRoomById')
            .mockResolvedValueOnce(null)
        const booking = bookingServices.createBooking(1, 1)
        expect(bookingsRepository.findEnrollmentIdByUserId).toBeCalledTimes(1)
        expect(booking).rejects.toEqual({
            name: 'NotFoundError',
            message: "The room searched does not exist"
        })
    })
    it("should throw error when room is already at its full capacity", () => {
        jest
            .spyOn(bookingsRepository, "findEnrollmentIdByUserId")
            .mockResolvedValueOnce({ id: 2 })
        const ticketMock = buildTicketReturn()
        jest
            .spyOn(bookingsRepository, 'findTicketByEnrollmentId')
            .mockResolvedValueOnce(ticketMock)
        const roomMock = buildRoomReturn(5)
        jest
            .spyOn(bookingsRepository, 'findRoomById')
            .mockResolvedValueOnce(roomMock)
        jest
            .spyOn(bookingsRepository, 'findNumberOfBookingsForARoom')
            .mockResolvedValueOnce(5)
        const booking = bookingServices.createBooking(1, 1)
        expect(bookingsRepository.findEnrollmentIdByUserId).toBeCalledTimes(1)
        expect(booking).rejects.toEqual({
            name: 'ForbiddenError',
            message: "This room is already at its full capacity"
        })
    })

})
describe('When everything is ok on POST/booking services', () => {
    it("Should return bookingId when everything is ok on POST/booking services", async () => {
        jest
            .spyOn(bookingsRepository, "findEnrollmentIdByUserId")
            .mockResolvedValueOnce({ id: 2 })
        const ticketMock = buildTicketReturn()
        jest
            .spyOn(bookingsRepository, 'findTicketByEnrollmentId')
            .mockResolvedValueOnce(ticketMock)
        const roomMock = buildRoomReturn(5)
        jest
            .spyOn(bookingsRepository, 'findRoomById')
            .mockResolvedValueOnce(roomMock)
        jest
            .spyOn(bookingsRepository, 'findNumberOfBookingsForARoom')
            .mockResolvedValueOnce(4)
        jest
            .spyOn(bookingsRepository, 'createBooking')
            .mockResolvedValueOnce({ id: 7 })
        const booking = await bookingServices.createBooking(1, 1)
        expect(bookingsRepository.findEnrollmentIdByUserId).toBeCalledTimes(1)
        expect(booking).toEqual({
            id: 7
        })
    })
})
describe('Booking Service test PUT/booking', () => {
    it('should throw an error when user doesnt have a booking', () => {
        jest
            .spyOn(bookingsRepository, 'findUserBookings')
            .mockResolvedValueOnce(null)
        const booking = bookingServices.updateBooking(1, 1, 1)
        expect(bookingsRepository.findUserBookings).toBeCalled()
        expect(booking).rejects.toEqual({
            name: 'ForbiddenError',
            message: "This user doesn't have a booking"
        })
    })
    it('should throw an error when room doesnt exist', () => {
        const userBookingMock = buildBookingReturn()
        jest
            .spyOn(bookingsRepository, 'findUserBookings')
            .mockResolvedValueOnce(userBookingMock)
        jest
            .spyOn(bookingsRepository, 'findRoomById')
            .mockResolvedValueOnce(null)
        const booking = bookingServices.updateBooking(1, 1, 1)
        expect(bookingsRepository.findUserBookings).toBeCalled()
        expect(booking).rejects.toEqual({
            name: 'NotFoundError',
            message: "This room was not found"
        })
    })
    it('should throw an error when room is already at its full capacity', () => {
        const userBookingMock = buildBookingReturn()
        jest
            .spyOn(bookingsRepository, 'findUserBookings')
            .mockResolvedValueOnce(userBookingMock)
        const roomMock = buildRoomReturn(5)
        jest
            .spyOn(bookingsRepository, 'findRoomById')
            .mockResolvedValueOnce(roomMock)
        jest
            .spyOn(bookingsRepository, 'findNumberOfBookingsForARoom')
            .mockResolvedValueOnce(5)
        const booking = bookingServices.updateBooking(1, 1, 1)
        expect(bookingsRepository.findUserBookings).toBeCalled()
        expect(booking).rejects.toEqual({
            name: 'ForbiddenError',
            message: "This room is already at its full capacity"
        })
    })
    it('should return bookingId when everything is ok', async () => {
        const userBookingMock = buildBookingReturn()
        jest
            .spyOn(bookingsRepository, 'findUserBookings')
            .mockResolvedValueOnce(userBookingMock)
        const roomMock = buildRoomReturn(5)
        jest
            .spyOn(bookingsRepository, 'findRoomById')
            .mockResolvedValueOnce(roomMock)
        jest
            .spyOn(bookingsRepository, 'findNumberOfBookingsForARoom')
            .mockResolvedValueOnce(3)
        jest
            .spyOn(bookingsRepository, 'updateBooking')
            .mockResolvedValueOnce({ id: 7 })
        const booking = await bookingServices.updateBooking(1, 1, 1)
        expect(bookingsRepository.findUserBookings).toBeCalled()
        expect(booking).toEqual({
            id: 7
        })
    })
})