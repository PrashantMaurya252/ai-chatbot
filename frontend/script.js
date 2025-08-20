const input = document.querySelector('#input');
const chatContainer = document.querySelector('#chat-container')
const askBtn = document.querySelector('#ask')
console.log(input)

input?.addEventListener('keyup',handleEnter)
askBtn?.addEventListener('click',handleAsk)

async function generate(text){
    // append message to ui and send it to llm
    // append response to ui

    const msg = document.createElement('div')
    msg.className = 'my-6 bg-neutral-800 p-3 rounded-xl ml-auto max-w-fit'
    msg.textContent = text
    chatContainer?.appendChild(msg)
    input.value=''

    const assistantMessage = await callServer(text)

    const assistantMessageElem = document.createElement('div')
    assistantMessageElem.className = 'max-w-fit'
    assistantMessageElem.textContent = assistantMessage
    chatContainer?.appendChild(assistantMessageElem)
}

async function callServer(inputText){
    try {
        const response = await fetch(`http://localhost:3001/chat`,{
            method:"POST",
            headers:{
                "content-type":"application/json"
            },
            body:JSON.stringify({message:inputText})
        })

        if(!response.ok){
            throw new Error("Error generating the response.")
        }

        const result =await response.json()
        return result.message
    } catch (error) {
        throw new Error(error)
    }
}

async function handleAsk(e){
    const text = input.value.trim()
    if(!text){
        return
    }
    await generate(text)
}

async function handleEnter(e){
    const text = input?.value.trim()
    if(e.key === 'Enter'){
        if(!text){
            return
        }
        await generate(text)
    }
    
}