import { useState, useEffect } from 'react';
import { supabase } from '../../../lib-supa/v1/api';

export default function UsersPage() { //start function
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {//start fetchUsers
    try{//start try/catch/finally
        const data = await api.getUsers(); //data will hold the fetched user data
        setUsers(data); //will set the users with the retrieved data
    } catch(error){
        console.error('Failed to fetch users: ', error);

    } finally {
        setLoading(false);
    }//end try/catch/finally
  };//end fetch users

  const handleSubmit = async (e) => { //start handle submit
    e.preventDefault();

   await supabase
  };//end handle submit

  const handleDelete = async (id) => { //start handle delete
    try{// start try/catch
        await api.deleteUser(id);
        setUsers(users.filter(user => user.id !== id));
    }catch(error) {
        console.error('Failed to delete user: ',error);
    }//end try/catch
  }; //end handle delete

  if(loading) return <div>Loading...</div>;

  return(
    <div style={{ padding: '20px'}}>
      <h1>Users</h1>

      {/*Create user form */}

      <form onSubmit={handleSubmit} style={{marginBottom: '20px'}}>
          <input
            type="text"
            placeholder='Name'
            value={newUser.name}
            onChange={(e) => setNewUser({...newUser, name: e.target.value})}
            style={{ marginRight: '10px', padding: '5px'}}
            />

            <input
              type='email'
              placeholder='Email'
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              required
              style={{ marginRight: '10px', padding: '5px'}}
              />
              <button type='submit'>Add User</button>
      </form>

      {/*User list*/}
      <ul>
        {user.map(user => (
          <li key={user.id} style={{marginBottom: '10px'}}>
            {user.name} ({user.email})
            <button 
            onClick={() => handleDelete(user.id)}
            style={{ marginLeft: '10px', color: 'red'}}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  ); //end return

}//end function