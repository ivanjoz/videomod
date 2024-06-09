setInterval(() => {
  console.log('worker.js is running');
},1000)

console.log(self.location)

const getWssAPI = () => {
  console.log(self.location.hostname === "0.0.0.0", !self.location.port)
  if(self.location.hostname === "0.0.0.0" || !self.location.port){
    console.log("retornando wss://pv5s7gfoge.execute-api.us-east-1.amazonaws.com/p/")
    return "wss://pv5s7gfoge.execute-api.us-east-1.amazonaws.com/p/"
  } else {
    console.log("retornando ws://127...")
    return "ws://127.0.0.1:3589/ws"
  }
}

const ws = new WebSocket(getWssAPI())

onmessage = function(e) {

  console.log('Worker: Message received from main script');
  const result = e.data[0] * e.data[1];
  if (isNaN(result)) {
    postMessage('Please write two numbers');
  } else {
    const workerResult = 'Result: ' + result;
    console.log('Worker: Posting message back to main script');
    postMessage(workerResult);
  }
}