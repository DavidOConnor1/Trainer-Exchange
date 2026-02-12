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

