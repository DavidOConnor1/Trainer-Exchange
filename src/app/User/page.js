"use client";
import { Auth } from "../../../hooks/v1/signUser";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib-supa/v1/api";
export default function UsersPage() { 
 //setting session to confirm if user is logged in
 const [session, setSession] = useState(null);

 const fetchSession = async () => {
  const currentSession = await supabase.auth.getSession();
  console.log(currentSession);
  setSession(currentSession.data);
 }//end fetch session

 //if something chnages with the site/app. It will reflect with this
  useEffect(() => {
    fetchSession();
  }, []); //end use Effect



  return(
   <div className="">
    <h1>User Form</h1>
    <Auth />
   </div>

  ); //end return

}//end function