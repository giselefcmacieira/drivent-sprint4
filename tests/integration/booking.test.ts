import app, { init } from "@/app";
import { cleanDb, generateValidToken } from "../helpers";
import supertest from "supertest";
import httpStatus from "http-status";
import faker from "@faker-js/faker";
import { createEnrollmentWithAddress, createTicket, createTicketType, createUser } from "../factories";
import * as jwt from 'jsonwebtoken';
import { buildBookingReturn, createUserBooking } from "../factories/booking-factory";
import { createHotel, createRoomWithHotelId } from "../factories/hotels-factory";
import { createECDH } from "crypto";
import { TicketStatus } from "@prisma/client";

beforeAll(async () => {
    await init();
});

beforeEach(async () => {
    await cleanDb();
});

const server = supertest(app)

describe("GET/booking", () => {
    it('should respond with status 401 if no token is given', async () => {
        const response = await server.get('/booking');

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if given token is not valid', async () => {
        const token = faker.lorem.word();

        const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if there is no session for given token', async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

        const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    describe('when token is valid', () => {
        it('should respond with status 404 when user does not have a booking', async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(httpStatus.NOT_FOUND)
        })
        it("should return booking information when everything is ok", async () => {
            const user = await createUser();
            const token = await generateValidToken(user)
            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id)
            await createUserBooking(user.id, room.id)
            const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(httpStatus.OK)
            expect(response.body).toEqual(expect.objectContaining({
                id: expect.any(Number),
                Room: expect.objectContaining({
                    id: expect.any(Number),
                    name: expect.any(String),
                    capacity: expect.any(Number),
                    hotelId: expect.any(Number),
                    createdAt: expect.any(String),
                    updatedAt: expect.any(String)
                })
            }))
        })
    })
})

describe('POST /booking', () => {
    it('should respond with status 401 if no token is given', async () => {
        const response = await server.post('/booking');

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if given token is not valid', async () => {
        const token = faker.lorem.word();

        const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if there is no session for given token', async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

        const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    describe('when token is valid', () => {
        it("should respond with status 403 when user's ticket isRemote", async () => {
            const user = await createUser();
            const token = await generateValidToken(user)
            const enrollment = await createEnrollmentWithAddress(user)
            const ticketType = await createTicketType(true, true)
            await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id)
            const response = await server.post('/booking')
                .set('Authorization', `Bearer ${token}`)
                .send({ roomId: room.id })
            expect(response.status).toBe(httpStatus.FORBIDDEN)
        })
        it("should respond with status 403 when user's ticket don't include hotel", async () => {
            const user = await createUser();
            const token = await generateValidToken(user)
            const enrollment = await createEnrollmentWithAddress(user)
            const ticketType = await createTicketType(false, false)
            await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id)
            const response = await server.post('/booking')
                .set('Authorization', `Bearer ${token}`)
                .send({ roomId: room.id })
            expect(response.status).toBe(httpStatus.FORBIDDEN)
        })
        it("should respond with status 403 when user's ticket is not paid yet", async () => {
            const user = await createUser();
            const token = await generateValidToken(user)
            const enrollment = await createEnrollmentWithAddress(user)
            const ticketType = await createTicketType(false, true)
            await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED)
            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id)
            const response = await server.post('/booking')
                .set('Authorization', `Bearer ${token}`)
                .send({ roomId: room.id })
            expect(response.status).toBe(httpStatus.FORBIDDEN)
        })
        it("should respond with status 403 when desired room doesn't exist", async () => {
            const user = await createUser();
            const userA = await createUser();
            const userB = await createUser();
            const token = await generateValidToken(user)
            const enrollment = await createEnrollmentWithAddress(user)
            const ticketType = await createTicketType(false, true)
            await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id, 2)
            await createUserBooking(userA.id, room.id)
            await createUserBooking(userB.id, room.id)
            const response = await server.post('/booking')
                .set('Authorization', `Bearer ${token}`)
                .send({ roomId: room.id })
            expect(response.status).toBe(httpStatus.FORBIDDEN)
        })
        it('should return bookingId when everything is ok', async () => {
            const user = await createUser();
            const token = await generateValidToken(user)
            const enrollment = await createEnrollmentWithAddress(user)
            const ticketType = await createTicketType(false, true)
            await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id, 2)
            const response = await server.post('/booking')
                .set('Authorization', `Bearer ${token}`)
                .send({ roomId: room.id })
            expect(response.status).toBe(httpStatus.OK)
            expect(response.body).toEqual(expect.objectContaining({
                bookingId: expect.any(Number)
            }))
        })
    })
})

describe('PUT /booking', () => {
    it('should respond with status 401 if no token is given', async () => {
        const response = await server.put('/booking');

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if given token is not valid', async () => {
        const token = faker.lorem.word();

        const response = await server.put('/booking').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if there is no session for given token', async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

        const response = await server.put('/booking').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    describe('when token is valid', () => {
        it("should respond with status 403 when user doesn't have a booking", async () => {
            const user = await createUser();
            const token = await generateValidToken(user)
            const response = await server.put(`/booking/1`)
                .set('Authorization', `Bearer ${token}`)
                .send({ roomId: 1 })
            expect(response.status).toBe(httpStatus.FORBIDDEN)
        })
        it("should respond with status 404 when desired room doesn't exist", async () => {
            const user = await createUser();
            const token = await generateValidToken(user)
            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id)
            const booking = await createUserBooking(user.id, room.id)
            const response = await server.put(`/booking/${booking.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ roomId: room.id + 1 })
            expect(response.status).toBe(httpStatus.NOT_FOUND)
        })
        it("should respond with status 403 when desired room is already at its full capcity", async () => {
            const user = await createUser();
            const userA = await createUser();
            const userB = await createUser();
            const token = await generateValidToken(user)
            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id, 2)
            await createUserBooking(userA.id, room.id)
            await createUserBooking(userB.id, room.id)
            const booking = await createUserBooking(user.id, room.id)
            const response = await server.put(`/booking/${booking.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ roomId: room.id })
            expect(response.status).toBe(httpStatus.FORBIDDEN)
        })
        it("should update booking when everything is ok", async () => {
            const user = await createUser();
            const token = await generateValidToken(user)
            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id)
            const booking = await createUserBooking(user.id, room.id)
            const response = await server.put(`/booking/${Number(booking.id)}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ roomId: room.id })
            expect(response.status).toBe(httpStatus.OK)
            expect(response.body).toEqual(expect.objectContaining({
                bookingId: expect.any(Number)
            }))
        })
    })
})