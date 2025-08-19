import app from "./app.js";
import dotenv from 'dotenv';
// import createUserTable from './utils/createTable.js';

dotenv.config();

const port = process.env.PORT || 5000;

const start = async() => {
    // await createUserTable();
    app.listen(port, () => {
        console.log(`Server is running on port ${port}...`);
    });
}

start();