const axios = require('axios');

const { BookingRepository } = require('../repository/index');
const { FLIGHT_SERVICE_PATH } = require('../config/serverConfig');
const { ServiceError } = require('../utils/errors');

class BookingService {
    constructor() {
        this.bookingRepository = new BookingRepository();
    }

    async createBooking(data) {
        try {
            
            const flightId = data.flightId;
            const getFlightRequestURL = `${FLIGHT_SERVICE_PATH}/api/v1/flights/${flightId}`;
            const response = await axios.get(getFlightRequestURL);
            const flightData = response.data.data;

            if(data.noOfSeats > flightData.totalSeats) {
                throw new ServiceError('Something went wrong in the booking process', 'Insufficient seats in the flight');
            }

            let priceOfTheFlight = flightData.price;
            const totalCost = priceOfTheFlight * data.noOfSeats;

            const bookingPayload = {...data, totalCost}; // added totalCost to the data from the client 
            const booking = await this.bookingRepository.create(bookingPayload); // booking request sent 

            const updateFlightRequestURL = `${FLIGHT_SERVICE_PATH}/api/v1/flights/${booking.flightId}`;
            console.log(updateFlightRequestURL);

            await axios.patch(updateFlightRequestURL, {totalSeats: flightData.totalSeats - booking.noOfSeats}); // update the totalSeats available for that flight after booking 

            const finalBooking = await this.bookingRepository.update(booking.id, {status: "Booked"}); // update the status of booking 

            return finalBooking; // return the response
            
        } catch (error) { 
            console.log(error);
            if(error.name == 'RepositoryError' || error.name == 'ValidationError') {
                throw error;
            }
            throw new ServiceError();
        }
    }
}

module.exports = BookingService;