import {useState} from 'react';
import { supabase } from '../../lib-supa/v1/api';

export const Auth = () => {//open export auth
    const [isSignUp, setIsSignedUp] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async() => {//open handle submit
        e.preventDefault();
        
        //creating a new user object to load all the fields into the sign up with validations.
        //A lot of the code will be similar to the profile settings but code like this tends to overlap
        const newUser = {};

    //only adds fields with text, if empty do not update
    if(name && name.trim() !== ''){ //open if
      newUser.name = name.trim();
    }//end if 

    //email updates
    if(email && email.trim() !== ''){//open if 
      //email regex 
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      //tests if the email entered follows the email validation
      if(emailRegex.test(email.trim())){ //open nested if
        newUser.email = email.trim();
      }//end nested if
    }//end if 

    //password
    if(password && password.trim() !== ''){//open if
      //password validation
      if(password >= 6){ //open nested if 
        update.password = password.trim();
      } //end nested if
    }//end if 

    //don't make update call if there is nothing to update
    if(Object.keys(update).length === 0){
      setMessage({text: 'There are no updates to be made'});
      setUpdating(false);
      return false;
    }//end if 

        if(isSignUp) {//open if
            const {error} = await supabase.auth.signUp();

        }else {

        }//end else 
    }//close handlesubmit

}//end export auth