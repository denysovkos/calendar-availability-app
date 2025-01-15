import fs from 'node:fs';
import path from 'node:path';

export const generateResourceName = (
    serviceName: string,
    stage: string,
    resource: string
) => {
    return `${stage}-${resource}-${serviceName}`
}

export const getGitRepositoryName = (): string => {
    const gitConfigPath = path.join(process.cwd(), '.git', 'config');

    if (!fs.existsSync(gitConfigPath)) {
        throw new Error('Not a git repository (or .git/config not found)');
    }

    const configContent = fs.readFileSync(gitConfigPath, 'utf8');

    // Look for the remote "origin" url
    const urlMatch = configContent.match(/\[remote "origin"][\s\S]*?url = (.+)[\s\n]/);

    if (!urlMatch) {
        throw new Error('No remote "origin" found in git config');
    }

    const url = urlMatch[1].trim();

    // For SSH URLs like: git@github.com:username/repo-name.git
    if (url.includes('@')) {
        const sshMatch = url.match(/[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
        if (sshMatch) return sshMatch[2];
    }

    // For HTTPS URLs like: https://github.com/username/repo-name.git
    const httpsMatch = url.match(/\/([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (httpsMatch) return httpsMatch[2];

    throw new Error('Could not parse repository name from git URL');
}