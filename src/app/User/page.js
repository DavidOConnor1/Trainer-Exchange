"use client";
import { Auth } from "../../../hooks/v1/signUser";
import { useState } from "react";
export default function UsersPage() { //start function  const [loading, setLoading] = useState(true);
 
      

 

  


 

  

  return(
   <div className="">
    <h1>User Form</h1>
    <Auth />
   </div>

  ); //end return

}//end function