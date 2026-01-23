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
    
  }//end fetch users


}//end function