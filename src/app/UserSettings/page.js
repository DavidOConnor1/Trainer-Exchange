"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib-supa/v1/api';
export default function UsersSettingsPage() { //start function  
  const [currentUser, setCurrentUser] = useState({ name: '', email: '', password: '' });
  const [users, setUsers] = useState([]);
  const [newName, setNewName] = useState([""]);
  const [newEmail, setNewEmail] = useState([""]);
  const [newPassword, setNewPassword] = useState([""]);
  
  
  

 const fetchUser = async (id = number) => {//start fetch user
  //pulls all users from the database in the ascending order of creation
  const {error, data} = await supabase
        .from("USER TABLE")
        .select()
        .eq("id", id);
        

  if(error){ //start if
    console.error("There was an error retrieving the user from the database: ", error.message);
    return;
  }//end if

  setUsers(data); //displays the user data

 }//end fetch user


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

   
  const updateUser = async (id = number) => { //start remove user
   const {error} = await supabase
        .from("USER TABLE")
        .update({name: newName},{email: newEmail}, {password: newPassword})
        .eq("id", id); //updates user information based on their id 

        //inform us of an error if there is one
        if(error){
          console.log("There was an error trying to update user: ",error.message);
        }//end if
  };//end remove user

  useEffect(() => {
    fetchUser();
  }, []);

  





  

  return(
    <div
  style={{
    padding: '30px',
    maxWidth: '500px',
    margin: '0 auto',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    color: '#fff',
  }}
>
  <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>
    👥 Users
  </h1>

  {/* Create user form */}
  <form onSubmit={updateUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <input
      type="text"
      placeholder="Name*"
      value={newUser.name}
      onChange={(e) =>
        setNewUser((prev) => ({ ...prev, name: e.target.value }))
      }
      style={inputStyle}
    />

    <input
      type="email"
      placeholder="Email*"
      onChange={(e) =>
        setNewUser((prev) => ({ ...prev, email: e.target.value }))
      }
      required
      style={inputStyle}
    />

    <input
      type="password"
      placeholder="Enter Password*"
      onChange={(e) =>
        setNewUser((prev) => ({ ...prev, password: e.target.value }))
      }
      required
      style={inputStyle}
    />

    <button type="submit" style={buttonStyle}>
      ➕ Add User
    </button>
  </form>

  <ul style={{marginTop: "10px"}}>
    {users.map((user, key) => (
    <li 
    key={key}
    style={{
      border: "1px solid #ccc",
      borderRadius: "4px",
      padding: "1rem",
      marginBottom: "0.5rem",
    }}
    >
      <div>
        <h3>{user.name}</h3>
        <p>{user.email}</p>
        <div> 
            <textarea placeholder='updated name...'
            onChange={(e) => setNewName(e.target.value)} />
          <textarea placeholder='updated email...' 
          onChange={(e) => setNewEmail(e.target.value)}/>
          <button style={{ padding: "0.5rem 1rem", marginRight: "0.5rem"}} 
          onClick={() => updateUser(user.id)}>
            <textarea placeholder='updated password'
            onChange={(e) => setNewPassword(e.target.value)} />
              Edit
          </button>
          <button style={{padding: "0.5rem 1rem"}} onClick={() => removeUser(user.id)}>Delete</button>
        </div>
      </div>
    </li>
    ))}
  </ul>


</div>

  ); //end return

}//end function