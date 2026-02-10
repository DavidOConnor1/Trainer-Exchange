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

  } finally {

  }//end try catch finally
 }//end fetch user

  
}//end useUserProfile
