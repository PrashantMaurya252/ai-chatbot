const input = document.querySelector('#input');
const chatContainer = document.querySelector('#chat-container')
console.log(input)

input?.addEventListener('keyup',handleEnter)

function generate(text){
    // append message to ui and send it to llm
    // append response to ui

    const msg = document.createElement('div')
    msg.className = 'my-6 bg-neutral-800 p-3 rounded-xl ml-auto max-w-fit'
    msg.textContent = text
    chatContainer?.appendChild(msg)
    input.value=''
}

function handleEnter(e){
    const text = input?.value.trim()
    if(e.key === 'Enter'){
        if(!text){
            return
        }
        generate(text)
    }
    
}