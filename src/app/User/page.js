"use client";
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib-supa/v1/api';
export default function UsersPage() { //start function  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
  
  const [users, setUsers] = useState([])
  
  

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

  useEffect(() => {
    fetchUser();
  }, []);

  console.log(users);


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
      placeholder="Name"
      value={newUser.name}
      onChange={(e) =>
        setNewUser((prev) => ({ ...prev, name: e.target.value }))
      }
      style={inputStyle}
    />

    <input
      type="email"
      placeholder="Email"
      onChange={(e) =>
        setNewUser((prev) => ({ ...prev, email: e.target.value }))
      }
      required
      style={inputStyle}
    />

    <input
      type="password"
      placeholder="Enter Password"
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
</div>

  ); //end return

}//end function