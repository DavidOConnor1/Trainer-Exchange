"use client";
import { Auth } from "../../../hooks/v1/signUser";
import { useAuth } from "../../../hooks/v1/useAuth";
export default function UsersPage() { 
 
  const {user, loading, signOut} = useAuth();

  if(loading) return <div> ...loading</div>

  return (
    <div className="">
      {user ? (
        <div>
          <h1>Welcome, {user.email}!</h1>
          <button onClick={() => signOut()}>Sign Out</button>
        </div>
      ) : (
        <>
          
          <Auth />
        </>
      )}
    </div>
  );

}//end function