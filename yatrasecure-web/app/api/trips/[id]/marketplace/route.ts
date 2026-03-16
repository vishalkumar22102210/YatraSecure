import { NextResponse } from 'next/server';
import { getAccessToken } from '@/app/lib/api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/trips/${id}/marketplace`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
