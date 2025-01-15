import {sum} from "./main";

describe('Main', () => {
    it('should sum', () => {
        expect(sum(1,2)).toEqual(3)
    });
})