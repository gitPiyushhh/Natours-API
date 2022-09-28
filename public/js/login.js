import axios from 'axios';
import { showAlert } from './alerts';


// Export this from hera and use in the index.js file
export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:8000/api/v1/users/login',
      data: { 
        email,
        password
      }
    }) 
    
    if(res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      // Reload the window automatically and get the request
      window.setTimeout(()=> {
        location.assign('/') // Send the user to the homepage through location.assign('/)
      }, 1500)
    }
  }
  catch (err) {
    showAlert('error', err.response.data.message); // Here this is not the normal 'res' coz its the axios error & has the response as argument
  }
}

