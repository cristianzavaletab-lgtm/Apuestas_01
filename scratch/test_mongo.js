const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = 'mongodb+srv://cristianzavaletab_db_user:drr8JThlixKPjJ2P@cluster0.4myhoq4.mongodb.net/sportspred?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
    console.log('Intentando conectar a MongoDB Atlas...');
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ CONEXIÓN EXITOSA: El Whitelist (0.0.0.0/0) está funcionando.');
        process.exit(0);
    } catch (err) {
        console.error('❌ FALLO DE CONEXIÓN:', err.message);
        process.exit(1);
    }
}

testConnection();
