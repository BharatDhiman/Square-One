const numberInput = document.getElementById('number'),
    button = document.getElementById('button'),
    response = document.querySelector('.response');

button.addEventListener('click', send, false);

function send() {
    const number = numberInput.value.replace(/\D/g, '');
  //  const text = textInput.value;

    fetch('/', {
        method: 'post',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({number: number})
    })
    .then((res)=>{
        console.log(res);
    })
    .catch((err)=>{
        console.log(err);
    })
}