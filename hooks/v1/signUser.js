import {useState} from 'react';
import { supabase } from '../../lib-supa/v1/api';

export const Auth = () => {//open export auth
    const [isSignUp, setIsSignedUp] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async(e) => {//open handle submit
        e.preventDefault();
        
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
      if(password.length >= 6){ //open nested if 
        newUser.password = password.trim();
      } //end nested if
    }//end if 


        if(isSignUp) {//open if
            const {error:signUpError} = await supabase.auth.signUp({name, email, password});

            //if error with sign up, it will throw a message
            if(signUpError){//open nested if
                console.error("There was an error with the sign up process: ", signUpError.message);
                return ;
            }//end nested if
        }else {
             const {error: signInError} = await supabase.auth.signInWithPassword({email, password});
            //if error with sign in, it will throw a message
            if(signInError){//open nested if
                console.error("There was an error with trying to sign in: ", signInError.message);
                return ;
            }//end nested if
        }//end else 
    }//close handlesubmit

    return(
       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
  <div className="max-w-md w-full space-y-8 bg-gray-950 p-10 rounded-2xl shadow-2xl border border-gray-800">
    
    {/* Header Section */}
    <div className="text-center">
      <h2 className="mt-6 text-3xl font-extrabold text-white">
        {isSignUp ? "Sign Up" : "Sign In"}
      </h2>
    </div>

    {/* Form */}
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="space-y-4">
        
        {/* Username Field - Conditional */}
        {isSignUp && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="ChooseYourUserName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="appearance-none block w-full pl-10 pr-3 py-3 bg-gray-900 border border-gray-700 rounded-lg placeholder-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm transition-all duration-200"
              />
            </div>
          </div>
        )}

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none block w-full pl-10 pr-3 py-3 bg-gray-900 border border-gray-700 rounded-lg placeholder-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm transition-all duration-200"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="password"
              placeholder="Minimum of 6 Characters is Required"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full pl-10 pr-3 py-3 bg-gray-900 border border-gray-700 rounded-lg placeholder-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-950 transition-all duration-200"
        >
          {isSignUp ? "Sign Up" : "Sign In"}
        </button>
      </div>

      {/* Toggle Button */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => setIsSignedUp(!isSignUp)}
          className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors duration-200"
        >
          Switch to {isSignUp ? "Sign In" : "Sign Up"}
        </button>
      </div>
    </form>
  </div>
</div>
    )
}//end export auth