import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

let secretsManager: SecretsManagerClient | null = null;

function getSecretsManager(): SecretsManagerClient {
    if (!secretsManager) {
        secretsManager = new SecretsManagerClient({
            region: process.env.VITE_AWS_REGION || 'ap-northeast-2'
        });
    }
    return secretsManager;
}

export async function getSecretValue(secretName: string): Promise<string> {
    const client = getSecretsManager();

    try {
        const command = new GetSecretValueCommand({
            SecretId: secretName
        });

        const response = await client.send(command);
        return response.SecretString || '';
    } catch (error) {
        console.error('Error retrieving secret:', error);
        throw error;
    }
}