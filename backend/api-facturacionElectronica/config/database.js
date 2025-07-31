const dbConfig = {
    
    server: process.env.DB_HOST,
   
    dialect: "mssql",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        trustedConnection: true,  
        connectionTimeout: 30000,
        port: parseInt(process.env.DB_PORT,10),
    },
};

export default dbConfig;