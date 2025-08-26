import * as https from 'https';
import { ConfigKeys, ConfigurationManager } from './config';

function getGroqHeaders(apiKey: string) {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };
}

function makeGroqRequest(data: any, apiKey: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: getGroqHeaders(apiKey)
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(responseData);
          if (jsonResponse.error) {
            reject(new Error(jsonResponse.error.message || 'Groq API Error'));
          } else {
            resolve(jsonResponse.choices[0]?.message?.content);
          }
        } catch (error) {
          reject(new Error('Failed to parse Groq API response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(JSON.stringify(data));
    req.end();
  });
}

export async function GroqAPI(messages: any[]) {
  const configManager = ConfigurationManager.getInstance();
  const apiKey = configManager.getConfig<string>(ConfigKeys.GROQ_API_KEY);
  const model = configManager.getConfig<string>(ConfigKeys.GROQ_MODEL);
  const temperature = configManager.getConfig<number>(ConfigKeys.GROQ_TEMPERATURE, 0.7);

  if (!apiKey) {
    throw new Error('Groq API Key not configured');
  }

  const data = {
    model: model || 'llama-3.3-70b-versatile',
    messages: messages,
    temperature
  };

  return makeGroqRequest(data, apiKey);
}
