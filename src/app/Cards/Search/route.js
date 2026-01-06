export async function GET(request){
    try{
        const { searchParams} = new URL(request.url);
        const name = searchParams.get('name');
    } catch(err){

    }//end catch
}//end export