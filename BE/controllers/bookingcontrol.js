import { db } from '../lib/prisma.js';

export const book = async (req, res) => {
    try {
        const { numberOfSeats } = req.body;
        console.log(numberOfSeats)
        const userId = req.user?.userId; // From auth middleware
        console.log(userId)
        if (!userId) {
            return res.status(403).json({
                success: false,
                message: "Authentication required"
            });
        }

        // Add debug logs
        console.log('Booking request:', {
            numberOfSeats,
            userId,
            headers: req.headers
        });

        // Validate request
        if (!numberOfSeats || numberOfSeats < 1 || numberOfSeats > 7) {
            return res.status(400).json({
                success: false,
                message: "Please request between 1 and 7 seats"
            });
        }

        // Start a transaction
        const booking = await db.$transaction(async (prisma) => {
            // 1. Find available seats in same row
            const availableSeats = await findAvailableSeats(prisma, numberOfSeats);
            console.log(availableSeats)
            if (!availableSeats.length) {
                throw new Error("Not enough seats available");
            }

            // 2. Create booking
            const newBooking = await prisma.booking.create({
                data: {
                    userId: userId,
                    status: 'PENDING',
                }
            });

            console.log(newBooking)

            // 3. Book the seats
            const bookedSeatsPromises = availableSeats.map(seat => {
                return prisma.bookedSeat.create({
                    data: {
                        bookingId: newBooking.id,
                        seatId: seat.id
                    }
                });
            });

           

            await Promise.all(bookedSeatsPromises);

            // 4. Update booking status
            return await prisma.booking.update({
                where: { id: newBooking.id },
                data: { status: 'CONFIRMED' },
                include: {
                    bookedSeats: {
                        include: {
                            seat: true
                        }
                    }
                }
            });

        },{
            isolationLevel: 'Serializable', // Optional: Set isolation level for the transaction
            timeout:12000 ,// Optional: Set timeout for the transaction
            maxWait: 10000 // Optional: Set max wait time for the transaction
        });

        // console.log(updatedBooking)

        return res.status(200).json({
            success: true,
            message: "Booking successful",
            booking: booking
        });

    } catch (error) {
        console.error("Booking error:", error);
        return res.status(400).json({
            success: false,
            message: error.message || "Booking failed"
        });
    }
};

// Helper function to find available seats
async function findAvailableSeats(prisma, numberOfSeats) {
    // First try to find seats in the same row
    const rows = 11; // 10 rows of 7 seats + 1 row of 3 seats

    for (let row = 1; row <= rows; row++) {
        const seatsInRow = row === 11 ? 3 : 7; // Last row has 3 seats

        // Get all seats in current row that aren't booked
        const availableSeatsInRow = await prisma.seat.findMany({
            where: {
                row: row,
                number: {
                    lte: seatsInRow
                },
                bookedSeats: {
                    none: {} // No booking records
                }
            },
            take: numberOfSeats,
            orderBy: {
                number: 'asc'
            }
        });
    // console.log(`availableseatsinrow ${availableSeatsInRow}`)
        if (availableSeatsInRow.length >= numberOfSeats) {
            return availableSeatsInRow.slice(0, numberOfSeats);
        }
    }

    // If no seats available in same row, find any available seats
    const availableSeats = await prisma.seat.findMany({
        where: {
            bookedSeats: {
                none: {}
            }
        },
        take: numberOfSeats,
        orderBy: [
            { row: 'asc' },
            { number: 'asc' }
        ]
    });

    return availableSeats;
}

// Additional helper endpoints you might want to add:

export const getAvailableSeats = async (req, res) => {
    try {
        const availableSeats = await db.seat.findMany({
            where: {
                bookedSeats: {
                    none: {}
                }
            },
            orderBy: [
                { row: 'asc' },
                { number: 'asc' }
            ]
        });

        return res.status(200).json({
            success: true,
            availableSeats
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.userId;

        const booking = await db.booking.findFirst({
            where: {
                id: parseInt(bookingId),
                userId: userId
            }
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        await db.$transaction([
            // Delete booked seats
            db.bookedSeat.deleteMany({
                where: {
                    bookingId: parseInt(bookingId)
                }
            }),
            // Update booking status
            db.booking.update({
                where: {
                    id: parseInt(bookingId)
                },
                data: {
                    status: 'CANCELLED'
                }
            })
        ]);

        return res.status(200).json({
            success: true,
            message: "Booking cancelled successfully"
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const allseats = async (req, res) => {
    try {
        // Fetch all booked seats with their seat details
        const bookedSeats = await db.bookedSeat.findMany({
            where: {
                booking: {
                    status: 'CONFIRMED' // Only get seats from confirmed bookings
                }
            },
            include: {
                seat: true, // Include the seat details
                booking: {
                    select: {
                        status: true,
                        bookedAt: true
                    }
                }
            }
        });

        // Transform the data to include only necessary information
        const formattedSeats = bookedSeats.map(booking => ({
            id: booking.seat.id,
            row: booking.seat.row,
            number: booking.seat.number,
            bookingStatus: booking.booking.status,
            bookedAt: booking.booking.createdAt
        }));

        return res.status(200).json({
            success: true,
            bookedSeats: formattedSeats
        });
    } catch (error) {
        console.error("Error fetching booked seats:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch booked seats"
        });
    }
};
