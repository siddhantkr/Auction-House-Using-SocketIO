const axios = require('axios');
const fetch = require('node-fetch');

var answer = 'hey there';

function temp(start) {
    

    (async () => {
        console.log(start);
        const rawResponse = await fetch('http://localhost:5000/predictionAPI', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(start)
        });
        const content = await rawResponse.json();
      
        console.log(content);
        
        // answer = content;

        return answer;
      })();
      
}

module.exports = {temp,answer};