import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Extract all query parameters from the incoming request
  const searchParams = request.nextUrl.searchParams;

  // The base URL for the local destination
  const destinationUrl = new URL('http://localhost:3001/api/oauth/instagram/callback');

  // Append each existing query parameter exactly as-is to the destination
  searchParams.forEach((value, key) => {
    destinationUrl.searchParams.append(key, value);
  });

  // Handle Instagram's `#_` fragment quirk:
  // Since HTTP requests do not transmit the URL fragment to the server, 
  // the server-side code here does not see the `#_`. 
  // However, modern browsers automatically preserve the original fragment 
  // and append it to the new URL during a 302 redirect.
  // By appending an empty fragment (`#`) to the end of our destination URL,
  // we force the browser to replace the `#_` with an empty fragment, 
  // effectively stripping it so it doesn't break the destination backend/frontend.
  const finalRedirectUrl = destinationUrl.toString() + '#';

  // Perform a 302 redirect
  return NextResponse.redirect(finalRedirectUrl, 302);
}
