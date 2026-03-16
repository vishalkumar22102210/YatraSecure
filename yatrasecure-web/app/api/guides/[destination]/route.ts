import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ destination: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { destination } = await params;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/trips/explore/guide/${destination}`, {
      method: 'GET',
      headers: { Authorization: authHeader },
    });
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
