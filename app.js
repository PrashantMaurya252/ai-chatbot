import Groq from "groq-sdk";
import dotenv from "dotenv";
import { tavily } from "@tavily/core";
import readline from "node:readline/promises";
dotenv.config();

console.log(process.env.GROQ_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

// export async function main() {
//   const chatCompletion = await getGroqChatCompletion();
//   // Print the completion returned by the LLM.
//   console.log(chatCompletion.choices[0]?.message);
//   console.log(chatCompletion.choices[0]?.message?.content || "");
// }

function normalizeToolCalls(message) {
  // If Groq already returned structured tool_calls, just return it
  if (message.tool_calls) {
    return message;
  }

  // Otherwise parse the "<function=...>" style content
  if (message.content && message.content.startsWith("<function=")) {
    const match = message.content.match(/<function=(\w+)(.*)>/);
    if (match) {
      const functionName = match[1];
      const argsString = match[2];

      return {
        ...message,
        tool_calls: [
          {
            id: "tool_" + Date.now(),
            type: "function",
            function: {
              name: functionName,
              arguments: argsString,
            },
          },
        ],
      };
    }
  }

  // Fallback: return unchanged
  return message;
}

export async function getGroqChatCompletion() {
  return groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `You are smart personal assistant who answers the asked questions
        You have access to following tools:
        1. webSearch({query}:{query:string})  // Search the latest information and realtime data on internet
        `,
      },
      {
        role: "user",
        content: "when was iphone 16 launched ?",
        // content:"what is current weather in mumbai ?"
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "webSearch",
          description:
            "Search the latest information and realtime data on internet",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The search query to perform the search on.",
              },
            },
            required: ["query"],
          },
        },
      },
    ],
    tool_choice: "auto",

    // model: "openai/gpt-oss-20b",
  });
}

async function searchWeb({ query }) {
  console.log("Calling web search....")
  // const response = await tvly.search(query,{maxResults:1});
  const response = await tvly.search(query);
  // console.log("Response:",response)

  const finalResult = response.results
    ?.map((result) => result.content)
    .join("\n\n");
  // console.log("Final Result",finalResult)
  return finalResult;
}

const messages = [
  {
    role: "system",
    content: `You are smart personal assistant who answers the asked questions
        You have access to following tools:
        1. webSearch({query}:{query:string})  // Search the latest information and realtime data on internet
        `,
  },
  // {
  //   role: "user",
  //   // content:"when was iphone 16 launched ?"
  //   content: "what is current weather in mumbai ?",
  // },
];

async function main() {

  const rl = readline.createInterface({input:process.stdin,output:process.stdout})
  while (true) {
    const question = await rl.question('You:')
    // bye
    if(question === 'bye'){
      break
    }
    messages.push({
      role:'user',
      content:question
    })
    while (true) {
      const completions = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        temperature: 0,
        messages: messages,
        tools: [
          {
            type: "function",
            function: {
              name: "webSearch",
              description:
                "Search the latest information and realtime data on internet",
              parameters: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "The search query to perform the search on.",
                  },
                },
                required: ["query"],
              },
            },
          },
        ],
        tool_choice: "auto",
      });

      messages.push(completions?.choices[0].message);
      const toolCalls = completions.choices[0].message.tool_calls;
      console.log(completions.choices[0].message);

      if (!toolCalls) {
        console.log(`Assistant: ${completions.choices[0].message.content}`)
        break;
      }

      for (const tool of toolCalls) {
        // console.log("tool",tool)
        const functionName = tool.function.name;
        const functionParams = JSON.parse(tool.function.arguments);
        // console.log("Function name",tool.function.name)
        // console.log("Arguments",tool.function.arguments)

        if (functionName === "webSearch") {
          const toolResult = await searchWeb(functionParams);
          // console.log("Tool result: ",toolResult)
          messages.push({
            tool_call_id: tool.id,
            role: "tool",
            name: functionName,
            content: toolResult,
          });
          messages.push({
            role: "system",
            content:
              "Now answer the user's question using the tool result above.",
          });
        }
      }

      const completions2 = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        temperature: 0,
        messages: messages,
      });

      if (!completions2.choices[0].message.tool_calls) {
    console.log(`Assistant: ${completions2.choices[0].message.content}`);
    break;   // ✅ stop after final answer
  }
    }
  }
  rl.close()
}

main();
