const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = 'mongodb+srv://cristianzavaletab_db_user:drr8JThlixKPjJ2P@cluster0.4myhoq4.mongodb.net/sportspred?retryWrites=true&w=majority&appName=Cluster0';

// Esquema simplificado para la inyección
const userSchema = new mongoose.Schema({
    username: String,
    password: { type: String, required: true },
    nombre: String,
    apellido: String,
    dni: String,
    role: { type: String, default: 'user' },
    tokens: { type: Number, default: 0 }
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function seedAdmin() {
    console.log('--- Iniciando Sincronización Atlas ---');
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado a MongoDB Atlas.');

        const adminData = {
            username: 'cristian',
            password: '$2b$10$xms8Lwne6HzC/GtUoVmQJeBz4BSw8SG7cGC4.VUYFHnCKAfprL2my', // Hash de 60253405Cz
            nombre: 'cristian',
            apellido: 'Zavaleta',
            dni: '60253405',
            role: 'admin',
            tokens: 50
        };

        // Upsert para no duplicar
        const result = await User.findOneAndUpdate(
            { username: 'cristian' },
            adminData,
            { upsert: true, new: true }
        );

        console.log(`✅ Usuario [${result.username}] sincronizado en la nube con rol: ${result.role}`);
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Error en la sincronización:', err.message);
        process.exit(1);
    }
}

seedAdmin();
