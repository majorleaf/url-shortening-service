const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
const BASE = ALPHABET.length;




export function encodeIdToBase62(num) {
     if (num === 0) return ALPHABET[0];

     let encodedString = "";

     while (num > 0) {

        encodedString = ALPHABET[num % BASE ] + encodedString;

        num = Math.floor(num / BASE);
     }

     return encodedString;
}