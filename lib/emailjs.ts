type StudentCredentials = {
  name: string;
  email: string;
  password: string;
  libraryName: string;
};

export async function sendStudentCredentials(credentials: StudentCredentials) {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    return { sent: false, reason: 'EmailJS is not configured' };
  }

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: {
        to_email: credentials.email,
        to_name: credentials.name,
        student_name: credentials.name,
        student_email: credentials.email,
        student_password: credentials.password,
        library_name: credentials.libraryName,
      },
    }),
  });

  if (!response.ok) throw new Error('EmailJS could not send the credentials');
  return { sent: true };
}