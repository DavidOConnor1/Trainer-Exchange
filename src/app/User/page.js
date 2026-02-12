"use client";
import { Auth } from "../../../hooks/v1/signUser";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib-supa/v1/api";
export default function UsersPage() { 
 //setting session to confirm if user is logged in
 const [session, setSession] = useState(null);

 //if something chnages with the site/app. It will reflect with this
  useEffect(() => {
    const currentSession = await supabase.auth.getSession();
  })



  return(
   <div className="">
    <h1>User Form</h1>
    <Auth />
   </div>

  ); //end return

}//end function