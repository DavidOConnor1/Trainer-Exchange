import { useState, useEffect, useCallback } from "react";
import api from "../../lib/supabase/api";

export function useUsers() {
  //start use users function
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      //start try/catch/finally
      setLoading(true);
      setError(null);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    } //end try/catch/finally
  }, []); //end fetch users

  const createUser = async (userData) => {
    //start create user
    try {
      //start try/catch
      const newUser = await api.createUser(userData);
      setUsers((prev) => [...prev, newUser]);
      return newUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } //end try/catch
  }; //end create user

  const deleteUser = async (id) => {
    //start delete
    try {
      // start try/catch
      await api.deleteUser(id);
      setUsers((prev) => prev.filter((user) => user.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    } //end try/catch
  }; //end delete user

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    deleteUser,
  };
} //end use users function
