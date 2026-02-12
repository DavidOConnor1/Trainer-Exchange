"use client" //setups for client side server

import { useState, useEffect } from "react";
import { supabase } from "../../lib-supa/v1/api";
export const useUserProfile = () => {
  
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({text: '', type: ''});

  const fetchUser = async (id = number) => {//start fetch user
  try{// start try catch finally
    setLoading(true);
  const {error, data} = await supabase
        .from("USER TABLE")
        .select()
        .eq("id", id);
        

  if(error){ //start if
    console.error("There was an error retrieving the user from the database: ", error.message);
    setMessage({text: 'There was an error retrieving account', type: 'error'});
    return;
  }//end if

  setUsers(data); //displays the user data
  
  //if there is users retrieve the revelant data to display
  if(data && data.length > 0){//open if 
    const user = data[0];
    setCurrentUser(user);
    setNewName(user.name || '');
    setNewEmail(user.email || '');
  }//end if 
  } catch(error){
    console.error("There was an error fetching the user: ", error);
    setMessage({ text: "Error loading the profile"});
  } finally {
    setLoading(false);
  }//end try catch finally
 }//end fetch user

 //removes user from database
  const removeUser = async (id = number) => { //start remove user
   const {error} = await supabase
        .from("USER TABLE")
        .delete()
        .eq("id", id); //will remove the user if the id matches.

        //inform us of an error if there is one
        if(error){
          console.log("There was an error trying to remove user: ",error);
          setMessage({text: "could not communicate with the database to remove user"});
          return false;
        }//end if
        return true;
  };//end remove user

  //updates user in database
  const updateUser = async (id = number) => { //start update user

    setUpdating(true);
    setMessage({text: '', type: ''});

    //validate password confirmation
    if(password && password !== confirmPassword){//open if
      setMessage({text: 'Passwords do not match', type: 'error'});
      setUpdating(false);
      return false;
    }//end if 


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
        setMessage({text: 'email does not match format', type: 'error'});
        setUpdating(false);
        return false;
      }//end nest if else
    }//end if 

    //password updates
    if(newPassword && newPassword.trim() !== ''){//open if
      //password validation
      if(newPassword >= 6){ //open nested if 
        update.password = newPassword.trim();
      } else {
        setMessage({text: 'password does not match expected character length', type: 'error'});
        setUpdating(false);
        return false;
      }//end nest else if 
    }//end if 

    //don't make update call if there is nothing to update
    if(Object.keys(update).length === 0){
      setMessage({text: 'There are no updates to be made'});
      setUpdating(false);
      return false;
    }//end if 

    try{//open try catch finally
    //updates to the supabase table
   const {error} = await supabase
        .from("USER TABLE")
        .update(update)
        .eq("id", id); //updates user information based on their id 

        //inform us of an error if there is one
        if(error){
          console.log("There was an error trying to update user: ",error.message);
        }//end if

        //update password through supabase auth if password is changed
        if(password){ //open if 
          const {error: authError} = await supabase.auth.updateUser({
            password: password
          });

          if(authError){ //open nested if 
            console.log("There was an error updating the password", authError.message);
          }//end nested if
        }//end if 

        //notify the user their account is updated successfully 
        setMessage({text: 'Your profile has been updated successfully', type: 'success'});
        
        //reloads user account
        fetchUser(id);

        //clear password fields 
        setNewPassword('');
        setConfirmPassword('');

        return true;

      } catch(error) {
        console.log("There was an error trying to update user: ",error);
        setMessage({text: 'There was an error with updating the user profile', type: 'error'});
      } finally {
        setUpdating(false)
      } //end try catch finally
  };//end update user

  //blanks all fields in the form
  const resetform = () => { //open reset form
    //will reset to the users current name and email if they have them
    if(currentUser){//open if
      setNewName(currentUser.name || '');
      setNewEmail(currentUser.email || '');
    } //close if 
    setNewPassword('');
    setConfirmPassword('');
    setMessage({text: '', type: ''});
  }//close reset form

  const fetchCurrentUser= async() => {//open fetch current user

  } //close fetch current user


}//end useUserProfile
