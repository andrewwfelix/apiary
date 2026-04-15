const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

async function generateAdvice(userQuery) {
    try {
        // 1. Load Config
        const config = await fs.readJson('./config/advice.json');
        
        // 2. Aggregate Context Files
        let fileContext = "--- START OF FILE CONTEXT ---\n";
        for (const filePath of config.context_files) {
            if (await fs.pathExists(filePath)) {
                const content = await fs.readFile(filePath, 'utf8');
                fileContext += `\nFILE: ${filePath}\nCONTENT:\n${content}\n`;
            }
        }
        fileContext += "\n--- END OF FILE CONTEXT ---";

        // 3. Construct the Payload
        const payload = {
            model: config.selected_model,
            messages: [
                { role: "system", content: config.system_prompt },
                { role: "user", content: `${fileContext}\n\nUSER QUERY: ${userQuery}` }
            ],
            temperature: config.temperature
        };

        // 4. Call OpenRouter
        console.log(`🚀 Requesting advice from ${config.selected_model}...`);
        const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", payload, {
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        const advice = response.data.choices[0].message.content;
        
        // 5. Output Advice
        console.log("\n--- AI ADVICE ---");
        console.log(advice);
        
        // Optional: Save to a log
        await fs.appendFile('./logs/advice-history.log', `\n\n--- ${new Date().toISOString()} ---\n${advice}`);

    } catch (error) {
        console.error("Error generating advice:", error.response ? error.response.data : error.message);
    }
}

// Get query from command line arguments
const query = process.argv.slice(2).join(" ") || "Review my current progress and suggest next steps.";
generateAdvice(query);