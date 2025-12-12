let IS_PROD = process.env.NODE_ENV === "production";
const server = IS_PROD ?
    "https://meetsphere-backend.onrender.com" :

    "http://localhost:8000"


export default server;