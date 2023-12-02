import crypto from 'node:crypto'
import fs from 'fs'

const generateKeyPair = () => {
    crypto.generateKeyPair('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    }, (err, publicKey, privateKey) => {
        if (err) {
            console.error(err);
        }

        fs.writeFile('../publicKey.pem', publicKey, (error) => {
            if (err) {
                console.error(error)
            }
        });

        fs.writeFile('../privateKey.pem', privateKey, (error) => {
            if(err) {
                console.error(error)
            }
        })
    })
}

generateKeyPair()