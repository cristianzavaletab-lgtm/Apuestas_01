const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function testFlow() {
    const baseUrl = 'http://localhost:3000/api/auth';
    
    console.log('--- TEST 1: Registration ---');
    const regRes = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'test_user_77',
            password: 'testpassword123',
            nombre: 'Test',
            apellido: 'Bot',
            dni: '12344321', // 8 digits
            fechaNacimiento: '1990-01-01'
        })
    });
    
    const regData = await regRes.json();
    console.log('Reg Response:', regData);
    
    if (regRes.status !== 201) {
        console.error('Registration failed!');
        process.exit(1);
    }

    console.log('--- TEST 2: Check Persistence File ---');
    const dbPath = path.join(__dirname, '..', 'src', 'config', 'mem_db.json');
    if (fs.existsSync(dbPath)) {
        console.log('✅ mem_db.json exists!');
        const dbContent = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const userExists = dbContent.users.some(u => u[1].username === 'test_user_77');
        if (userExists) {
            console.log('✅ User test_user_77 found in persistence file!');
        } else {
            console.error('❌ User not found in persistence file!');
        }
    } else {
        console.error('❌ mem_db.json NOT found!');
    }

    console.log('--- TEST 3: Login with DNI ---');
    const loginRes = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: '12344321', // DNI login
            password: 'testpassword123'
        })
    });
    
    const loginData = await loginRes.json();
    console.log('Login Response:', loginData);
    
    if (loginRes.ok && loginData.token) {
        console.log('✅ Login with DNI successful!');
    } else {
        console.error('❌ Login with DNI failed!');
    }
}

testFlow().catch(err => {
    console.error('Test Error:', err);
});
