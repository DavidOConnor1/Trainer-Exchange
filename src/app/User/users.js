import { useState, useEffect } from 'react';
import api from '../../../lib-supa/api';

export default function UsersPage() { //start function
    const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ name: '', email: '' });

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
    try{ //start try/catch
        const createdUser = await api.createUser(newUser);
        setUsers([...users, createdUser]);
        setNewUser({name: '', email: ''});

    } catch (error){
        console.error('failed to created user: ', error);
    }//end try/catch
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

  ); //end return

}//end function