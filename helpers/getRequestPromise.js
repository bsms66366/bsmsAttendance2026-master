const axios = require('axios').default;

axios.get('https://placements.bsms.ac.uk/api/placements')
    .then(resp => {
        console.log(resp.data);
    })
    .catch(err => {
        // Handle Error Here
        console.error(err);
    });



const sendGetRequest = async () => {
    try {
        const resp = await axios.get('https://jsonplaceholder.typicode.com/posts');
        console.log(resp.data);
    } catch (err) {
        // Handle Error Here
        console.error(err);
    }
};

sendGetRequest();