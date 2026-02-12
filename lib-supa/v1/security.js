import bcrypt from 'bcrypt';

export const hashpassword = async(password) => {//start hash password
    //generates the salt and hash for passwords
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
}//end hash password 

//verifies the password to the hash
 export const verifyPassword = async(password, hash) => {//start verify password
        const isValid = await bcrypt.compare(password, hash);
        return isValid;
    }//end verify password

export const safeCompare = async() => {//start safe compare
    if(typeof a !== 'string' || typeof b !== 'string') return false;

    let mismatch = a.length === b.length ? 0: 1;
    if(mismatch) return false;

    //
    for(let i=0; i < a.length; i++ ){
        mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return mismatch;
}//end safe comapre

export const timingPrevention = async(attempts =1) => {//start timing prevention
    //creates a visible delay to prevent attackers to track how long a login will take
    const delay = Math.min(100* Math.pow(2, attempts - 1), 3000);
    await new Promise(resolve => setTimeout(resolve, delay));
}//end timing prevention

export const generateSecureToken = (length = 32) => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}//end generate secure token

//prevent injection attacks
export const sanitizeInput = (input) => {
      if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '');
}

