"use server";

import { cookies } from "next/headers";

export const renderVideo = async (data) => {
  const req = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/render`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      Cookie: (await cookies()).toString(),
      "Content-Type": "application/json",
    },
  });
  const response = await req.json();
  return response;
};
