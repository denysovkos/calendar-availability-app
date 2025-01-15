import {ManagerAvailabilityService} from "../../../application/service/managerAvailability.service";

export interface IGetAvailabilityRequest {
    date: string;
    products: string[];
    language: string;
    rating: string;
}

export interface IGetAvailabilityResponse {
    start_date: string;
    available_count: number;
}

export const getCalendarAvailability = async (request: IGetAvailabilityRequest): Promise<IGetAvailabilityResponse[]> => {
    const service = new ManagerAvailabilityService();
    return service.getAvailabilityInRuntime(request);
};