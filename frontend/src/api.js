import axios from "axios";


const API_URL = process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_API_URL
    : "http://localhost:5000";

axios.defaults.baseURL = API_URL;

export default axios;
