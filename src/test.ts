import {db} from "@/server/db";

await db.user.create({
    data:{
        emailAddress:'huydoan@gmail.com',
        firstName:'Huy',
        lastName:'Doan',
    }
})

console.log('Done');