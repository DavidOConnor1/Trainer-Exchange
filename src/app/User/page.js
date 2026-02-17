"use client";
import { Auth } from "../../../hooks/v1/signUser";
import { useAuth } from "../../../hooks/v1/useAuth";
export default function UsersPage() { 
 
  const {user, loading, signOut} = useAuth();

  if(loading) return <div> ...loading</div>

  return (
  <div className="">
    {user ? (
      <div className="fixed z-20 w-full h-16 max-w-lg -translate-x-1/2 bg-white border border-gray-200 rounded-full top-4 left-1/2 dark:bg-gray-700 dark:border-gray-600">
          <div className="grid h-full max-w-lg grid-cols-[70%_30%] mx-auto px-4">
            <div className="flex items-center">
              <h1 className="text-sm sm:text-base truncate">
                Welcome, {user.email}!
              </h1>
            </div>
            <div className="flex items-center justify-center">
             <h1>Hi</h1>
            </div>
          </div>
        </div>
    ) : (
      <>
        <Auth />
      </>
    )}
  </div>
);
}//end function