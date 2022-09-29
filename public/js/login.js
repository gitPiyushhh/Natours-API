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

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:8000/api/v1/users/logout'
    })

    if (res.data.status === 'success') location.reload(true) // We will just reload the server not from the client side but from the server side
  } catch (err) {
    console.log(err.response);
    showAlert('err', 'Error logging out, try again!')
  }
}
