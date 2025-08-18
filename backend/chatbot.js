export async function generate(userMessage) {

  const rl = readline.createInterface({input:process.stdin,output:process.stdout})

    const question = await rl.question('You:')
    // bye
    // if(question === 'bye'){
    //   break
    // }
    messages.push({
      role:'user',
      content:userMessage
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
        // console.log(`Assistant: ${completions.choices[0].message.content}`)
        return completions.choices[0].message.content
        
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
  
  rl.close()
}