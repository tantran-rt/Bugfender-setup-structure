import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

//Using axios to make requests to the server, used in the entire application
export default axios.create({
  baseURL: BASE_URL,
});
