import {FastifyInstance} from "fastify";
import {getCalendarAvailability} from "../../controllers/calendar/calendar.controller";
import {getCalendarAvailabilitySchema} from "./calendar.schema";

interface ICalendarQueryRequest {
    date: string;
    products: Array<'SolarPanels' | 'Heatpumps'>;
    language: 'German' | 'English';
    rating: 'Gold' | 'Silver' | 'Bronze';
}

export const calendarRoutes = (server: FastifyInstance): void => {
    server.register(function (app, _, done) {
        app.post<{
            Body: ICalendarQueryRequest
        }>("/query", {
            schema: {
                tags: ['calendar'],
                ...getCalendarAvailabilitySchema
            }
        }, async (request) => {
            return getCalendarAvailability(request.body);
        });

        done();
    }, {prefix: '/calendar'});
};