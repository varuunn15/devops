import axios from "axios";

export let api = axios.create({
  baseURL: "https://dummyjson.com",
});
