// /api/clerk/webhook
import { db } from '@/server/db';

export const POST = async (req: Request) => {
    try {
      const { data } = await req.json();
      console.log('Webhook data:', data);
      const emailAddress = data.email_addresses[0].email_address;
      const firstName = data.first_name;
      const lastName = data.last_name;
      const imageUrl = data.image_url;
      const id = data.id;
      await db.user.create({
        data: {
          id: id,
          emailAddress: emailAddress,
          firstName: firstName,
          lastName: lastName,
          imageUrl: imageUrl,
        }
      })
      console.log('User created:', { emailAddress, firstName, lastName, imageUrl, id });
      return new Response('Webhook received', { status: 200 });
    } catch (error) {
      console.error('Error parsing webhook data:', error);
      return new Response('Invalid webhook data', { status: 400 });
    }
  };
  