import {FastifyInstance} from "fastify";
import {calendarRoutes} from "./calendar/calendar.route";

export const setRoutes = (server: FastifyInstance): void => {
    calendarRoutes(server);
};