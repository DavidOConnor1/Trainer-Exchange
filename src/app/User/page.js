'use client'
import { useEffect, useState } from "react";
export default function Account() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch('http://localhost:4000/users/1');
      const data = await res.json();
      setUser(data);
    }
    fetchUser();
  }, []);

  if(!user) return <p>loading...</p>;
  return(
    <div>
<h1>User Info</h1>
<p><strong>ID:</strong> {user.id}</p>
<p><strong>Name:</strong> {user.name}</p>
  </div>
  );
}