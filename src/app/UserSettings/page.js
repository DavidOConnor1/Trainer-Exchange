"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib-supa/v1/api';
export default function UsersSettingsPage() { //start function  
  
  
  
  //removess user from database
  const removeUser = async (id = number) => { //start remove user
   const {error} = await supabase
        .from("USER TABLE")
        .delete()
        .eq("id", id); //will remove the user if the id matches.

        //inform us of an error if there is one
        if(error){
          console.log("There was an error trying to remove user: ",error.message);
        }//end if
  };//end remove user

   
 //updates user in database
  const updateProfile = async (id = number) => { //start update user

    const update = {}; //the update object will prevent unnessacary updates of values if there is no values

    //only adds fields with text, if empty do not update
    if(newName && newName.trim() !== ''){ //open if
      update.name = newName.trim();
    }//end if 

    //email updates
    if(newEmail && newEmail.trim() !== ''){//open if 
      //email regex 
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if(emailRegex.test(newEmail.trim())){ //open nested if
        update.email = newEmail.trim();
      }else {
        console.log("invalid email format");
        return;
      }//end nest if else
    }//end if 

    //password updates
    if(newPassword && newPassword.trim() !== ''){//open if
      //password validation
      if(newPassword >= 6){ //open nested if 
        update.password = newPassword.trim();
      } else {
        console.log("Password is less than 6 characters");
        return;
      }//end nest else if 
    }//end if 

    //don't make update call if there is nothing to update
    if(Object.keys(update).length === 0){
      console.log("there is nothing to update");
      return ;
    }//end if 


    //updates to the supabase table
   const {error} = await supabase
        .from("USER TABLE")
        .update(update)
        .eq("id", id); //updates user information based on their id 

        //inform us of an error if there is one
        if(error){
          console.log("There was an error trying to update user: ",error.message);
        }//end if
  };//end update user

  useEffect(() => {
    fetchUser();
  }, []);

  





  

 return(
  <div className="min-h-screen bg-gray-100 py-8 px-4">
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-8">
          <h1 className="text-3xl font-bold text-white text-center">
            👤 Profile Settings
          </h1>
          <p className="text-gray-300 text-center mt-2">
            Update your account information
          </p>
        </div>

        {/* Update User Form */}
        <form onSubmit={updateProfile} className="p-6 space-y-6">
          {/* Message Alert */}
          {message.text && (
            <div className={`p-4 rounded-lg ${message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Personal Information
            </h3>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Username
              </label>
              <input
                type="text"
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={updating}
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Email Address *
              </label>
              <input
                type="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={updating}
                required
              />
            </div>
          </div>

          {/* Change Password */}
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Change Password
            </h3>
            <p className="text-gray-600 text-sm">
              Leave blank to keep current password
            </p>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                New Password
              </label>
              <input
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={updating}
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={updating}
              />
            </div>
          </div>

          {/* Button Group */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={updating}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {updating ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </span>
              ) : 'Update Profile'}
            </button>
            
            <button
              type="button"
              onClick={resetForm}
              disabled={updating}
              className="w-full mt-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset Changes
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <p className="text-gray-600 text-sm text-center">
            Your information is secure and encrypted
          </p>
        </div>
      </div>
    </div>
  </div>
);

}//end function