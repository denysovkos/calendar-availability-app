import {getGitRepositoryName} from "./helpers";

describe('helpers', () => {
    it('should get repo name from .git', () => {
        const repoName = getGitRepositoryName();
        expect(repoName).toBe('service-template');
    });
})