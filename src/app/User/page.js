"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib-supa/v1/api';
export default function UsersPage() { //start function  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
  
  const [users, setUsers] = useState([])
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  

 const fetchUser = async () => {//start fetch user
  //pulls all users from the database in the ascending order of creation
  const {error, data} = await supabase
        .from("USER TABLE")
        .select("*")
        .order("created_at", {ascending: true});

  if(error){ //start if
    console.error("There was an error retrieving the users from the database: ", error.message);
    return;
  }//end if

  setUsers(data);

 }//end fetch user


  //adds user to database
  const handleSubmit = async (e) => { //start handle submit
    e.preventDefault();

   const {error,data} = await supabase
        .from("USER TABLE")
        .insert(newUser)
        .single();

        //inform us of an error if there is one
        if(error){
          console.log("There was an error trying to make a new user: ",error.message);
        }//end if

        setNewUser({name: '', email: '', password: ''});
  };//end handle submit


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

   //removess user from database
  const updateUser = async (id = number) => { //start remove user

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



   const {error} = await supabase
        .from("USER TABLE")
        .update(update)
        .eq("id", id); //updates user information based on their id 

        //inform us of an error if there is one
        if(error){
          console.log("There was an error trying to update user: ",error.message);
        }//end if
  };//end remove user
      

  useEffect(() => {
    fetchUser();
  }, []);

  


  //CSS Effects

  const inputStyle = {
  padding: '12px',
  borderRadius: '10px',
  border: 'none',
  outline: 'none',
  fontSize: '14px',
};

const buttonStyle = {
  padding: '12px',
  borderRadius: '12px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 'bold',
  background: 'linear-gradient(135deg, #ff9966, #ff5e62)',
  color: '#fff',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
};


  

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
  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
          <textarea placeholder='updated password'
            onChange={(e) => setNewPassword(e.target.value)} />
          <button style={{ padding: "0.5rem 1rem", marginRight: "0.5rem"}} 
          onClick={() => updateUser(user.id)}>
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