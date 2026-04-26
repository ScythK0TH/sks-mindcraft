import OpenAIApi from 'openai';
import { getKey, hasKey } from '../utils/keys.js';
import { strictFormat } from '../utils/text.js';

export class NvidiaNIM {
    static prefix = 'nvidia';
    constructor(model_name, url) {
        this.model_name = model_name;

        let config = {};
        config.baseURL = url || process.env.NVIDIA_NIM_URL || process.env.NVIDIA_API_URL || 'https://integrate.api.nvidia.com/v1';

        let apiKey = null;
        if (hasKey('NVIDIA_NIM_API_KEY')) {
            apiKey = getKey('NVIDIA_NIM_API_KEY');
        } else if (hasKey('NVIDIA_API_KEY')) {
            apiKey = getKey('NVIDIA_API_KEY');
        } else if (hasKey('VERCEL_AI_GATEWAY_API_KEY')) {
            apiKey = getKey('VERCEL_AI_GATEWAY_API_KEY');
        }

        if (apiKey) {
            config.apiKey = apiKey;
        }

        this.openai = new OpenAIApi(config);
    }

    async sendRequest(turns, systemMessage, stop_seq='*') {
        let messages = [{ role: 'system', content: systemMessage }, ...turns];
        messages = strictFormat(messages);

        // Choose a valid OpenAI-compatible model for Nvidia NIM
        const pack = {
            model: this.model_name,
            messages,
            stop: stop_seq
        };

        let res = null;
        try {
            console.log('Awaiting Nvidia NIM api response...');
            let completion = await this.openai.chat.completions.create(pack);
            if (!completion?.choices?.[0]) {
                console.error('No completion or choices returned:', completion);
                return 'No response received.';
            }
            if (completion.choices[0].finish_reason === 'length') {
                throw new Error('Context length exceeded');
            }
            console.log('Received.');
            res = completion.choices[0].message.content;
        } catch (err) {
            console.error('Error while awaiting response:', err);
            // If the error indicates a context-length problem, we can slice the turns array, etc.
            res = 'My brain disconnected, try again.';
        }
        return res;
    }

    async sendVisionRequest(messages, systemMessage, imageBuffer) {
        const imageMessages = [...messages];
        imageMessages.push({
            role: "user",
            content: [
                { type: "text", text: systemMessage },
                {
                    type: "image_url",
                    image_url: {
                        url: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
                    }
                }
            ]
        });
        
        return this.sendRequest(imageMessages, systemMessage);
    }

    async embed(text) {
        throw new Error('Embeddings are not supported by Nvidia NIM.');
    }
}