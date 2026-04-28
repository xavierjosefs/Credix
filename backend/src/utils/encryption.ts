import crypto from 'crypto'

const algorithm = 'aes-256-cbc';
const secret = process.env.ENCRYPTION_KEY!;

export const  encrypt = (text: string) => {
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm,Buffer.from(secret), iv);

    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export const decrypt = (text: string) => {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0]!, 'hex');
    const encryptedText = Buffer.from(parts[1]!, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secret), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
}