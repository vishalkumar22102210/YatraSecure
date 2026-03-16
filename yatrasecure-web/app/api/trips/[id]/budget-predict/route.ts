import { NextResponse } from 'next/server';
import { getAccessToken } from '@/app/lib/api';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/trips/${id}/budget-predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      // empty body since the backend pulls trip data from DB
      body: JSON.stringify({}),
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
