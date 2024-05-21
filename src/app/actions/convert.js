"use server";
import { cookies } from "next/headers";

export const convert = async (data) => {
  await fetch(process.env.NEXT_PUBLIC_APP_URL + "/api/convert", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: (await cookies()).toString(),
    },
    body: JSON.stringify(data),
  });
};
