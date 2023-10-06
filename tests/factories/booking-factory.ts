import { faker } from '@faker-js/faker'
import { TicketStatus } from '@prisma/client'

export async function buildBookingReturn() {
    return {
        id: faker.datatype.number({ min: 1, max: 1000 }),
        Room: {
            id: faker.datatype.number({ min: 1, max: 1000 }),
            name: faker.name.firstName(),
            capacity: faker.datatype.number({ min: 1, max: 6 }),
            hotelId: faker.datatype.number({ min: 1, max: 12 }),
            createdAt: faker.date.recent(),
            updatedAt: faker.date.recent()
        }
    }
}

export async function buildTicketReturn(status?: TicketStatus, isRemote?: boolean, includesHotel?: boolean) {
    return {
        id: faker.datatype.number({ min: 1, max: 1000 }),
        ticketTypeId: faker.datatype.number({ min: 1, max: 1000 }),
        enrollmentId: faker.datatype.number({ min: 1, max: 1000 }),
        status: status || TicketStatus.PAID,
        createdAt: faker.date.recent(),
        updatedAt: faker.date.recent(),
        TicketType: {
            id: faker.datatype.number({ min: 1, max: 1000 }),
            name: faker.name.firstName(),
            price: faker.datatype.number({ min: 1, max: 1000 }),
            isRemote: isRemote || false,
            includesHotel: includesHotel ? includesHotel : true,
            createdAt: faker.date.recent(),
            updatedAt: faker.date.recent(),
        }
    }
}

export async function buildRoomReturn(capacity?: number) {
    return {
        id: faker.datatype.number({ min: 1, max: 1000 }),
        name: faker.name.firstName(),
        capacity: capacity || faker.datatype.number({ min: 1, max: 1000 }),
        hotelId: faker.datatype.number({ min: 1, max: 1000 }),
        createdAt: faker.date.recent(),
        updatedAt: faker.date.recent()
    }
}