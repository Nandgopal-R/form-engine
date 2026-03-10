import * as net from 'net';

const host = 'ep-shy-feather-a1cdrpo9.ap-southeast-1.aws.neon.tech';
const port = 5432;

console.log(`Connecting to ${host}:${port}...`);
const socket = net.connect(port, host, () => {
    console.log('Connected!');
    socket.destroy();
});

socket.on('error', (err) => {
    console.error('Connection failed:', err.message);
    process.exit(1);
});

setTimeout(() => {
    console.log('Timeout');
    socket.destroy();
    process.exit(1);
}, 5000);
