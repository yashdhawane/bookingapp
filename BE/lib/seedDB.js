import { db } from '../lib/prisma.js';

export default async function initializeSeats() {
    try {
        // Check if seats already exist
        const existingSeats = await db.seat.count();
        if (existingSeats > 0) {
            console.log('Seats already initialized');
            return;
        }

        // Create seats for all rows
        for (let row = 1; row <= 11; row++) {
            const seatsInRow = row === 11 ? 3 : 7; // Last row has 3 seats
            
            for (let seatNumber = 1; seatNumber <= seatsInRow; seatNumber++) {
                await db.seat.create({
                    data: {
                        row: row,
                        number: seatNumber,
                    }
                });
            }
        }
        
        console.log('Successfully initialized 80 seats');
    } catch (error) {
        console.error('Error initializing seats:', error);
    } finally {
        await db.$disconnect();
    }
}

